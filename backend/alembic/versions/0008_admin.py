"""Page blocks and audit events for the admin panel.

Revision ID: 0008_admin
Revises: 0007_yandex_auth
"""

from alembic import op

revision = "0008_admin"
down_revision = "0007_yandex_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE page_block_kind AS ENUM ('text', 'markdown', 'image')")
    op.execute("CREATE TYPE page_block_status AS ENUM ('draft', 'published')")
    op.execute("""
        CREATE TABLE page_blocks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            page_key TEXT NOT NULL,
            block_key TEXT NOT NULL,
            kind page_block_kind NOT NULL,
            draft_value TEXT NOT NULL DEFAULT '',
            published_value TEXT NOT NULL DEFAULT '',
            status page_block_status NOT NULL DEFAULT 'draft',
            effective_from DATE,
            media_id UUID REFERENCES media (id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT page_blocks_page_block_key UNIQUE (page_key, block_key),
            CONSTRAINT page_blocks_page_key_len CHECK (char_length(page_key) >= 1),
            CONSTRAINT page_blocks_block_key_len CHECK (char_length(block_key) >= 1)
        )
        """)
    op.execute("""
        CREATE TABLE audit_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            actor_id UUID REFERENCES users (id) ON DELETE SET NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            detail JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """)
    op.execute(
        "CREATE INDEX audit_events_created_idx ON audit_events (created_at DESC)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS audit_events")
    op.execute("DROP TABLE IF EXISTS page_blocks")
    op.execute("DROP TYPE IF EXISTS page_block_status")
    op.execute("DROP TYPE IF EXISTS page_block_kind")
