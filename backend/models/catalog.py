from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import (
    CHAR,
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Table,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, SeoMixin, SoftDeleteMixin, TimestampMixin, pg_enum
from models.enums import (
    CustomGroup,
    FinishedStatus,
    LotItemStatus,
    PriceType,
    PriceUnit,
    ProductCategory,
    ProductItemKind,
)
from models.lookups import Application, Finish, StoneType

product_applications = Table(
    "product_applications",
    Base.metadata,
    Column(
        "product_id",
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "application_id",
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="RESTRICT"),
        primary_key=True,
    ),
    Index("product_applications_application_idx", "application_id"),
)

SLUG_FORMAT = "slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'"
SEO_TITLE_LEN = "seo_title IS NULL OR char_length(seo_title) <= 70"
SEO_DESC_LEN = "seo_description IS NULL OR char_length(seo_description) <= 320"
CANONICAL_FORMAT = "canonical_path IS NULL OR canonical_path ~ '^/'"


class Stone(SeoMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "stones"
    __table_args__ = (
        CheckConstraint(SLUG_FORMAT, name="stones_slug_format"),
        CheckConstraint(SEO_TITLE_LEN, name="stones_seo_title_len"),
        CheckConstraint(SEO_DESC_LEN, name="stones_seo_description_len"),
        CheckConstraint(CANONICAL_FORMAT, name="stones_canonical_path_format"),
        CheckConstraint("char_length(name) >= 1", name="stones_name_len"),
        Index(
            "stones_slug_alive_key",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "stones_type_alive_idx",
            "stone_type_id",
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "stones_name_trgm_idx",
            "name",
            postgresql_using="gin",
            postgresql_ops={"name": "gin_trgm_ops"},
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    stone_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stone_types.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quarry: Mapped[str] = mapped_column(Text, nullable=False)
    country: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    stone_type: Mapped[StoneType] = relationship(back_populates="stones")
    block_lots: Mapped[list[BlockLot]] = relationship(back_populates="stone")
    products: Mapped[list[Product]] = relationship(back_populates="stone")


class BlockLot(SeoMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "block_lots"
    __table_args__ = (
        CheckConstraint(SLUG_FORMAT, name="block_lots_slug_format"),
        CheckConstraint(SEO_TITLE_LEN, name="block_lots_seo_title_len"),
        CheckConstraint(SEO_DESC_LEN, name="block_lots_seo_description_len"),
        CheckConstraint(CANONICAL_FORMAT, name="block_lots_canonical_path_format"),
        Index(
            "block_lots_slug_alive_key",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "block_lots_stone_alive_idx",
            "stone_id",
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    stone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stones.id", ondelete="RESTRICT"), nullable=False
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    expert_note: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    stone: Mapped[Stone] = relationship(back_populates="block_lots")
    items: Mapped[list[BlockItem]] = relationship(
        back_populates="lot", cascade="all, delete-orphan"
    )


class BlockItem(TimestampMixin, Base):
    __tablename__ = "block_items"
    __table_args__ = (
        UniqueConstraint("lot_id", "label", name="block_items_lot_label_key"),
        CheckConstraint("char_length(label) >= 1", name="block_items_label_len"),
        CheckConstraint(
            "length_mm IS NULL OR length_mm > 0", name="block_items_length_positive"
        ),
        CheckConstraint(
            "width_mm IS NULL OR width_mm > 0", name="block_items_width_positive"
        ),
        CheckConstraint(
            "height_mm IS NULL OR height_mm > 0", name="block_items_height_positive"
        ),
        CheckConstraint(
            "weight_kg IS NULL OR weight_kg > 0", name="block_items_weight_positive"
        ),
        Index("block_items_lot_status_idx", "lot_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("block_lots.id", ondelete="CASCADE"),
        nullable=False,
    )
    label: Mapped[str] = mapped_column(Text, nullable=False)
    length_mm: Mapped[int | None] = mapped_column(Integer)
    width_mm: Mapped[int | None] = mapped_column(Integer)
    height_mm: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[Any | None] = mapped_column(Numeric(10, 2))
    finish_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("finishes.id", ondelete="RESTRICT")
    )
    status: Mapped[LotItemStatus] = mapped_column(
        pg_enum(LotItemStatus, "lot_item_status"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    lot: Mapped[BlockLot] = relationship(back_populates="items")
    finish: Mapped[Finish | None] = relationship()


class Product(SeoMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint(SLUG_FORMAT, name="products_slug_format"),
        CheckConstraint(SEO_TITLE_LEN, name="products_seo_title_len"),
        CheckConstraint(SEO_DESC_LEN, name="products_seo_description_len"),
        CheckConstraint(CANONICAL_FORMAT, name="products_canonical_path_format"),
        CheckConstraint("char_length(name) >= 1", name="products_name_len"),
        CheckConstraint(
            "char_length(description) >= 1", name="products_description_len"
        ),
        CheckConstraint("currency ~ '^[A-Z]{3}$'", name="products_currency_format"),
        CheckConstraint(
            "amount IS NULL OR amount >= 0", name="products_amount_non_negative"
        ),
        CheckConstraint(
            "price_type = 'on_request' OR amount IS NOT NULL",
            name="products_price_fixed_has_amount",
        ),
        CheckConstraint(
            "jsonb_typeof(characteristics) = 'object'",
            name="products_characteristics_object",
        ),
        CheckConstraint(
            "category <> 'custom' OR ("
            "product_type IS NOT NULL AND custom_group IS NOT NULL "
            "AND status IS NOT NULL AND finish IS NOT NULL)",
            name="products_custom_required",
        ),
        CheckConstraint(
            "category = 'custom' OR custom_group IS NULL",
            name="products_custom_group_only",
        ),
        Index(
            "products_slug_alive_key",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "products_category_stone_alive_idx",
            "category",
            "stone_id",
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "products_custom_group_alive_idx",
            "custom_group",
            postgresql_where=text("category = 'custom' AND deleted_at IS NULL"),
        ),
        Index(
            "products_name_trgm_idx",
            "name",
            postgresql_using="gin",
            postgresql_ops={"name": "gin_trgm_ops"},
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    category: Mapped[ProductCategory] = mapped_column(
        pg_enum(ProductCategory, "product_category"), nullable=False
    )
    stone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stones.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    product_type: Mapped[str | None] = mapped_column(Text)
    custom_group: Mapped[CustomGroup | None] = mapped_column(
        pg_enum(CustomGroup, "custom_group")
    )
    purpose: Mapped[str | None] = mapped_column(Text)
    price_type: Mapped[PriceType] = mapped_column(
        pg_enum(PriceType, "price_type"),
        nullable=False,
        server_default=text("'on_request'::price_type"),
    )
    amount: Mapped[Any | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(
        CHAR(3), nullable=False, server_default=text("'RUB'")
    )
    price_unit: Mapped[PriceUnit | None] = mapped_column(
        pg_enum(PriceUnit, "price_unit")
    )
    characteristics: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    height: Mapped[str | None] = mapped_column(Text)
    diameter: Mapped[str | None] = mapped_column(Text)
    format: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(Text)
    thickness: Mapped[str | None] = mapped_column(Text)
    finish: Mapped[str | None] = mapped_column(Text)
    size: Mapped[str | None] = mapped_column(Text)
    dimensions: Mapped[str | None] = mapped_column(Text)
    expert_note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[FinishedStatus | None] = mapped_column(
        pg_enum(FinishedStatus, "finished_status")
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    stone: Mapped[Stone] = relationship(back_populates="products")
    items: Mapped[list[ProductItem]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    applications: Mapped[list[Application]] = relationship(
        secondary=product_applications
    )


class ProductItem(TimestampMixin, Base):
    __tablename__ = "product_items"
    __table_args__ = (
        UniqueConstraint("product_id", "label", name="product_items_product_label_key"),
        CheckConstraint("char_length(label) >= 1", name="product_items_label_len"),
        CheckConstraint(
            "length_mm IS NULL OR length_mm > 0", name="product_items_length_positive"
        ),
        CheckConstraint(
            "width_mm IS NULL OR width_mm > 0", name="product_items_width_positive"
        ),
        CheckConstraint(
            "thickness_mm IS NULL OR thickness_mm > 0",
            name="product_items_thickness_positive",
        ),
        CheckConstraint(
            "weight_kg IS NULL OR weight_kg > 0", name="product_items_weight_positive"
        ),
        Index("product_items_product_kind_idx", "product_id", "kind"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    kind: Mapped[ProductItemKind] = mapped_column(
        pg_enum(ProductItemKind, "product_item_kind"), nullable=False
    )
    label: Mapped[str] = mapped_column(Text, nullable=False)
    length_mm: Mapped[int | None] = mapped_column(Integer)
    width_mm: Mapped[int | None] = mapped_column(Integer)
    thickness_mm: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[Any | None] = mapped_column(Numeric(10, 2))
    finish_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("finishes.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[LotItemStatus] = mapped_column(
        pg_enum(LotItemStatus, "lot_item_status"), nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    product: Mapped[Product] = relationship(back_populates="items")
    finish: Mapped[Finish] = relationship()
