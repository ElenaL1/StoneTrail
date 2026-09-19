from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    USER = "user"
    PROFESSIONAL = "professional"
    MODERATOR = "moderator"
    EDITOR = "editor"
    ADMIN = "admin"


class ActivityType(StrEnum):
    ARCHITECT = "architect"
    DESIGNER = "designer"
    STONE_PROCESSOR = "stone_processor"
    SUPPLIER = "supplier"
    MANUFACTURER = "manufacturer"
    CONSTRUCTION_COMPANY = "construction_company"
    INSTALLATION_COMPANY = "installation_company"
    RESTORER = "restorer"
    OTHER = "other"


class LotItemStatus(StrEnum):
    IN_STOCK = "in_stock"
    RESERVED = "reserved"
    ON_ORDER = "on_order"


class ProductCategory(StrEnum):
    SLABS = "slabs"
    BLANKS = "blanks"
    TILES = "tiles"
    PAVING = "paving"
    CUSTOM = "custom"


class ProductItemKind(StrEnum):
    SLAB = "slab"
    BLANK = "blank"
    TILE = "tile"
    PAVING = "paving"


class PriceType(StrEnum):
    ON_REQUEST = "on_request"
    FIXED = "fixed"


class PriceUnit(StrEnum):
    PIECE = "piece"
    M2 = "m2"
    SLAB = "slab"
    TON = "ton"


class FinishedStatus(StrEnum):
    IN_STOCK = "in_stock"
    ON_ORDER = "on_order"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class PublicationStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class NewsStatus(StrEnum):
    COMING_SOON = "coming_soon"
    DRAFT = "draft"
    PUBLISHED = "published"


class NotificationType(StrEnum):
    COMMUNITY = "community"
    CATALOG = "catalog"
    ARTICLE = "article"
    SUPPLIER = "supplier"
    SYSTEM = "system"


class AuthTokenType(StrEnum):
    VERIFY_EMAIL = "verify_email"
    RESET_PASSWORD = "reset_password"


class CustomGroup(StrEnum):
    INTERIOR = "interior"
    EXTERIOR = "exterior"
    FACADES = "facades"
    ARCHITECTURAL = "architectural"
    MEMORIAL = "memorial"


class InquiryStatus(StrEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class InquirySource(StrEnum):
    CONTACTS = "contacts"
    CATALOG_PRODUCT = "catalog_product"
    CATALOG_BLOCK = "catalog_block"
    OTHER = "other"


class MediaOwner(StrEnum):
    STONE = "stone"
    BLOCK_LOT = "block_lot"
    BLOCK_ITEM = "block_item"
    PRODUCT = "product"
    PRODUCT_ITEM = "product_item"
    ARTICLE = "article"
    NEWS = "news"
    PROMOTION = "promotion"
    USER_AVATAR = "user_avatar"
