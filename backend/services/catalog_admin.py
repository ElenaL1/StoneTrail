from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from core.slug import slugify
from models.catalog import BlockItem, BlockLot, Product, ProductItem, Stone
from models.enums import ProductCategory, ProductItemKind
from models.lookups import Application, Finish, StoneType
from models.user import User
from repositories.catalog import CatalogRepository
from schemas.catalog import MaterialOut, ProductOut, StoneBlockOut
from schemas.catalog_admin import (
    BlockItemEditOut,
    BlockLotEditOut,
    BlockLotWrite,
    CatalogLookupsOut,
    LookupOut,
    ProductEditOut,
    ProductItemWrite,
    ProductWrite,
    StoneEditOut,
    StoneWrite,
)

ITEM_KIND_BY_CATEGORY = {
    ProductCategory.SLABS: ProductItemKind.SLAB,
    ProductCategory.BLANKS: ProductItemKind.BLANK,
    ProductCategory.TILES: ProductItemKind.TILE,
    ProductCategory.PAVING: ProductItemKind.PAVING,
}


class CatalogAdminMixin:
    _session: AsyncSession
    _repo: CatalogRepository

    async def lookups(self) -> CatalogLookupsOut:
        types, finishes, applications = await self._repo.list_lookups()
        return CatalogLookupsOut(
            stone_types=[LookupOut(code=row.code, label=row.label) for row in types],
            finishes=[LookupOut(code=row.code, label=row.label) for row in finishes],
            applications=[
                LookupOut(code=row.code, label=row.label) for row in applications
            ],
        )

    async def stone_edit(self, slug: str) -> StoneEditOut:
        stone = await self._repo.get_stone_by_slug(slug)
        if stone is None:
            raise ApiError.not_found()
        return _stone_edit(stone)

    async def create_stone(self, payload: StoneWrite, actor: User) -> MaterialOut:
        stone = Stone(
            slug=await self._fresh_slug(Stone, payload.slug, payload.name, "stone"),
            name=payload.name.strip(),
            stone_type_id=(await self._stone_type(payload.stone_type_code)).id,
            quarry=payload.quarry.strip(),
            country=payload.country.strip(),
            description=payload.description.strip(),
            updated_by=actor.id,
        )
        self._require_text(stone.name, "name")
        self._require_text(stone.quarry, "quarry")
        self._require_text(stone.country, "country")
        stone.canonical_path = f"/catalog/{stone.slug}"
        self._session.add(stone)
        await self._session.commit()
        return await self.get_stone(stone.slug)

    async def update_stone(
        self, slug: str, payload: StoneWrite, actor: User
    ) -> MaterialOut:
        stone = await self._repo.get_stone_by_slug(slug)
        if stone is None:
            raise ApiError.not_found()
        stone.name = payload.name.strip()
        stone.stone_type_id = (await self._stone_type(payload.stone_type_code)).id
        stone.quarry = payload.quarry.strip()
        stone.country = payload.country.strip()
        stone.description = payload.description.strip()
        stone.updated_by = actor.id
        self._require_text(stone.name, "name")
        self._require_text(stone.quarry, "quarry")
        self._require_text(stone.country, "country")
        if payload.slug:
            stone.slug = await self._fresh_slug(
                Stone, payload.slug, payload.name, "stone", exclude=stone.id
            )
            stone.canonical_path = f"/catalog/{stone.slug}"
        await self._session.commit()
        return await self.get_stone(stone.slug)

    async def delete_stone(self, slug: str, actor: User) -> None:
        stone = await self._repo.get_stone_by_slug(slug)
        if stone is None:
            raise ApiError.not_found()
        if await self._repo.stone_has_dependents(stone.id):
            raise ApiError.conflict(messages.STONE_IN_USE)
        stone.deleted_at = datetime.now(UTC)
        stone.updated_by = actor.id
        await self._session.commit()

    async def restore_stone(self, slug: str, actor: User) -> MaterialOut:
        stone = await self._repo.get_stone_any(slug)
        if stone is None or stone.deleted_at is None:
            raise ApiError.not_found()
        if await self._repo.slug_taken(Stone, stone.slug, exclude=stone.id):
            raise ApiError.conflict(messages.SLUG_TAKEN)
        stone.deleted_at = None
        stone.updated_by = actor.id
        await self._session.commit()
        return await self.get_stone(stone.slug)

    async def block_edit(self, slug: str) -> BlockLotEditOut:
        lot = await self._repo.get_lot_by_slug(slug)
        if lot is None:
            raise ApiError.not_found()
        return _lot_edit(lot)

    async def create_block(self, payload: BlockLotWrite, actor: User) -> StoneBlockOut:
        stone = await self._repo.get_stone_by_slug(payload.stone_slug)
        if stone is None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"stoneSlug": messages.LOOKUP_INVALID}
            )
        lot = BlockLot(
            slug=await self._fresh_slug(BlockLot, payload.slug, stone.name, "lot"),
            stone_id=stone.id,
            description=payload.description.strip(),
            expert_note=payload.expert_note.strip(),
            updated_by=actor.id,
        )
        lot.canonical_path = f"/catalog/blocks/{lot.slug}"
        self._session.add(lot)
        await self._session.flush()
        await self._replace_block_items(lot, payload.items, actor)
        await self._session.commit()
        return await self.get_block(lot.slug)

    async def update_block(
        self, slug: str, payload: BlockLotWrite, actor: User
    ) -> StoneBlockOut:
        lot = await self._repo.get_lot_by_slug(slug)
        if lot is None:
            raise ApiError.not_found()
        stone = await self._repo.get_stone_by_slug(payload.stone_slug)
        if stone is None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"stoneSlug": messages.LOOKUP_INVALID}
            )
        lot.stone_id = stone.id
        lot.description = payload.description.strip()
        lot.expert_note = payload.expert_note.strip()
        lot.updated_by = actor.id
        if payload.slug:
            lot.slug = await self._fresh_slug(
                BlockLot, payload.slug, stone.name, "lot", exclude=lot.id
            )
            lot.canonical_path = f"/catalog/blocks/{lot.slug}"
        await self._replace_block_items(lot, payload.items, actor)
        await self._session.commit()
        return await self.get_block(lot.slug)

    async def delete_block(self, slug: str, actor: User) -> None:
        lot = await self._repo.get_lot_by_slug(slug)
        if lot is None:
            raise ApiError.not_found()
        lot.deleted_at = datetime.now(UTC)
        lot.updated_by = actor.id
        await self._session.commit()

    async def restore_block(self, slug: str, actor: User) -> StoneBlockOut:
        lot = await self._repo.get_lot_any(slug)
        if lot is None or lot.deleted_at is None:
            raise ApiError.not_found()
        if await self._repo.slug_taken(BlockLot, lot.slug, exclude=lot.id):
            raise ApiError.conflict(messages.SLUG_TAKEN)
        lot.deleted_at = None
        lot.updated_by = actor.id
        await self._session.commit()
        return await self.get_block(lot.slug)

    async def product_edit(self, slug: str) -> ProductEditOut:
        product = await self._repo.get_product_by_slug(slug)
        if product is None:
            raise ApiError.not_found()
        return _product_edit(product)

    async def create_product(self, payload: ProductWrite, actor: User) -> ProductOut:
        product = Product(
            slug=await self._fresh_slug(Product, payload.slug, payload.name, "product"),
            updated_by=actor.id,
            characteristics={},
            currency="RUB",
        )
        await self._apply_product(product, payload, actor)
        self._session.add(product)
        await self._session.flush()
        await self._replace_product_items(product, payload, actor)
        await self._session.commit()
        return await self.get_product(product.slug)

    async def update_product(
        self, slug: str, payload: ProductWrite, actor: User
    ) -> ProductOut:
        product = await self._repo.get_product_by_slug(slug)
        if product is None:
            raise ApiError.not_found()
        if payload.slug:
            product.slug = await self._fresh_slug(
                Product, payload.slug, payload.name, "product", exclude=product.id
            )
        await self._apply_product(product, payload, actor)
        if payload.items is not None:
            await self._replace_product_items(product, payload, actor)
        await self._session.commit()
        return await self.get_product(product.slug)

    async def delete_product(self, slug: str, actor: User) -> None:
        product = await self._repo.get_product_by_slug(slug)
        if product is None:
            raise ApiError.not_found()
        product.deleted_at = datetime.now(UTC)
        product.updated_by = actor.id
        await self._session.commit()

    async def restore_product(self, slug: str, actor: User) -> ProductOut:
        product = await self._repo.get_product_any(slug)
        if product is None or product.deleted_at is None:
            raise ApiError.not_found()
        if await self._repo.slug_taken(Product, product.slug, exclude=product.id):
            raise ApiError.conflict(messages.SLUG_TAKEN)
        product.deleted_at = None
        product.updated_by = actor.id
        await self._session.commit()
        return await self.get_product(product.slug)

    async def _apply_product(
        self, product: Product, payload: ProductWrite, actor: User
    ) -> None:
        stone = await self._repo.get_stone_by_slug(payload.stone_slug)
        if stone is None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"stoneSlug": messages.LOOKUP_INVALID}
            )
        name = payload.name.strip()
        description = payload.description.strip()
        self._require_text(name, "name")
        self._require_text(description, "description")
        if payload.price_type.value == "fixed" and payload.amount is None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"amount": "Укажите цену."}
            )
        if payload.category == ProductCategory.CUSTOM:
            if not (
                payload.product_type
                and payload.custom_group
                and payload.status
                and payload.finish
            ):
                raise AuthError.validation(
                    messages.LOOKUP_INVALID,
                    {"category": "Для изделия укажите тип, группу, статус и фактуру."},
                )
        elif payload.custom_group is not None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID,
                {"customGroup": messages.LOOKUP_INVALID},
            )
        product.category = payload.category
        product.stone_id = stone.id
        product.name = name
        product.description = description
        product.product_type = _blank(payload.product_type)
        product.custom_group = (
            payload.custom_group if payload.category == ProductCategory.CUSTOM else None
        )
        product.purpose = _blank(payload.purpose)
        product.price_type = payload.price_type
        product.amount = payload.amount
        product.price_unit = payload.price_unit
        product.characteristics = payload.characteristics or {}
        product.height = _blank(payload.height)
        product.diameter = _blank(payload.diameter)
        product.format = _blank(payload.format)
        product.color = _blank(payload.color)
        product.thickness = _blank(payload.thickness)
        product.finish = _blank(payload.finish)
        product.size = _blank(payload.size)
        product.dimensions = _blank(payload.dimensions)
        product.expert_note = _blank(payload.expert_note)
        product.status = payload.status
        product.updated_by = actor.id
        product.canonical_path = f"/catalog/products/{product.slug}"
        product.applications = await self._applications(payload.application_codes)

    async def _replace_block_items(
        self, lot: BlockLot, items: list, actor: User
    ) -> None:
        await self._repo.clear_block_items(lot.id)
        await self._session.flush()
        for index, item in enumerate(items):
            self._require_text(item.label.strip(), "label")
            finish_id = None
            if item.finish_code:
                finish_id = (await self._finish(item.finish_code)).id
            self._session.add(
                BlockItem(
                    lot_id=lot.id,
                    label=item.label.strip(),
                    length_mm=item.length_mm,
                    width_mm=item.width_mm,
                    height_mm=item.height_mm,
                    weight_kg=item.weight_kg,
                    finish_id=finish_id,
                    status=item.status,
                    sort_order=item.sort_order or index,
                    updated_by=actor.id,
                )
            )

    async def _replace_product_items(
        self, product: Product, payload: ProductWrite, actor: User
    ) -> None:
        await self._repo.clear_product_items(product.id)
        await self._session.flush()
        default_kind = ITEM_KIND_BY_CATEGORY.get(product.category)
        for index, item in enumerate(payload.items or []):
            kind = item.kind or default_kind
            if kind is None:
                raise AuthError.validation(
                    messages.LOOKUP_INVALID, {"items": messages.LOOKUP_INVALID}
                )
            self._require_text(item.label.strip(), "label")
            finish = await self._finish(item.finish_code)
            self._session.add(
                ProductItem(
                    product_id=product.id,
                    kind=kind,
                    label=item.label.strip(),
                    length_mm=item.length_mm,
                    width_mm=item.width_mm,
                    thickness_mm=item.thickness_mm,
                    weight_kg=item.weight_kg,
                    finish_id=finish.id,
                    status=item.status,
                    note=_blank(item.note),
                    sort_order=item.sort_order or index,
                    updated_by=actor.id,
                )
            )

    async def _fresh_slug(
        self,
        model: type,
        requested: str | None,
        source: str,
        fallback: str,
        *,
        exclude=None,
    ) -> str:
        raw = (requested or source).strip()
        slug = slugify(raw, fallback=fallback)
        if await self._repo.slug_taken(model, slug, exclude=exclude):
            raise ApiError.conflict(messages.SLUG_TAKEN)
        return slug

    async def _stone_type(self, code: str) -> StoneType:
        row = await self._repo.lookup_by_code(StoneType, code)
        if row is None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID,
                {"stoneTypeCode": messages.LOOKUP_INVALID},
            )
        return row

    async def _finish(self, code: str) -> Finish:
        row = await self._repo.lookup_by_code(Finish, code)
        if row is None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"finishCode": messages.LOOKUP_INVALID}
            )
        return row

    async def _applications(self, codes: list[str]) -> list[Application]:
        rows: list[Application] = []
        for code in codes:
            row = await self._repo.lookup_by_code(Application, code)
            if row is None:
                raise AuthError.validation(
                    messages.LOOKUP_INVALID,
                    {"applicationCodes": messages.LOOKUP_INVALID},
                )
            rows.append(row)
        return rows

    def _require_text(self, value: str, field: str) -> None:
        if not value:
            raise AuthError.validation(
                messages.TITLE_REQUIRED, {field: messages.TITLE_REQUIRED}
            )

    async def get_stone(self, slug: str) -> MaterialOut:
        raise NotImplementedError

    async def get_block(self, slug: str) -> StoneBlockOut:
        raise NotImplementedError

    async def get_product(self, slug: str) -> ProductOut:
        raise NotImplementedError


