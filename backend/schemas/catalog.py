from __future__ import annotations

from typing import Literal

from schemas.user import CamelModel

StoneStatus = Literal["В наличии", "Мало", "Продано"]
LotStatusLabel = Literal["В наличии", "Зарезервирован", "Под заказ"]
FinishedStatusLabel = Literal["В наличии", "Под заказ", "Выполнено", "В работе"]
ProductCategoryLabel = Literal["slabs", "blanks", "tiles", "paving", "custom"]
PriceTypeLabel = Literal["on_request", "fixed"]


class LotItemOut(CamelModel):
    label: str
    status: LotStatusLabel
    image: str | None = None
    note: str | None = None
    size: str | None = None
    thickness: str | None = None
    finish: str | None = None
    dimensions: str | None = None
    weight: str | None = None


class MaterialOut(CamelModel):
    id: str
    name: str
    type: str
    finish: str
    thickness: str
    image: str
    supplier: str
    location: str
    quarry: str
    country: str
    status: StoneStatus
    slabs: int
    tiles: int
    updated: str
    block_slug: str | None = None


class StoneBlockOut(CamelModel):
    id: str
    slug: str
    stone_name: str
    stone_type: str
    quarry: str
    country: str
    blocks: list[LotItemOut]
    image: str
    description: str
    expert_note: str
    block_stone_id: str | None = None


class ProductOut(CamelModel):
    id: str
    slug: str
    category: ProductCategoryLabel
    name: str
    stone_name: str
    stone_type: str
    description: str
    image: str
    product_type: str | None = None
    custom_group: str | None = None
    origin: str | None = None
    quarry: str | None = None
    purpose: str | None = None
    price: str | None = None
    price_type: PriceTypeLabel | None = None
    images: list[str] | None = None
    characteristics: dict[str, str] | None = None
    applications: list[str] | None = None
    height: str | None = None
    diameter: str | None = None
    format: str | None = None
    color: str | None = None
    thickness: str | None = None
    finish: str | None = None
    size: str | None = None
    availability: str | None = None
    status: FinishedStatusLabel | None = None
    stone_image: str | None = None
    expert_note: str | None = None
    dimensions: str | None = None
    slabs: list[LotItemOut] | None = None
    blanks: list[LotItemOut] | None = None
    tiles: list[LotItemOut] | None = None
    paving: list[LotItemOut] | None = None
