from __future__ import annotations

import re
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import field_validator

from core import messages
from models.enums import BannerTemplate, NewsStatus
from schemas.content import _required_text
from schemas.user import CamelModel

_SLUG = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


def _button(value: str) -> str:
    trimmed = _required_text(value, messages.BUTTON_LABEL_REQUIRED)
    if len(trimmed) > 80:
        raise ValueError(messages.BUTTON_LABEL_LONG)
    return trimmed


def _optional_slug(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    if re.fullmatch(_SLUG, trimmed) is None:
        raise ValueError(messages.SLUG_INVALID)
    return trimmed


class LikeOut(CamelModel):
    liked: bool
    likes_count: int


class NewsWrite(CamelModel):
    title: str
    excerpt: str
    content: str
    status: NewsStatus = NewsStatus.DRAFT
    slug: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return _required_text(value, messages.TITLE_REQUIRED)

    @field_validator("excerpt")
    @classmethod
    def validate_excerpt(cls, value: str) -> str:
        return _required_text(value, messages.EXCERPT_REQUIRED)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        return _required_text(value, messages.CONTENT_REQUIRED)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _optional_slug(value)


class NewsUpdate(CamelModel):
    title: str | None = None
    excerpt: str | None = None
    content: str | None = None
    status: NewsStatus | None = None
    slug: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.TITLE_REQUIRED)

    @field_validator("excerpt")
    @classmethod
    def validate_excerpt(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.EXCERPT_REQUIRED)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.CONTENT_REQUIRED)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _optional_slug(value)


class NewsOut(CamelModel):
    id: uuid.UUID
    slug: str
    title: str
    excerpt: str
    content: str
    status: NewsStatus
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    likes_count: int
    liked: bool
    deleted: bool = False


class PromotionWrite(CamelModel):
    title: str
    description: str
    content: str
    template: BannerTemplate = BannerTemplate.STONE
    button_label: str = "Узнать детали"
    inquiry_label: str = "Запросить"
    is_enabled: bool = False
    publish_to_catalog: bool = False
    offer_note: str = ""
    expires_at: datetime
    slug: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return _required_text(value, messages.TITLE_REQUIRED)

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        return _required_text(value, messages.DESCRIPTION_REQUIRED)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        return _required_text(value, messages.CONTENT_REQUIRED)

    @field_validator("button_label")
    @classmethod
    def validate_button(cls, value: str) -> str:
        return _button(value)

    @field_validator("inquiry_label")
    @classmethod
    def validate_inquiry(cls, value: str) -> str:
        return _button(value)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _optional_slug(value)


class PromotionUpdate(CamelModel):
    title: str | None = None
    description: str | None = None
    content: str | None = None
    template: BannerTemplate | None = None
    button_label: str | None = None
    inquiry_label: str | None = None
    is_enabled: bool | None = None
    publish_to_catalog: bool | None = None
    offer_note: str | None = None
    sheet_image_url: str | None = None
    sheet_pdf_url: str | None = None
    expires_at: datetime | None = None
    slug: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.TITLE_REQUIRED)

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.DESCRIPTION_REQUIRED)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.CONTENT_REQUIRED)

    @field_validator("button_label", "inquiry_label")
    @classmethod
    def validate_button(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _button(value)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _optional_slug(value)


OfferKindLabel = Literal["tile", "slab", "block"]
OfferUnitLabel = Literal["m2", "slab", "ton", "piece"]


class OfferStoneIn(CamelModel):
    stone_type_code: str
    quarry: str
    country: str


class PromotionLineIn(CamelModel):
    kind: OfferKindLabel
    group_name: str
    stone_name: str = ""
    label: str
    stone_slug: str | None = None
    create_stone: OfferStoneIn | None = None
    finish: str | None = None
    length_mm: int | None = None
    width_mm: int | None = None
    thickness_mm: int | None = None
    height_mm: int | None = None
    weight_kg: Decimal | None = None
    area_m2: Decimal | None = None
    price_amount: Decimal | None = None
    price_unit: OfferUnitLabel | None = None
    unresolved: bool = False
    issue: str | None = None


class PromotionLinesIn(CamelModel):
    offer_note: str = ""
    publish_to_catalog: bool = False
    lines: list[PromotionLineIn]


class PromotionLineOut(CamelModel):
    id: uuid.UUID | None = None
    kind: OfferKindLabel
    group_name: str
    stone_name: str = ""
    label: str
    stone_slug: str | None = None
    finish: str | None = None
    length_mm: int | None = None
    width_mm: int | None = None
    thickness_mm: int | None = None
    height_mm: int | None = None
    weight_kg: Decimal | None = None
    area_m2: Decimal | None = None
    price_amount: Decimal | None = None
    price_unit: OfferUnitLabel | None = None
    unresolved: bool = False
    issue: str | None = None
    sort_order: int = 0


class OfferPreviewOut(CamelModel):
    offer_note: str = ""
    lines: list[PromotionLineOut]


class PromotionOut(CamelModel):
    id: uuid.UUID
    slug: str
    title: str
    description: str
    content: str
    template: BannerTemplate
    button_label: str
    inquiry_label: str
    is_enabled: bool
    publish_to_catalog: bool = False
    offer_note: str = ""
    sheet_image_url: str = ""
    sheet_pdf_url: str = ""
    line_count: int = 0
    lines: list[PromotionLineOut] = []
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    likes_count: int
    liked: bool
    deleted: bool = False


class ActivePromotionOut(CamelModel):
    slug: str
    title: str
    description: str
    template: BannerTemplate
    button_label: str
    expires_at: datetime
