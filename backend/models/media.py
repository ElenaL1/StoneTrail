from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, pg_enum
from models.enums import MediaOwner


class Media(Base):
    __tablename__ = "media"
    __table_args__ = (
        CheckConstraint("size_bytes > 0", name="media_size_positive"),
        CheckConstraint(
            "width_px IS NULL OR width_px > 0", name="media_width_positive"
        ),
        CheckConstraint(
            "height_px IS NULL OR height_px > 0", name="media_height_positive"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    storage_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    public_url: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width_px: Mapped[int | None] = mapped_column(Integer)
    height_px: Mapped[int | None] = mapped_column(Integer)
    alt: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    links: Mapped[list[MediaLink]] = relationship(back_populates="media")


class MediaLink(Base):
    __tablename__ = "media_links"
    __table_args__ = (
        UniqueConstraint(
            "owner_type", "owner_id", "media_id", name="media_links_owner_media_key"
        ),
        Index(
            "media_links_one_primary_idx",
            "owner_type",
            "owner_id",
            unique=True,
            postgresql_where=text("is_primary"),
        ),
        Index("media_links_owner_idx", "owner_type", "owner_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="CASCADE"), nullable=False
    )
    owner_type: Mapped[MediaOwner] = mapped_column(
        pg_enum(MediaOwner, "media_owner"), nullable=False
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    media: Mapped[Media] = relationship(back_populates="links")
