from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Text,
    desc,
    text,
)
from sqlalchemy.dialects.postgresql import CITEXT, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, SoftDeleteMixin, TimestampMixin, pg_enum
from models.enums import ActivityType, AuthTokenType, UserRole


class User(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("char_length(nickname) >= 2", name="users_nickname_len"),
        CheckConstraint(
            "first_name = '' OR char_length(first_name) >= 2",
            name="users_first_name_len",
        ),
        CheckConstraint(
            "last_name = '' OR char_length(last_name) >= 2",
            name="users_last_name_len",
        ),
        CheckConstraint(
            "website = '' OR website ~* '^https?://'", name="users_website_format"
        ),
        Index(
            "users_email_alive_key",
            "email",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "users_nickname_alive_key",
            "nickname",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "users_role_alive_idx", "role", postgresql_where=text("deleted_at IS NULL")
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    email: Mapped[str] = mapped_column(CITEXT, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    nickname: Mapped[str] = mapped_column(Text, nullable=False)
    first_name: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    last_name: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    company: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    position: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    activity_type: Mapped[ActivityType | None] = mapped_column(
        pg_enum(ActivityType, "activity_type")
    )
    country: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    city: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    bio: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    website: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    phone: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    email_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    role: Mapped[UserRole] = mapped_column(
        pg_enum(UserRole, "user_role"),
        nullable=False,
        server_default=text("'user'::user_role"),
    )
    marketing_consent: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    terms_accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    sessions: Mapped[list[Session]] = relationship(back_populates="user")
    auth_tokens: Mapped[list[AuthToken]] = relationship(back_populates="user")


class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (Index("sessions_user_expires_idx", "user_id", "expires_at"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    user: Mapped[User] = relationship(back_populates="sessions")


class AuthToken(Base):
    __tablename__ = "auth_tokens"
    __table_args__ = (
        Index(
            "auth_tokens_user_type_created_idx",
            "user_id",
            "type",
            desc("created_at"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[AuthTokenType] = mapped_column(
        pg_enum(AuthTokenType, "auth_token_type"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    user: Mapped[User] = relationship(back_populates="auth_tokens")
