"""Banner template and button label on promotions.

Revision ID: 0009_promotion_templates
Revises: 0008_admin
"""

from alembic import op

revision = "0009_promotion_templates"
down_revision = "0008_admin"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE promotions
            ADD COLUMN template TEXT NOT NULL DEFAULT 'stone',
            ADD COLUMN button_label TEXT NOT NULL DEFAULT 'Узнать детали'
        """)
    op.execute("""
        ALTER TABLE promotions
            ADD CONSTRAINT promotions_template_known CHECK (
                template IN (
                    'stone', 'slab', 'quarry', 'vein', 'ledger',
                    'split', 'band', 'frame', 'seal', 'quiet'
                )
            ),
            ADD CONSTRAINT promotions_button_label_len CHECK (
                char_length(button_label) BETWEEN 1 AND 80
            )
        """)


def downgrade() -> None:
    op.execute(
        "ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_button_label_len"
    )
    op.execute(
        "ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_template_known"
    )
    op.execute("ALTER TABLE promotions DROP COLUMN IF EXISTS button_label")
    op.execute("ALTER TABLE promotions DROP COLUMN IF EXISTS template")