def _blank(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


def _stone_edit(stone: Stone) -> StoneEditOut:
    return StoneEditOut(
        slug=stone.slug,
        name=stone.name,
        stone_type_code=stone.stone_type.code,
        quarry=stone.quarry,
        country=stone.country,
        description=stone.description,
    )


def _lot_edit(lot: BlockLot) -> BlockLotEditOut:
    items = sorted(lot.items, key=lambda item: (item.sort_order, item.label))
    return BlockLotEditOut(
        slug=lot.slug,
        stone_slug=lot.stone.slug,
        description=lot.description,
        expert_note=lot.expert_note,
        items=[
            BlockItemEditOut(
                label=item.label,
                status=item.status,
                length_mm=item.length_mm,
                width_mm=item.width_mm,
                height_mm=item.height_mm,
                weight_kg=item.weight_kg,
                finish_code=item.finish.code if item.finish is not None else None,
                sort_order=item.sort_order,
            )
            for item in items
        ],
    )


def _product_edit(product: Product) -> ProductEditOut:
    items = sorted(product.items, key=lambda item: (item.sort_order, item.label))
    return ProductEditOut(
        record_id=product.id,
        slug=product.slug,
        name=product.name,
        stone_slug=product.stone.slug,
        category=product.category,
        description=product.description,
        product_type=product.product_type,
        custom_group=product.custom_group,
        purpose=product.purpose,
        price_type=product.price_type,
        amount=product.amount,
        price_unit=product.price_unit,
        characteristics={
            str(key): str(value)
            for key, value in (product.characteristics or {}).items()
        },
        height=product.height,
        diameter=product.diameter,
        format=product.format,
        color=product.color,
        thickness=product.thickness,
        finish=product.finish,
        size=product.size,
        dimensions=product.dimensions,
        expert_note=product.expert_note,
        status=product.status,
        application_codes=[row.code for row in product.applications],
        items=[
            ProductItemWrite(
                label=item.label,
                kind=item.kind,
                status=item.status,
                length_mm=item.length_mm,
                width_mm=item.width_mm,
                thickness_mm=item.thickness_mm,
                weight_kg=item.weight_kg,
                finish_code=item.finish.code,
                note=item.note,
                sort_order=item.sort_order,
            )
            for item in items
        ],
    )
