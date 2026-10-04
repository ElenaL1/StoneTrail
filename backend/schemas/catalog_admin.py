from __future__ import annotations

import uuid
from decimal import Decimal

from models.enums import (
    CustomGroup,
    FinishedStatus,
    LotItemStatus,
    PriceType,
    PriceUnit,
    ProductCategory,
    ProductItemKind,
)
from schemas.user import CamelModel


class LookupOut(CamelModel):
    code: str
    label: str


class CatalogLookupsOut(CamelModel):
    stone_types: list[LookupOut]
    finishes: list[LookupOut]
    applications: list[LookupOut]


class BlockItemWrite(CamelModel):
    label: str
    status: LotItemStatus = LotItemStatus.IN_STOCK
    length_mm: int | None = None
    width_mm: int | None = None
    height_mm: int | None = None
    weight_kg: Decimal | None = None
    finish_code: str | None = None
    sort_order: int = 0


class StoneWrite(CamelModel):
    name: str
    stone_type_code: str
    quarry: str
    country: str
    description: str = ""
    slug: str | None = None


class StoneEditOut(CamelModel):
    slug: str
    name: str
    stone_type_code: str
    quarry: str
    country: str
    description: str


class BlockLotWrite(CamelModel):
    stone_slug: str
    description: str = ""
    expert_note: str = ""
    slug: str | None = None
    items: list[BlockItemWrite] = []


class BlockItemEditOut(BlockItemWrite):
    pass


class BlockLotEditOut(CamelModel):
    slug: str
    stone_slug: str
    description: str
    expert_note: str
    items: list[BlockItemEditOut]


class ProductItemWrite(CamelModel):
    label: str
    kind: ProductItemKind | None = None
    status: LotItemStatus = LotItemStatus.IN_STOCK
    length_mm: int | None = None
    width_mm: int | None = None
    thickness_mm: int | None = None
    weight_kg: Decimal | None = None
    finish_code: str
    note: str | None = None
    sort_order: int = 0


class ProductWrite(CamelModel):
    name: str
    stone_slug: str
    category: ProductCategory
    description: str
    product_type: str | None = None
    custom_group: CustomGroup | None = None
    purpose: str | None = None
    price_type: PriceType = PriceType.ON_REQUEST
    amount: Decimal | None = None
    price_unit: PriceUnit | None = None
    characteristics: dict[str, str] = {}
    height: str | None = None
    diameter: str | None = None
    format: str | None = None
    color: str | None = None
    thickness: str | None = None
    finish: str | None = None
    size: str | None = None
    dimensions: str | None = None
    expert_note: str | None = None
    status: FinishedStatus | None = None
    application_codes: list[str] = []
    items: list[ProductItemWrite] | None = None
    slug: str | None = None


class ProductEditOut(ProductWrite):
    slug: str
    record_id: uuid.UUID
