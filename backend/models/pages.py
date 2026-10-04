from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, pg_enum
from models.enums import PageBlockKind, PageBlockStatus


class PageBlock(Base):
    __tablename__ = "page_blocks"
    __table_args__ = (
        UniqueConstraint("page_key", "block_key", name="page_blocks_page_block_key"),
        CheckConstraint("char_length(page_key) >= 1", name="page_blocks_page_key_len"),
        CheckConstraint(
            "char_length(block_key) >= 1", name="page_blocks_block_key_len"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    page_key: Mapped[str] = mapped_column(Text, nullable=False)
    block_key: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[PageBlockKind] = mapped_column(
        pg_enum(PageBlockKind, "page_block_kind"), nullable=False
    )
    draft_value: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    published_value: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    status: Mapped[PageBlockStatus] = mapped_column(
        pg_enum(PageBlockStatus, "page_block_status"),
        nullable=False,
        server_default=text("'draft'::page_block_status"),
    )
    effective_from: Mapped[date | None] = mapped_column(Date)
    media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL")
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
