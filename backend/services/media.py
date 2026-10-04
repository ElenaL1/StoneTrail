from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from models.catalog import BlockLot, Product, Stone
from models.enums import MediaOwner
from models.media import Media, MediaLink
from models.user import User
from schemas.user import CamelModel
from services.media_storage import (
    ALLOWED_TYPES,
    MAX_IMAGE_BYTES,
    ObjectStorage,
    detect_image,
)

OWNER_MODELS = {
    MediaOwner.STONE: Stone,
    MediaOwner.BLOCK_LOT: BlockLot,
    MediaOwner.PRODUCT: Product,
}


class PresignIn(CamelModel):
    content_type: str
    size_bytes: int


class PresignOut(CamelModel):
    storage_key: str
    upload_url: str
    public_url: str
    headers: dict[str, str]


class MediaConfirmIn(CamelModel):
    storage_key: str
    alt: str
    content_type: str
    size_bytes: int


class MediaOut(CamelModel):
    id: uuid.UUID
    public_url: str
    alt: str
    mime_type: str
    size_bytes: int


class MediaLinkIn(CamelModel):
    owner_type: MediaOwner
    owner_slug: str
    is_primary: bool = False
    sort_order: int = 0


class MediaLinkOut(CamelModel):
    id: uuid.UUID
    media_id: uuid.UUID
    owner_type: MediaOwner
    owner_slug: str
    is_primary: bool
    public_url: str
    alt: str


