"""Promotion inquiry button, offer sheet and price lines.

Revision ID: 0013_promotion_lines
Revises: 0012_media_link_caption
"""

from alembic import op

revision = "0013_promotion_lines"
down_revision = "0012_media_link_caption"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE promotions
            ADD COLUMN inquiry_label TEXT NOT NULL DEFAULT 'Запросить',
            ADD COLUMN publish_to_catalog BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN offer_note TEXT NOT NULL DEFAULT '',
            ADD COLUMN sheet_image_url TEXT NOT NULL DEFAULT '',
            ADD COLUMN sheet_pdf_url TEXT NOT NULL DEFAULT ''
        """)
    op.execute("""
        ALTER TABLE promotions
            ADD CONSTRAINT promotions_inquiry_label_len
            CHECK (char_length(inquiry_label) BETWEEN 1 AND 80)
        """)
    op.execute("""
        CREATE TABLE promotion_lines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            promotion_id UUID NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
            kind TEXT NOT NULL,
            group_name TEXT NOT NULL,
            stone_name TEXT NOT NULL DEFAULT '',
            label TEXT NOT NULL,
            stone_id UUID REFERENCES stones (id) ON DELETE SET NULL,
            finish TEXT,
            length_mm INTEGER,
            width_mm INTEGER,
            thickness_mm INTEGER,
            height_mm INTEGER,
            weight_kg NUMERIC(10, 2),
            area_m2 NUMERIC(12, 2),
            price_amount NUMERIC(12, 2),
            price_unit TEXT,
            unresolved BOOLEAN NOT NULL DEFAULT false,
            sort_order INTEGER NOT NULL DEFAULT 0,
            catalog_product_id UUID REFERENCES products (id) ON DELETE SET NULL,
            catalog_block_lot_id UUID REFERENCES block_lots (id) ON DELETE SET NULL,
            catalog_product_item_id UUID
                REFERENCES product_items (id) ON DELETE SET NULL,
            catalog_block_item_id UUID
                REFERENCES block_items (id) ON DELETE SET NULL,
            CONSTRAINT promotion_lines_kind_known
                CHECK (kind IN ('tile', 'slab', 'block')),
            CONSTRAINT promotion_lines_price_unit_known
                CHECK (
                    price_unit IS NULL
                    OR price_unit IN ('m2', 'slab', 'ton', 'piece')
                ),
            CONSTRAINT promotion_lines_group_name_len
                CHECK (char_length(group_name) >= 1),
            CONSTRAINT promotion_lines_label_len
                CHECK (char_length(label) >= 1),
            CONSTRAINT promotion_lines_price_non_negative
                CHECK (price_amount IS NULL OR price_amount >= 0)
        )
        """)
    op.execute("""
        CREATE INDEX promotion_lines_promotion_idx
            ON promotion_lines (promotion_id, sort_order)
        """)
    op.execute("""
        CREATE INDEX promotion_lines_product_idx
            ON promotion_lines (catalog_product_id)
        """)
    op.execute("""
        CREATE INDEX promotion_lines_lot_idx
            ON promotion_lines (catalog_block_lot_id)
        """)


def downgrade() -> None:
    op.execute("DROP TABLE promotion_lines")
    op.execute("""
        ALTER TABLE promotions
            DROP CONSTRAINT promotions_inquiry_label_len,
            DROP COLUMN inquiry_label,
            DROP COLUMN publish_to_catalog,
            DROP COLUMN offer_note,
            DROP COLUMN sheet_image_url,
            DROP COLUMN sheet_pdf_url
        """)
