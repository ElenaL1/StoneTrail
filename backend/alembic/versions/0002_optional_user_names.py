"""Allow empty first and last names.

Revision ID: 0002_optional_user_names
Revises: 0001_initial
"""

from alembic import op

revision = "0002_optional_user_names"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users DROP CONSTRAINT users_first_name_len")
    op.execute("ALTER TABLE users DROP CONSTRAINT users_last_name_len")
    op.execute("""
        ALTER TABLE users
        ADD CONSTRAINT users_first_name_len
        CHECK (first_name = '' OR char_length(first_name) >= 2)
        """)
    op.execute("""
        ALTER TABLE users
        ADD CONSTRAINT users_last_name_len
        CHECK (last_name = '' OR char_length(last_name) >= 2)
        """)
    op.execute("ALTER TABLE users ALTER COLUMN first_name SET DEFAULT ''")
    op.execute("ALTER TABLE users ALTER COLUMN last_name SET DEFAULT ''")


def downgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN first_name DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN last_name DROP DEFAULT")
    op.execute("ALTER TABLE users DROP CONSTRAINT users_first_name_len")
    op.execute("ALTER TABLE users DROP CONSTRAINT users_last_name_len")
    op.execute("""
        ALTER TABLE users
        ADD CONSTRAINT users_first_name_len
        CHECK (char_length(first_name) >= 2)
        """)
    op.execute("""
        ALTER TABLE users
        ADD CONSTRAINT users_last_name_len
        CHECK (char_length(last_name) >= 2)
        """)
