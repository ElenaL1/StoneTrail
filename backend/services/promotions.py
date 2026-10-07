from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from core.roles import is_admin, is_editor
from core.slug import slugify
from models.catalog import Stone
from models.content import Promotion, PromotionLike, PromotionLine
from models.enums import BannerTemplate
from models.user import User
from repositories.promotions import PromotionRepository
from schemas.feed import (
    ActivePromotionOut,
    LikeOut,
    OfferPreviewOut,
    PromotionLineOut,
    PromotionLinesIn,
    PromotionOut,
    PromotionUpdate,
    PromotionWrite,
)
from services.audit import record_audit
from services.promotion_offers import PromotionOfferService

RESERVED_SLUGS = {"active", "manage"}


class PromotionService:
    def __init__(self, session: AsyncSession, storage=None) -> None:
        self._session = session
        self._repo = PromotionRepository(session)
        self._offers = PromotionOfferService(session, storage)

    async def list_public(self, viewer: User | None) -> list[PromotionOut]:
        rows = await self._repo.list_enabled()
        return await self._pack(rows, viewer)

    async def list_active(self) -> list[ActivePromotionOut]:
        rows = await self._repo.list_active(datetime.now(UTC))
        return [
            ActivePromotionOut(
                slug=row.slug,
                title=row.title,
                description=row.description,
                template=BannerTemplate(row.template),
                button_label=row.button_label,
                expires_at=row.expires_at,
            )
            for row in rows
        ]

    async def list_managed(self, *, deleted: bool) -> list[PromotionOut]:
        rows = await self._repo.list_managed(deleted=deleted)
        return await self._pack(rows, None)

    async def get(self, slug: str, viewer: User | None) -> PromotionOut:
        row = await self._repo.get_by_slug(slug)
        if row is None or not self._can_view(row, viewer):
            raise ApiError.not_found()
        packed = await self._pack([row], viewer, with_lines=True)
        return packed[0]

    async def preview_sheet(self, data: bytes, filename: str) -> OfferPreviewOut:
        return await self._offers.preview(data, filename)

    async def replace_lines(
        self, slug: str, payload: PromotionLinesIn, actor: User
    ) -> PromotionOut:
        row = await self._require(slug)
        await self._offers.replace(row, payload, actor)
        loaded = await self._repo.get_by_slug(row.slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor, with_lines=True)
        return packed[0]

    async def attach_sheet(
        self, slug: str, data: bytes, content_type: str, filename: str, actor: User
    ) -> PromotionOut:
        row = await self._require(slug)
        row.updated_by = actor.id
        await self._offers.attach_sheet(row, data, content_type, filename)
        loaded = await self._repo.get_by_slug(row.slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor, with_lines=True)
        return packed[0]

    async def create(self, payload: PromotionWrite, actor: User) -> PromotionOut:
        slug = await self._unique_slug(payload.slug or payload.title)
        row = Promotion(
            title=payload.title,
            description=payload.description,
            content=payload.content,
            template=payload.template.value,
            button_label=payload.button_label,
            inquiry_label=payload.inquiry_label,
            is_enabled=payload.is_enabled,
            publish_to_catalog=payload.publish_to_catalog,
            offer_note=payload.offer_note.strip(),
            expires_at=payload.expires_at,
            slug=slug,
            canonical_path=f"/promotions/{slug}",
            updated_by=actor.id,
        )
        self._repo.add(row)
        await self._session.flush()
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="promotion_create",
            entity_type="promotion",
            entity_id=str(row.id),
            detail={"slug": slug, "template": payload.template.value},
        )
        await self._session.commit()
        loaded = await self._repo.get_by_slug(slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor)
        return packed[0]

    async def update(
        self, slug: str, payload: PromotionUpdate, actor: User
    ) -> PromotionOut:
        row = await self._require(slug)
        if payload.title is not None:
            row.title = payload.title
        if payload.description is not None:
            row.description = payload.description
        if payload.content is not None:
            row.content = payload.content
        if payload.template is not None:
            row.template = payload.template.value
        if payload.button_label is not None:
            row.button_label = payload.button_label
        if payload.inquiry_label is not None:
            row.inquiry_label = payload.inquiry_label
        if payload.is_enabled is not None:
            row.is_enabled = payload.is_enabled
        if payload.publish_to_catalog is not None:
            row.publish_to_catalog = payload.publish_to_catalog
        if payload.offer_note is not None:
            row.offer_note = payload.offer_note.strip()
        if payload.sheet_image_url is not None:
            row.sheet_image_url = payload.sheet_image_url.strip()
        if payload.sheet_pdf_url is not None:
            row.sheet_pdf_url = payload.sheet_pdf_url.strip()
        if payload.expires_at is not None:
            row.expires_at = payload.expires_at
        if payload.slug is not None:
            row.slug = await self._unique_slug(payload.slug, exclude_id=row.id)
            row.canonical_path = f"/promotions/{row.slug}"
        elif payload.title is not None and not row.is_enabled:
            row.slug = await self._unique_slug(payload.title, exclude_id=row.id)
            row.canonical_path = f"/promotions/{row.slug}"
        row.updated_by = actor.id
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="promotion_update",
            entity_type="promotion",
            entity_id=str(row.id),
            detail={"slug": row.slug, "template": row.template},
        )
        await self._session.commit()
        loaded = await self._repo.get_by_slug(row.slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor)
        return packed[0]

    async def hide(self, slug: str, actor: User) -> None:
        if not is_admin(actor.role):
            raise AuthError.forbidden()
        row = await self._require(slug)
        row.deleted_at = datetime.now(UTC)
        row.updated_by = actor.id
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="promotion_delete",
            entity_type="promotion",
            entity_id=str(row.id),
            detail={"slug": row.slug},
        )
        await self._session.commit()

    async def restore(self, slug: str, actor: User) -> PromotionOut:
        if not is_admin(actor.role):
            raise AuthError.forbidden()
        row = await self._repo.get_by_slug(slug, include_deleted=True)
        if row is None or row.deleted_at is None:
            raise ApiError.not_found()
        if await self._repo.slug_taken(row.slug, exclude_id=row.id):
            raise ApiError.conflict(messages.SLUG_TAKEN)
        row.deleted_at = None
        row.updated_by = actor.id
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="promotion_restore",
            entity_type="promotion",
            entity_id=str(row.id),
            detail={"slug": row.slug},
        )
        await self._session.commit()
        loaded = await self._repo.get_by_slug(row.slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor)
        return packed[0]

    async def toggle_like(self, slug: str, user: User) -> LikeOut:
        row = await self._require(slug)
        if not row.is_enabled:
            raise ApiError.not_found()
        existing = await self._repo.get_like(user.id, row.id)
        if existing is None:
            self._repo.add_like(PromotionLike(user_id=user.id, promotion_id=row.id))
            liked = True
        else:
            await self._repo.delete_like(existing)
            liked = False
        await self._session.commit()
        counts = await self._repo.like_counts([row.id])
        return LikeOut(liked=liked, likes_count=counts.get(row.id, 0))

    async def _require(self, slug: str) -> Promotion:
        row = await self._repo.get_by_slug(slug)
        if row is None:
            raise ApiError.not_found()
        return row

    def _can_view(self, row: Promotion, viewer: User | None) -> bool:
        if row.is_enabled:
            return True
        return viewer is not None and is_editor(viewer.role)

    async def _unique_slug(
        self, source: str, *, exclude_id: uuid.UUID | None = None
    ) -> str:
        base = slugify(source, fallback="akciya")
        if base in RESERVED_SLUGS:
            base = f"{base}-akciya"
        candidate = base
        index = 2
        while await self._repo.slug_taken(candidate, exclude_id=exclude_id):
            candidate = f"{base}-{index}"
            index += 1
        return candidate

    async def _pack(
        self,
        rows: list[Promotion],
        viewer: User | None,
        *,
        with_lines: bool = False,
    ) -> list[PromotionOut]:
        ids = [row.id for row in rows]
        counts = await self._repo.like_counts(ids)
        liked = (
            await self._repo.liked_ids(viewer.id, ids) if viewer is not None else set()
        )
        line_counts = await self._repo.line_counts(ids)
        grouped = await self._repo.lines_for(ids) if with_lines else {}
        stone_slugs = await self._stone_slugs(grouped) if with_lines else {}
        return [
            PromotionOut(
                id=row.id,
                slug=row.slug,
                title=row.title,
                description=row.description,
                content=row.content,
                template=BannerTemplate(row.template),
                button_label=row.button_label,
                inquiry_label=row.inquiry_label,
                is_enabled=row.is_enabled,
                publish_to_catalog=row.publish_to_catalog,
                offer_note=row.offer_note,
                sheet_image_url=row.sheet_image_url,
                sheet_pdf_url=row.sheet_pdf_url,
                line_count=line_counts.get(row.id, 0),
                lines=[
                    _line_out(
                        item,
                        stone_slugs.get(item.stone_id) if item.stone_id else None,
                    )
                    for item in grouped.get(row.id, [])
                ],
                expires_at=row.expires_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
                likes_count=counts.get(row.id, 0),
                liked=row.id in liked,
                deleted=row.deleted_at is not None,
            )
            for row in rows
        ]

    async def _stone_slugs(
        self, grouped: dict[uuid.UUID, list[PromotionLine]]
    ) -> dict[uuid.UUID, str]:
        ids = {
            row.stone_id
            for lines in grouped.values()
            for row in lines
            if row.stone_id is not None
        }
        if not ids:
            return {}
        result = await self._session.scalars(select(Stone).where(Stone.id.in_(ids)))
        return {stone.id: stone.slug for stone in result.all()}


def _line_out(row: PromotionLine, stone_slug: str | None = None) -> PromotionLineOut:
    return PromotionLineOut(
        id=row.id,
        kind=row.kind,  # type: ignore[arg-type]
        group_name=row.group_name,
        stone_name=row.stone_name,
        label=row.label,
        stone_slug=stone_slug,
        finish=row.finish,
        length_mm=row.length_mm,
        width_mm=row.width_mm,
        thickness_mm=row.thickness_mm,
        height_mm=row.height_mm,
        weight_kg=row.weight_kg,  # type: ignore[arg-type]
        area_m2=row.area_m2,  # type: ignore[arg-type]
        price_amount=row.price_amount,  # type: ignore[arg-type]
        price_unit=row.price_unit,  # type: ignore[arg-type]
        unresolved=row.unresolved,
        sort_order=row.sort_order,
    )
