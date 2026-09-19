"""Initial schema matching backend/schema/001_initial.sql.

Revision ID: 0001_initial
Revises:
"""

from pathlib import Path

from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

SCHEMA_SQL = Path(__file__).resolve().parents[2] / "schema" / "001_initial.sql"

TABLES = [
    "contact_inquiries",
    "notifications",
    "promotion_likes",
    "news_likes",
    "article_likes",
    "promotions",
    "industry_news",
    "article_comments",
    "articles",
    "forum_comments",
    "forum_posts",
    "product_applications",
    "product_items",
    "products",
    "block_items",
    "block_lots",
    "stones",
    "media_links",
    "media",
    "auth_tokens",
    "sessions",
    "users",
    "article_categories",
    "forum_categories",
    "applications",
    "finishes",
    "stone_types",
]

ENUMS = [
    "media_owner",
    "inquiry_source",
    "inquiry_status",
    "custom_group",
    "auth_token_type",
    "notification_type",
    "news_status",
    "publication_status",
    "finished_status",
    "price_unit",
    "price_type",
    "product_item_kind",
    "product_category",
    "lot_item_status",
    "activity_type",
    "user_role",
]


def _split_sql(script: str) -> list[str]:
    body = script.replace("BEGIN;", "").replace("COMMIT;", "")
    statements: list[str] = []
    buf: list[str] = []
    index = 0
    in_dollar = False
    in_single = False
    while index < len(body):
        if not in_single and body.startswith("$$", index):
            in_dollar = not in_dollar
            buf.append("$$")
            index += 2
            continue
        char = body[index]
        if not in_dollar:
            if in_single:
                buf.append(char)
                if char == "'" and index + 1 < len(body) and body[index + 1] == "'":
                    buf.append("'")
                    index += 2
                    continue
                if char == "'":
                    in_single = False
                index += 1
                continue
            if char == "'":
                in_single = True
                buf.append(char)
                index += 1
                continue
            if char == ";":
                statement = "".join(buf).strip()
                if statement:
                    statements.append(statement)
                buf = []
                index += 1
                continue
        buf.append(char)
        index += 1
    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    useful: list[str] = []
    for statement in statements:
        lines = [
            line
            for line in statement.splitlines()
            if line.strip() and not line.strip().startswith("--")
        ]
        if lines:
            useful.append(statement)
    return useful


def upgrade() -> None:
    script = SCHEMA_SQL.read_text(encoding="utf-8")
    bind = op.get_bind()
    for statement in _split_sql(script):
        bind.exec_driver_sql(statement)


def downgrade() -> None:
    bind = op.get_bind()
    for table in TABLES:
        bind.exec_driver_sql(f"DROP TABLE IF EXISTS {table} CASCADE")
    bind.exec_driver_sql("DROP FUNCTION IF EXISTS set_updated_at()")
    for enum_name in ENUMS:
        bind.exec_driver_sql(f"DROP TYPE IF EXISTS {enum_name}")
    bind.exec_driver_sql("DROP EXTENSION IF EXISTS pg_trgm")
    bind.exec_driver_sql("DROP EXTENSION IF EXISTS citext")
