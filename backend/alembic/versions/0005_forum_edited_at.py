"""Forum post and comment edit timestamps.

Revision ID: 0005_forum_edited_at
Revises: 0004_forum_engagement
"""

from alembic import op

revision = "0005_forum_edited_at"
down_revision = "0004_forum_engagement"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE forum_posts ADD COLUMN edited_at TIMESTAMPTZ")
    op.execute("ALTER TABLE forum_comments ADD COLUMN edited_at TIMESTAMPTZ")


def downgrade() -> None:
    op.execute("ALTER TABLE forum_comments DROP COLUMN edited_at")
    op.execute("ALTER TABLE forum_posts DROP COLUMN edited_at")
