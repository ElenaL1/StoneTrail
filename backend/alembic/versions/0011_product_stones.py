"""Several stones can belong to one product.

Revision ID: 0011_product_stones
Revises: 0010_media_uploads
"""

from alembic import op

revision = "0011_product_stones"
down_revision = "0010_media_uploads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE product_stones (
            product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
            stone_id UUID NOT NULL REFERENCES stones (id) ON DELETE RESTRICT,
            sort_order INT NOT NULL DEFAULT 0,
            PRIMARY KEY (product_id, stone_id),
            CONSTRAINT product_stones_sort_non_negative CHECK (sort_order >= 0)
        )
        """)
    op.execute("CREATE INDEX product_stones_stone_idx ON product_stones (stone_id)")
    op.execute("""
        INSERT INTO product_stones (product_id, stone_id, sort_order)
        SELECT id, stone_id, 0 FROM products
        """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS product_stones")
