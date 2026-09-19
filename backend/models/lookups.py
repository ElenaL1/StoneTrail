from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from models.catalog import Stone


class LookupMixin(TimestampMixin):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )


class StoneType(LookupMixin, Base):
    __tablename__ = "stone_types"
    __table_args__ = (
        CheckConstraint(
            "code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'", name="stone_types_code_format"
        ),
        CheckConstraint("char_length(label) >= 1", name="stone_types_label_len"),
    )

    stones: Mapped[list[Stone]] = relationship(back_populates="stone_type")


class Finish(LookupMixin, Base):
    __tablename__ = "finishes"
    __table_args__ = (
        CheckConstraint(
            "code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'", name="finishes_code_format"
        ),
        CheckConstraint("char_length(label) >= 1", name="finishes_label_len"),
    )


class Application(LookupMixin, Base):
    __tablename__ = "applications"
    __table_args__ = (
        CheckConstraint(
            "code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'", name="applications_code_format"
        ),
        CheckConstraint("char_length(label) >= 1", name="applications_label_len"),
    )


class ForumCategory(LookupMixin, Base):
    __tablename__ = "forum_categories"
    __table_args__ = (
        CheckConstraint(
            "code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'", name="forum_categories_code_format"
        ),
        CheckConstraint("char_length(label) >= 1", name="forum_categories_label_len"),
    )


class ArticleCategory(LookupMixin, Base):
    __tablename__ = "article_categories"
    __table_args__ = (
        CheckConstraint(
            "code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'",
            name="article_categories_code_format",
        ),
        CheckConstraint("char_length(label) >= 1", name="article_categories_label_len"),
    )
