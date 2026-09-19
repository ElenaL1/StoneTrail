from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic.alias_generators import to_camel

from core import messages
from core.errors import ApiError, ErrorBody


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


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
        headers = {}
        if exc.retry_after_seconds is not None:
            headers["Retry-After"] = str(exc.retry_after_seconds)
        body = exc.to_body().model_dump(by_alias=True)
        return JSONResponse(status_code=exc.status_code, content=body, headers=headers)

    @app.exception_handler(RequestValidationError)
    async def request_validation_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        field_errors: dict[str, str] = {}
        for err in exc.errors():
            field_errors[_field_name(err)] = _validation_message(err)
        message = next(iter(field_errors.values()), messages.SERVER)
        body = ErrorBody(
            message=message,
            code="validation",
            field_errors=field_errors or None,
        )
        return JSONResponse(status_code=422, content=body.model_dump(by_alias=True))
