"""Upload status, forum attachments, and external video on media.

Revision ID: 0010_media_uploads
Revises: 0009_promotion_templates
"""

from alembic import op

revision = "0010_media_uploads"
down_revision = "0009_promotion_templates"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE media_kind AS ENUM ('image', 'video', 'external_video')")
    op.execute("CREATE TYPE media_status AS ENUM ('pending', 'ready', 'failed')")
    op.execute("ALTER TYPE media_owner ADD VALUE IF NOT EXISTS 'forum_post'")
    op.execute("""
        ALTER TABLE media
            ADD COLUMN kind media_kind NOT NULL DEFAULT 'image',
            ADD COLUMN status media_status NOT NULL DEFAULT 'ready',
            ADD COLUMN uploaded_by UUID REFERENCES users (id) ON DELETE SET NULL,
            ADD COLUMN external_provider TEXT,
            ADD COLUMN external_id TEXT,
            ADD COLUMN duration_seconds INT
        """)
    op.execute("ALTER TABLE media ALTER COLUMN storage_key DROP NOT NULL")
    op.execute("ALTER TABLE media DROP CONSTRAINT media_size_positive")
    op.execute("""
        ALTER TABLE media
            ADD CONSTRAINT media_size_nonnegative CHECK (size_bytes >= 0),
            ADD CONSTRAINT media_duration_positive CHECK (
                duration_seconds IS NULL OR duration_seconds > 0
            ),
            ADD CONSTRAINT media_external_shape CHECK (
                (
                    kind = 'external_video'
                    AND storage_key IS NULL
                    AND external_provider IS NOT NULL
                    AND external_id IS NOT NULL
                )
                OR (
                    kind <> 'external_video'
                    AND storage_key IS NOT NULL
                    AND external_provider IS NULL
                    AND external_id IS NULL
                )
            )
        """)
    op.execute("CREATE INDEX media_uploader_status_idx ON media (uploaded_by, status)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS media_uploader_status_idx")
    op.execute("ALTER TABLE media DROP CONSTRAINT IF EXISTS media_external_shape")
    op.execute("ALTER TABLE media DROP CONSTRAINT IF EXISTS media_duration_positive")
    op.execute("ALTER TABLE media DROP CONSTRAINT IF EXISTS media_size_nonnegative")
    op.execute("DELETE FROM media WHERE storage_key IS NULL")
    op.execute("ALTER TABLE media ALTER COLUMN storage_key SET NOT NULL")
    op.execute(
        "ALTER TABLE media ADD CONSTRAINT media_size_positive CHECK (size_bytes > 0)"
    )
    op.execute("ALTER TABLE media DROP COLUMN IF EXISTS duration_seconds")
    op.execute("ALTER TABLE media DROP COLUMN IF EXISTS external_id")
    op.execute("ALTER TABLE media DROP COLUMN IF EXISTS external_provider")
    op.execute("ALTER TABLE media DROP COLUMN IF EXISTS uploaded_by")
    op.execute("ALTER TABLE media DROP COLUMN IF EXISTS status")
    op.execute("ALTER TABLE media DROP COLUMN IF EXISTS kind")
    op.execute("DROP TYPE IF EXISTS media_status")
    op.execute("DROP TYPE IF EXISTS media_kind")
