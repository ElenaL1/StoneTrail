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
    text,
)
from sqlalchemy.dialects.postgresql import CITEXT, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, SeoMixin, SoftDeleteMixin, TimestampMixin, pg_enum
from models.enums import (
    InquirySource,
    InquiryStatus,
    NewsStatus,
    NotificationType,
    PublicationStatus,
)
from models.lookups import ArticleCategory, ForumCategory
from models.user import User

SLUG_FORMAT = "slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'"
SEO_TITLE_LEN = "seo_title IS NULL OR char_length(seo_title) <= 70"
SEO_DESC_LEN = "seo_description IS NULL OR char_length(seo_description) <= 320"
CANONICAL_FORMAT = "canonical_path IS NULL OR canonical_path ~ '^/'"


class ForumPost(SeoMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "forum_posts"
    __table_args__ = (
        CheckConstraint(SLUG_FORMAT, name="forum_posts_slug_format"),
        CheckConstraint(SEO_TITLE_LEN, name="forum_posts_seo_title_len"),
        CheckConstraint(SEO_DESC_LEN, name="forum_posts_seo_description_len"),
        CheckConstraint(CANONICAL_FORMAT, name="forum_posts_canonical_path_format"),
        CheckConstraint("char_length(title) >= 1", name="forum_posts_title_len"),
        CheckConstraint("char_length(content) >= 1", name="forum_posts_content_len"),
        Index(
            "forum_posts_slug_alive_key",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "forum_posts_category_created_alive_idx",
            "category_id",
            text("created_at DESC"),
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index("forum_posts_author_idx", "author_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("forum_categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    is_pinned: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    is_locked: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    view_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    category: Mapped[ForumCategory] = relationship()
    author: Mapped[User] = relationship(foreign_keys=[author_id])
    comments: Mapped[list[ForumComment]] = relationship(back_populates="post")
    likes: Mapped[list[ForumPostLike]] = relationship(back_populates="post")


class ForumComment(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "forum_comments"
    __table_args__ = (
        CheckConstraint("char_length(body) >= 1", name="forum_comments_body_len"),
        CheckConstraint(
            "parent_id IS DISTINCT FROM id", name="forum_comments_not_self_parent"
        ),
        Index("forum_comments_post_created_idx", "post_id", "created_at"),
        Index("forum_comments_parent_idx", "parent_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("forum_posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forum_comments.id", ondelete="CASCADE")
    )

    post: Mapped[ForumPost] = relationship(back_populates="comments")
    author: Mapped[User] = relationship()
    parent: Mapped[ForumComment | None] = relationship(remote_side="ForumComment.id")
    likes: Mapped[list[ForumCommentLike]] = relationship(back_populates="comment")


class ForumPostLike(Base):
    __tablename__ = "forum_post_likes"
    __table_args__ = (Index("forum_post_likes_post_idx", "post_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("forum_posts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    post: Mapped[ForumPost] = relationship(back_populates="likes")


class ForumCommentLike(Base):
    __tablename__ = "forum_comment_likes"
    __table_args__ = (Index("forum_comment_likes_comment_idx", "comment_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    comment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("forum_comments.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    comment: Mapped[ForumComment] = relationship(back_populates="likes")


class Article(SeoMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "articles"
    __table_args__ = (
        CheckConstraint(SLUG_FORMAT, name="articles_slug_format"),
        CheckConstraint(SEO_TITLE_LEN, name="articles_seo_title_len"),
        CheckConstraint(SEO_DESC_LEN, name="articles_seo_description_len"),
        CheckConstraint(CANONICAL_FORMAT, name="articles_canonical_path_format"),
        CheckConstraint("char_length(title) >= 1", name="articles_title_len"),
        CheckConstraint("read_time_minutes > 0", name="articles_read_time_positive"),
        CheckConstraint(
            "publication_status <> 'published' OR published_at IS NOT NULL",
            name="articles_published_has_date",
        ),
        Index(
            "articles_slug_alive_key",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "articles_published_idx",
            "category_id",
            text("published_at DESC"),
            postgresql_where=text(
                "deleted_at IS NULL AND publication_status = 'published'"
            ),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("article_categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    read_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    publication_status: Mapped[PublicationStatus] = mapped_column(
        pg_enum(PublicationStatus, "publication_status"),
        nullable=False,
        server_default=text("'draft'::publication_status"),
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    moderation_note: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    category: Mapped[ArticleCategory] = relationship()
    author: Mapped[User | None] = relationship(foreign_keys=[author_id])
    comments: Mapped[list[ArticleComment]] = relationship(back_populates="article")
    likes: Mapped[list[ArticleLike]] = relationship(back_populates="article")


class ArticleComment(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "article_comments"
    __table_args__ = (
        CheckConstraint("char_length(body) >= 1", name="article_comments_body_len"),
        CheckConstraint(
            "parent_id IS DISTINCT FROM id", name="article_comments_not_self_parent"
        ),
        Index("article_comments_article_created_idx", "article_id", "created_at"),
        Index("article_comments_parent_idx", "parent_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("article_comments.id", ondelete="CASCADE")
    )

    article: Mapped[Article] = relationship(back_populates="comments")
    author: Mapped[User] = relationship()
    parent: Mapped[ArticleComment | None] = relationship(
        remote_side="ArticleComment.id"
    )


class IndustryNews(SeoMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "industry_news"
    __table_args__ = (
        CheckConstraint(SLUG_FORMAT, name="industry_news_slug_format"),
        CheckConstraint(SEO_TITLE_LEN, name="industry_news_seo_title_len"),
        CheckConstraint(SEO_DESC_LEN, name="industry_news_seo_description_len"),
        CheckConstraint(CANONICAL_FORMAT, name="industry_news_canonical_path_format"),
        CheckConstraint("char_length(title) >= 1", name="industry_news_title_len"),
        Index(
            "industry_news_slug_alive_key",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "industry_news_status_published_alive_idx",
            "status",
            text("published_at DESC"),
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[NewsStatus] = mapped_column(
        pg_enum(NewsStatus, "news_status"), nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    likes: Mapped[list[NewsLike]] = relationship(back_populates="news")


class Promotion(SeoMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "promotions"
    __table_args__ = (
        CheckConstraint(SLUG_FORMAT, name="promotions_slug_format"),
        CheckConstraint(SEO_TITLE_LEN, name="promotions_seo_title_len"),
        CheckConstraint(SEO_DESC_LEN, name="promotions_seo_description_len"),
        CheckConstraint(CANONICAL_FORMAT, name="promotions_canonical_path_format"),
        CheckConstraint("char_length(title) >= 1", name="promotions_title_len"),
        Index(
            "promotions_slug_alive_key",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "promotions_enabled_expires_alive_idx",
            "is_enabled",
            "expires_at",
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    likes: Mapped[list[PromotionLike]] = relationship(back_populates="promotion")


class ArticleLike(Base):
    __tablename__ = "article_likes"
    __table_args__ = (Index("article_likes_article_idx", "article_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    article: Mapped[Article] = relationship(back_populates="likes")


class NewsLike(Base):
    __tablename__ = "news_likes"
    __table_args__ = (Index("news_likes_news_idx", "news_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    news_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("industry_news.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    news: Mapped[IndustryNews] = relationship(back_populates="likes")


class PromotionLike(Base):
    __tablename__ = "promotion_likes"
    __table_args__ = (Index("promotion_likes_promotion_idx", "promotion_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    promotion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("promotions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    promotion: Mapped[Promotion] = relationship(back_populates="likes")


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "(entity_type IS NULL AND entity_id IS NULL) OR "
            "(entity_type IS NOT NULL AND entity_id IS NOT NULL)",
            name="notifications_entity_pair",
        ),
        Index(
            "notifications_user_read_created_idx",
            "user_id",
            "is_read",
            text("created_at DESC"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[NotificationType] = mapped_column(
        pg_enum(NotificationType, "notification_type"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(Text)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )


class ContactInquiry(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "contact_inquiries"
    __table_args__ = (
        CheckConstraint("char_length(name) >= 1", name="contact_inquiries_name_len"),
        CheckConstraint(
            "char_length(message) >= 1", name="contact_inquiries_message_len"
        ),
        Index(
            "contact_inquiries_status_created_alive_idx",
            "status",
            text("created_at DESC"),
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index("contact_inquiries_email_idx", "email"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    stone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stones.id", ondelete="SET NULL")
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL")
    )
    block_lot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("block_lots.id", ondelete="SET NULL")
    )
    ref: Mapped[str | None] = mapped_column(Text)
    source: Mapped[InquirySource] = mapped_column(
        pg_enum(InquirySource, "inquiry_source"),
        nullable=False,
        server_default=text("'contacts'::inquiry_source"),
    )
    status: Mapped[InquiryStatus] = mapped_column(
        pg_enum(InquiryStatus, "inquiry_status"),
        nullable=False,
        server_default=text("'new'::inquiry_status"),
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
