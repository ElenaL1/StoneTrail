"""Forum views, reply tree, and likes.

Revision ID: 0004_forum_engagement
Revises: 0003_article_publishing
"""

from alembic import op

revision = "0004_forum_engagement"
down_revision = "0003_article_publishing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE forum_posts
        ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0
        """
    )
    op.execute(
        """
        ALTER TABLE forum_comments
        ADD COLUMN parent_id UUID REFERENCES forum_comments (id) ON DELETE CASCADE
        """
    )
    op.execute(
        """
        ALTER TABLE forum_comments
        ADD CONSTRAINT forum_comments_not_self_parent
        CHECK (parent_id IS DISTINCT FROM id)
        """
    )
    op.execute(
        "CREATE INDEX forum_comments_parent_idx ON forum_comments (parent_id)"
    )
    op.execute(
        """
        CREATE TABLE forum_post_likes (
            user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
            post_id UUID NOT NULL REFERENCES forum_posts (id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, post_id)
        )
        """
    )
    op.execute(
        "CREATE INDEX forum_post_likes_post_idx ON forum_post_likes (post_id)"
    )
    op.execute(
        """
        CREATE TABLE forum_comment_likes (
            user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
            comment_id UUID NOT NULL REFERENCES forum_comments (id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, comment_id)
        )
        """
    )
    op.execute(
        "CREATE INDEX forum_comment_likes_comment_idx ON forum_comment_likes (comment_id)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE forum_comment_likes")
    op.execute("DROP TABLE forum_post_likes")
    op.execute("DROP INDEX forum_comments_parent_idx")
    op.execute(
        "ALTER TABLE forum_comments DROP CONSTRAINT forum_comments_not_self_parent"
    )
    op.execute("ALTER TABLE forum_comments DROP COLUMN parent_id")
    op.execute("ALTER TABLE forum_posts DROP COLUMN view_count")
