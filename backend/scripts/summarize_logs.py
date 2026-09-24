"""Aggregate sanitized JSON logs for a human or an AI review.

Reads JSON lines from stdin. Drops secret-like fields and stack traces.
Prints counts only — no raw log lines.
"""

from __future__ import annotations

import json
import sys
from collections import Counter

_SECRET_KEYS = (
    "password",
    "token",
    "cookie",
    "authorization",
    "secret",
    "api_key",
    "apikey",
)


def _keep(key: str) -> bool:
    lowered = key.lower().replace("-", "_")
    return not any(part in lowered for part in _SECRET_KEYS)


def summarize(lines: list[str]) -> dict[str, object]:
    by_code: Counter[str] = Counter()
    by_route: Counter[str] = Counter()
    by_status: Counter[str] = Counter()
    server_errors = 0
    database = 0
    auth_failures = 0
    parsed = 0
    for line in lines:
        text = line.strip()
        if not text:
            continue
        try:
            row = json.loads(text)
        except json.JSONDecodeError:
            continue
        if not isinstance(row, dict):
            continue
        parsed += 1
        safe = {
            key: value for key, value in row.items() if _keep(key) and key != "stack"
        }
        code = str(safe.get("errorCode") or "")
        route = str(safe.get("route") or "")
        status = safe.get("statusCode")
        if code:
            by_code[code] += 1
        if route and isinstance(status, int) and status >= 500:
            by_route[f"{route} {status}"] += 1
        if isinstance(status, int):
            by_status[str(status)] += 1
            if status >= 500:
                server_errors += 1
        if code in {"database", "unavailable"}:
            database += 1
        if code in {"invalid_credentials", "forbidden", "unverified"}:
            auth_failures += 1
    return {
        "parsed": parsed,
        "serverErrors": server_errors,
        "databaseFailures": database,
        "authFailures": auth_failures,
        "byStatus": dict(by_status),
        "byErrorCode": dict(by_code.most_common(20)),
        "failingRoutes": dict(by_route.most_common(20)),
    }


def main() -> None:
    summary = summarize(sys.stdin.readlines())
    json.dump(summary, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
