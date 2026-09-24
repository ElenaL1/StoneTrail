from __future__ import annotations

import logging
import time
from uuid import uuid4

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from core.logging import ACCESS_LOGGER, request_id_var, sanitize_request_id

logger = logging.getLogger(ACCESS_LOGGER)


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        header = _header(scope, b"x-request-id")
        request_id = sanitize_request_id(header) or f"req_{uuid4().hex}"
        state = scope.setdefault("state", {})
        if isinstance(state, dict):
            state["request_id"] = request_id

        status_code = 500
        started = time.perf_counter()
        token = request_id_var.set(request_id)

        async def send_with_id(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = int(message["status"])
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("ascii")))
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        finally:
            duration_ms = int((time.perf_counter() - started) * 1000)
            user_id = state.get("user_id") if isinstance(state, dict) else None
            route = _route(scope)
            logger.info(
                "request",
                extra={
                    "requestId": request_id,
                    "userId": user_id,
                    "route": route,
                    "method": scope.get("method"),
                    "statusCode": status_code,
                    "durationMs": duration_ms,
                },
            )
            request_id_var.reset(token)


def _header(scope: Scope, name: bytes) -> str | None:
    for key, value in scope.get("headers", []):
        if key.lower() == name:
            return value.decode("latin-1")
    return None


def _route(scope: Scope) -> str:
    route = scope.get("route")
    path = getattr(route, "path", None)
    if isinstance(path, str):
        return path
    raw = scope.get("path")
    return raw if isinstance(raw, str) else ""
