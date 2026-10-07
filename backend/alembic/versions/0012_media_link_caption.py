"""Caption for a photo linked to a catalog owner.

Revision ID: 0012_media_link_caption
Revises: 0011_product_stones
"""

from alembic import op

revision = "0012_media_link_caption"
down_revision = "0011_product_stones"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE media_links ADD COLUMN caption TEXT NOT NULL DEFAULT ''"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE media_links DROP COLUMN caption")
