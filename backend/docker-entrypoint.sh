#!/bin/sh
set -e

python - <<'PY'
import sys
import time

from sqlalchemy import create_engine, text

from core.config import get_settings

url = get_settings().sync_database_url
engine = create_engine(url)
deadline = time.monotonic() + 60
last_error = None
while time.monotonic() < deadline:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        sys.exit(0)
    except Exception as exc:
        last_error = exc
        time.sleep(1)
print(f"database is not ready: {last_error}", file=sys.stderr)
sys.exit(1)
PY

alembic upgrade head
exec uvicorn api.main:app --host 0.0.0.0 --port 8000 --no-access-log
