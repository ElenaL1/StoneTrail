from __future__ import annotations

import contextvars
import json
import logging
import re
from datetime import UTC, datetime
from typing import Any

request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "request_id", default=None
)

_SAFE_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")
_SECRET_VALUE = re.compile(
    r"(?i)(password|cookie|authorization|api[_-]?key|secret)([^\s\"']*)"
)


def _scrub(text: str) -> str:
    return _SECRET_VALUE.sub(r"\1=[redacted]", text)


ACCESS_LOGGER = "stonetrail.access"


def sanitize_request_id(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.replace("\r", "").replace("\n", "").strip()
    if _SAFE_REQUEST_ID.fullmatch(cleaned):
        return cleaned
    return None


def current_request_id() -> str | None:
    return request_id_var.get()


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname.lower(),
            "message": _scrub(record.getMessage()),
            "logger": record.name,
        }
        request_id = getattr(record, "requestId", None) or request_id_var.get()
        if request_id:
            payload["requestId"] = request_id
        user_id = getattr(record, "userId", None)
        if user_id:
            payload["userId"] = user_id
        for key in ("route", "method", "statusCode", "durationMs", "errorCode"):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        if record.exc_info and record.levelno >= logging.ERROR:
            payload["stack"] = _scrub(self.formatException(record.exc_info))
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level_name: str) -> None:
    level = getattr(logging, level_name.upper(), logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    handler._stonetrail_json = True  # type: ignore[attr-defined]

    root = logging.getLogger()
    root.setLevel(level)
    if not any(getattr(item, "_stonetrail_json", False) for item in root.handlers):
        root.addHandler(handler)

    access = logging.getLogger(ACCESS_LOGGER)
    access.setLevel(level)
    access.propagate = True