class MediaService:
    def __init__(self, session: AsyncSession, storage: ObjectStorage) -> None:
        self._session = session
        self._storage = storage

    async def list_media(self) -> list[MediaOut]:
        result = await self._session.execute(
            select(Media).order_by(Media.created_at.desc())
        )
        return [_media_out(row) for row in result.scalars().all()]

    def presign(self, payload: PresignIn) -> PresignOut:
        content_type = payload.content_type.strip().lower()
        if content_type not in ALLOWED_TYPES:
            raise AuthError.validation(
                messages.MEDIA_TYPE_INVALID,
                {"contentType": messages.MEDIA_TYPE_INVALID},
            )
        if payload.size_bytes <= 0 or payload.size_bytes > MAX_IMAGE_BYTES:
            raise AuthError.validation(
                messages.MEDIA_TOO_LARGE, {"sizeBytes": messages.MEDIA_TOO_LARGE}
            )
        extension = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[
            content_type
        ]
        key = f"media/{uuid.uuid4()}.{extension}"
        signed = self._storage.presign_put(key, content_type, payload.size_bytes)
        return PresignOut(
            storage_key=key,
            upload_url=signed.upload_url,
            public_url=self._storage.public_url(key),
            headers=signed.headers,
        )

    async def confirm(self, payload: MediaConfirmIn, actor: User) -> MediaOut:
        alt = payload.alt.strip()
        if not alt:
            raise AuthError.validation(
                messages.ALT_REQUIRED, {"alt": messages.ALT_REQUIRED}
            )
        if not payload.storage_key.startswith("media/"):
            raise AuthError.validation(
                messages.MEDIA_MISSING, {"storageKey": messages.MEDIA_MISSING}
            )
        existing = await self._session.scalar(
            select(Media).where(Media.storage_key == payload.storage_key)
        )
        if existing is not None:
            return _media_out(existing)
        stored = self._storage.read(payload.storage_key)
        if stored is None:
            raise ApiError.not_found()
        data, stored_type = stored
        if len(data) <= 0 or len(data) > MAX_IMAGE_BYTES:
            self._storage.delete(payload.storage_key)
            raise AuthError.validation(
                messages.MEDIA_TOO_LARGE, {"sizeBytes": messages.MEDIA_TOO_LARGE}
            )
        detected = detect_image(data)
        if detected is None or detected != payload.content_type.strip().lower():
            self._storage.delete(payload.storage_key)
            raise AuthError.validation(
                messages.MEDIA_TYPE_INVALID,
                {"contentType": messages.MEDIA_TYPE_INVALID},
            )
        if stored_type and stored_type.split(";")[0].strip().lower() not in {
            detected,
            "application/octet-stream",
            "binary/octet-stream",
        }:
            self._storage.delete(payload.storage_key)
            raise AuthError.validation(
                messages.MEDIA_TYPE_INVALID,
                {"contentType": messages.MEDIA_TYPE_INVALID},
            )
        width, height = _dimensions(data, detected)
        media = Media(
            storage_key=payload.storage_key,
            public_url=self._storage.public_url(payload.storage_key),
            mime_type=detected,
            size_bytes=len(data),
            width_px=width,
            height_px=height,
            alt=alt,
        )
        self._session.add(media)
        await self._session.commit()
        _ = actor
        return _media_out(media)

    async def link(self, media_id: uuid.UUID, payload: MediaLinkIn) -> MediaLinkOut:
        media = await self._session.get(Media, media_id)
        if media is None:
            raise ApiError.not_found()
        if payload.owner_type not in OWNER_MODELS:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"ownerType": messages.LOOKUP_INVALID}
            )
        owner = await self._owner(payload.owner_type, payload.owner_slug)
        if payload.is_primary:
            existing_primary = await self._session.scalars(
                select(MediaLink).where(
                    MediaLink.owner_type == payload.owner_type,
                    MediaLink.owner_id == owner.id,
                    MediaLink.is_primary.is_(True),
                )
            )
            for row in existing_primary:
                row.is_primary = False
            await self._session.flush()
        link = await self._session.scalar(
            select(MediaLink).where(
                MediaLink.media_id == media.id,
                MediaLink.owner_type == payload.owner_type,
                MediaLink.owner_id == owner.id,
            )
        )
        if link is None:
            link = MediaLink(
                media_id=media.id,
                owner_type=payload.owner_type,
                owner_id=owner.id,
                sort_order=payload.sort_order,
                is_primary=payload.is_primary,
            )
            self._session.add(link)
        else:
            link.sort_order = payload.sort_order
            link.is_primary = payload.is_primary
        await self._session.commit()
        await self._session.refresh(link)
        return MediaLinkOut(
            id=link.id,
            media_id=media.id,
            owner_type=payload.owner_type,
            owner_slug=payload.owner_slug,
            is_primary=link.is_primary,
            public_url=media.public_url,
            alt=media.alt,
        )

    async def unlink(self, link_id: uuid.UUID) -> None:
        link = await self._session.get(MediaLink, link_id)
        if link is None:
            raise ApiError.not_found()
        media_id = link.media_id
        await self._session.delete(link)
        await self._session.flush()
        await self._drop_if_orphan(media_id)
        await self._session.commit()

    async def delete_media(self, media_id: uuid.UUID) -> None:
        media = await self._session.get(Media, media_id)
        if media is None:
            raise ApiError.not_found()
        links = await self._session.scalars(
            select(MediaLink).where(MediaLink.media_id == media.id)
        )
        for link in links:
            await self._session.delete(link)
        self._storage.delete(media.storage_key)
        await self._session.delete(media)
        await self._session.commit()

    async def _drop_if_orphan(self, media_id: uuid.UUID) -> None:
        count = await self._session.scalar(
            select(func.count())
            .select_from(MediaLink)
            .where(MediaLink.media_id == media_id)
        )
        if int(count or 0) > 0:
            return
        media = await self._session.get(Media, media_id)
        if media is None:
            return
        self._storage.delete(media.storage_key)
        await self._session.delete(media)

    async def _owner(self, owner_type: MediaOwner, slug: str):
        model = OWNER_MODELS[owner_type]
        row = await self._session.scalar(
            select(model).where(model.slug == slug, model.deleted_at.is_(None))
        )
        if row is None:
            raise ApiError.not_found()
        return row


def _media_out(row: Media) -> MediaOut:
    return MediaOut(
        id=row.id,
        public_url=row.public_url,
        alt=row.alt,
        mime_type=row.mime_type,
        size_bytes=row.size_bytes,
    )


def _dimensions(data: bytes, mime: str) -> tuple[int | None, int | None]:
    if mime == "image/png" and len(data) >= 24:
        width = int.from_bytes(data[16:20], "big")
        height = int.from_bytes(data[20:24], "big")
        return width or None, height or None
    return None, None
