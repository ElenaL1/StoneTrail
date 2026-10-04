from __future__ import annotations

import re
import uuid
from datetime import datetime

from pydantic import field_validator

from core import messages
from models.enums import BannerTemplate, NewsStatus
from schemas.content import _required_text
from schemas.user import CamelModel

_SLUG = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


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
    is_enabled: bool = False
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
        trimmed = _required_text(value, messages.BUTTON_LABEL_REQUIRED)
        if len(trimmed) > 80:
            raise ValueError(messages.BUTTON_LABEL_LONG)
        return trimmed

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
    is_enabled: bool | None = None
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

    @field_validator("button_label")
    @classmethod
    def validate_button(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = _required_text(value, messages.BUTTON_LABEL_REQUIRED)
        if len(trimmed) > 80:
            raise ValueError(messages.BUTTON_LABEL_LONG)
        return trimmed

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _optional_slug(value)


class PromotionOut(CamelModel):
    id: uuid.UUID
    slug: str
    title: str
    description: str
    content: str
    template: BannerTemplate
    button_label: str
    is_enabled: bool
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
