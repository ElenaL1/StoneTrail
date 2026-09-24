from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field, field_validator

from core import messages
from models.enums import PublicationStatus
from schemas.user import CamelModel


def _required_text(value: str, message: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        raise ValueError(message)
    return trimmed


class CategoryOut(CamelModel):
    id: uuid.UUID
    code: str
    label: str


class ForumCommentCreate(CamelModel):
    body: str
    parent_id: uuid.UUID | None = None

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        return _required_text(value, messages.COMMENT_REQUIRED)


class ForumCommentUpdate(CamelModel):
    body: str

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        return _required_text(value, messages.COMMENT_REQUIRED)


class ForumCommentOut(CamelModel):
    id: uuid.UUID
    author: str
    author_id: uuid.UUID
    body: str
    created_at: datetime
    edited_at: datetime | None = None
    parent_id: uuid.UUID | None = None
    likes_count: int = 0
    liked: bool = False
    deleted: bool = False
    deleted_by: str | None = None


class ForumPostCreate(CamelModel):
    title: str
    category_id: uuid.UUID
    content: str

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return _required_text(value, messages.TITLE_REQUIRED)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        return _required_text(value, messages.CONTENT_REQUIRED)


class ForumPostUpdate(CamelModel):
    title: str | None = None
    category_id: uuid.UUID | None = None
    content: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.TITLE_REQUIRED)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.CONTENT_REQUIRED)


class ForumLikeOut(CamelModel):
    liked: bool
    likes_count: int


class ForumPostOut(CamelModel):
    id: uuid.UUID
    slug: str
    title: str
    author: str
    author_id: uuid.UUID
    category: str
    category_id: uuid.UUID
    excerpt: str
    content: str
    created_at: datetime
    edited_at: datetime | None = None
    comment_count: int
    view_count: int = 0
    likes_count: int = 0
    liked: bool = False
    deleted: bool = False
    deleted_by: str | None = None
    comments: list[ForumCommentOut] = Field(default_factory=list)


class ArticleCommentCreate(CamelModel):
    body: str
    parent_id: uuid.UUID | None = None

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        return _required_text(value, messages.COMMENT_REQUIRED)


class ArticleCommentOut(CamelModel):
    id: uuid.UUID
    author: str
    body: str
    created_at: datetime
    parent_id: uuid.UUID | None = None


class ArticleWrite(CamelModel):
    title: str
    excerpt: str = ""
    content: str
    category_id: uuid.UUID
    cover_url: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return _required_text(value, messages.TITLE_REQUIRED)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        return _required_text(value, messages.CONTENT_REQUIRED)

    @field_validator("excerpt")
    @classmethod
    def validate_excerpt(cls, value: str) -> str:
        return value.strip()

    @field_validator("cover_url")
    @classmethod
    def validate_cover(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        if not trimmed:
            return None
        lowered = trimmed.lower()
        if not (lowered.startswith("http://") or lowered.startswith("https://")):
            raise ValueError(messages.COVER_URL_INVALID)
        return trimmed


class ArticleUpdate(CamelModel):
    title: str | None = None
    excerpt: str | None = None
    content: str | None = None
    category_id: uuid.UUID | None = None
    cover_url: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.TITLE_REQUIRED)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _required_text(value, messages.CONTENT_REQUIRED)

    @field_validator("excerpt")
    @classmethod
    def validate_excerpt(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()

    @field_validator("cover_url")
    @classmethod
    def validate_cover(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        if not trimmed:
            return ""
        lowered = trimmed.lower()
        if not (lowered.startswith("http://") or lowered.startswith("https://")):
            raise ValueError(messages.COVER_URL_INVALID)
        return trimmed


class ModerateArticleRequest(CamelModel):
    action: str
    note: str = ""

    @field_validator("action")
    @classmethod
    def validate_action(cls, value: str) -> str:
        allowed = {"publish", "request_changes", "reject", "revoke_privilege"}
        trimmed = value.strip()
        if trimmed not in allowed:
            raise ValueError(messages.ARTICLE_CANNOT_MODERATE)
        return trimmed

    @field_validator("note")
    @classmethod
    def validate_note(cls, value: str) -> str:
        return value.strip()


class ArticleLikeOut(CamelModel):
    liked: bool
    likes_count: int


class ArticleOut(CamelModel):
    id: uuid.UUID
    slug: str
    title: str
    excerpt: str
    content: str
    category: str
    category_id: uuid.UUID
    author: str
    author_id: uuid.UUID | None
    cover_url: str
    read_time_minutes: int
    publication_status: PublicationStatus
    moderation_note: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    likes_count: int
    liked: bool
    comment_count: int
    comments: list[ArticleCommentOut] = Field(default_factory=list)
