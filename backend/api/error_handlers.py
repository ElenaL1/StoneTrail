import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic.alias_generators import to_camel
from sqlalchemy.exc import (
    DBAPIError,
    DisconnectionError,
    IntegrityError,
    InterfaceError,
    OperationalError,
    SQLAlchemyError,
)
from sqlalchemy.exc import TimeoutError as SATimeoutError
from starlette.exceptions import HTTPException as StarletteHTTPException

from core import messages
from core.errors import ApiError, ErrorBody
from core.logging import current_request_id

logger = logging.getLogger(__name__)

_HTTP_MESSAGES = {
    401: (messages.LOGIN_FAILED, "invalid_credentials"),
    403: (messages.FORBIDDEN, "forbidden"),
    404: (messages.NOT_FOUND, "not_found"),
    405: (messages.METHOD_NOT_ALLOWED, "validation"),
    409: (messages.CONFLICT, "conflict"),
    422: (messages.SERVER, "validation"),
    429: (messages.RATE_LIMITED, "rate_limited"),
}


def _validation_message(err: dict[str, object]) -> str:
    msg = str(err.get("msg", messages.SERVER))
    prefix = "Value error, "
    if msg.startswith(prefix):
        return msg[len(prefix) :]
    return msg


def _field_name(err: dict[str, object]) -> str:
    loc = err.get("loc", ())
    parts = [part for part in loc if part not in {"body", "query", "path"}]
    if not parts:
        return "body"
    name = str(parts[-1])
    if name.isidentifier() and "_" in name:
        return to_camel(name)
    return name


def _request_id(request: Request) -> str | None:
    value = getattr(request.state, "request_id", None)
    if isinstance(value, str):
        return value
    return current_request_id()


def _error_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    field_errors: dict[str, str] | None = None,
    retry_after_seconds: int | None = None,
    exc: BaseException | None = None,
    fields: list[str] | None = None,
) -> JSONResponse:
    body = ErrorBody(
        message=message,
        code=code,
        field_errors=field_errors,
        retry_after_seconds=retry_after_seconds,
        request_id=_request_id(request),
    )
    headers = {}
    if retry_after_seconds is not None:
        headers["Retry-After"] = str(retry_after_seconds)
    level = logging.ERROR if status_code >= 500 else logging.WARNING
    extra: dict[str, object] = {
        "errorCode": code,
        "statusCode": status_code,
        "route": request.url.path,
        "method": request.method,
    }
    if fields:
        extra["fields"] = fields
    logger.log(
        level,
        message,
        exc_info=exc if status_code >= 500 else None,
        extra=extra,
    )
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(by_alias=True),
        headers=headers,
    )


def _sqlstate(exc: BaseException) -> str | None:
    orig = getattr(exc, "orig", None)
    for source in (orig, exc):
        if source is None:
            continue
        for attr in ("sqlstate", "pgcode"):
            value = getattr(source, attr, None)
            if isinstance(value, str):
                return value
    return None


def classify_database_error(exc: SQLAlchemyError) -> tuple[int, str, str]:
    state = _sqlstate(exc)
    if isinstance(exc, IntegrityError) and (
        state == "23505" or "unique" in str(getattr(exc, "orig", "")).lower()
    ):
        return 409, "conflict", messages.CONFLICT
    if state == "40P01":
        return 500, "database", messages.SERVER
    unavailable = isinstance(
        exc, (OperationalError, InterfaceError, DisconnectionError, SATimeoutError)
    ) or (
        isinstance(exc, DBAPIError)
        and bool(getattr(exc, "connection_invalidated", False))
    )
    if unavailable:
        return 503, "unavailable", messages.UNAVAILABLE
    return 500, "database", messages.SERVER


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
        return _error_response(
            request,
            exc.status_code,
            exc.code,
            exc.message,
            exc.field_errors,
            exc.retry_after_seconds,
            exc if exc.status_code >= 500 else None,
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        field_errors: dict[str, str] = {}
        for err in exc.errors():
            field_errors[_field_name(err)] = _validation_message(err)
        message = next(iter(field_errors.values()), messages.SERVER)
        return _error_response(
            request,
            422,
            "validation",
            message,
            field_errors or None,
            fields=sorted(field_errors),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        message, code = _HTTP_MESSAGES.get(
            exc.status_code, (messages.SERVER, "internal")
        )
        status = exc.status_code if exc.status_code < 500 else 500
        if status >= 500:
            code = "internal"
            message = messages.SERVER
        return _error_response(request, status, code, message)

    @app.exception_handler(SQLAlchemyError)
    async def database_error_handler(
        request: Request, exc: SQLAlchemyError
    ) -> JSONResponse:
        status, code, message = classify_database_error(exc)
        return _error_response(request, status, code, message, exc=exc)

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        return _error_response(request, 500, "internal", messages.SERVER, exc=exc)
