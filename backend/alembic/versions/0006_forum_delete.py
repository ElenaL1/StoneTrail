"""Who hid a forum post or comment, and keep reply trees on hard delete.

Revision ID: 0006_forum_delete
Revises: 0005_forum_edited_at
"""

from alembic import op

revision = "0006_forum_delete"
down_revision = "0005_forum_edited_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE forum_posts
        ADD COLUMN deleted_by UUID REFERENCES users (id) ON DELETE SET NULL
        """
    )
    op.execute(
        """
        ALTER TABLE forum_comments
        ADD COLUMN deleted_by UUID REFERENCES users (id) ON DELETE SET NULL
        """
    )
    op.execute(
        "ALTER TABLE forum_comments DROP CONSTRAINT forum_comments_parent_id_fkey"
    )
    op.execute(
        """
        ALTER TABLE forum_comments
        ADD CONSTRAINT forum_comments_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES forum_comments (id) ON DELETE SET NULL
        """
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE forum_comments DROP CONSTRAINT forum_comments_parent_id_fkey"
    )
    op.execute(
        """
        ALTER TABLE forum_comments
        ADD CONSTRAINT forum_comments_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES forum_comments (id) ON DELETE CASCADE
        """
    )
    op.execute("ALTER TABLE forum_comments DROP COLUMN deleted_by")
    op.execute("ALTER TABLE forum_posts DROP COLUMN deleted_by")
