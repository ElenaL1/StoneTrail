"""Article publishing statuses and trusted-author flag.

Revision ID: 0003_article_publishing
Revises: 0002_optional_user_names
"""

from alembic import op

revision = "0003_article_publishing"
down_revision = "0002_optional_user_names"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE publication_status ADD VALUE IF NOT EXISTS 'pending_review'")
    op.execute("ALTER TYPE publication_status ADD VALUE IF NOT EXISTS 'needs_revision'")
    op.execute("ALTER TYPE publication_status ADD VALUE IF NOT EXISTS 'rejected'")
    op.execute(
        """
        ALTER TABLE users
        ADD COLUMN can_publish_articles BOOLEAN NOT NULL DEFAULT false
        """
    )
    op.execute(
        """
        ALTER TABLE articles
        ADD COLUMN moderation_note TEXT NOT NULL DEFAULT ''
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE articles DROP COLUMN moderation_note")
    op.execute("ALTER TABLE users DROP COLUMN can_publish_articles")
