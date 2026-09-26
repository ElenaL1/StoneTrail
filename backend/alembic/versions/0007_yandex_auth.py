"""Yandex ID identities, OAuth state, and optional password.

Revision ID: 0007_yandex_auth
Revises: 0006_forum_delete
"""

from alembic import op

revision = "0007_yandex_auth"
down_revision = "0006_forum_delete"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL")
    op.execute("""
        CREATE TABLE auth_identities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            provider_user_id TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT auth_identities_provider_check CHECK (provider IN ('yandex')),
            CONSTRAINT auth_identities_provider_user_key UNIQUE (provider, provider_user_id),
            CONSTRAINT auth_identities_user_provider_key UNIQUE (user_id, provider)
        )
        """)
    op.execute("""
        CREATE TABLE oauth_states (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            state_hash TEXT NOT NULL UNIQUE,
            intent TEXT NOT NULL,
            user_id UUID REFERENCES users (id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            provider_user_id TEXT,
            email TEXT,
            provider_login TEXT,
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            next_path TEXT NOT NULL DEFAULT '/profile',
            expires_at TIMESTAMPTZ NOT NULL,
            used_at TIMESTAMPTZ,
            finished_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT oauth_states_intent_check CHECK (intent IN ('login', 'link')),
            CONSTRAINT oauth_states_provider_check CHECK (provider IN ('yandex'))
        )
        """)


def downgrade() -> None:
    op.execute("DROP TABLE oauth_states")
    op.execute("DROP TABLE auth_identities")
    op.execute("""
        UPDATE users
        SET password_hash = '!'
        WHERE password_hash IS NULL
        """)
    op.execute("ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL")
