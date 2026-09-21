from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from core import messages


class ErrorBody(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    message: str
    code: str
    field_errors: dict[str, str] | None = None
    retry_after_seconds: int | None = None


class ApiError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        field_errors: dict[str, str] | None = None,
        retry_after_seconds: int | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.field_errors = field_errors
        self.retry_after_seconds = retry_after_seconds
        super().__init__(message)

    def to_body(self) -> ErrorBody:
        return ErrorBody(
            message=self.message,
            code=self.code,
            field_errors=self.field_errors,
            retry_after_seconds=self.retry_after_seconds,
        )

    @classmethod
    def not_found(cls) -> ApiError:
        return cls(404, "not_found", messages.NOT_FOUND)


class AuthError(ApiError):
    @classmethod
    def validation(
        cls, message: str, field_errors: dict[str, str] | None = None
    ) -> AuthError:
        return cls(422, "validation", message, field_errors)

    @classmethod
    def email_taken(cls) -> AuthError:
        return cls(
            409,
            "email_taken",
            messages.EMAIL_TAKEN,
            {"email": messages.EMAIL_TAKEN},
        )

    @classmethod
    def nickname_taken(cls) -> AuthError:
        return cls(
            409,
            "nickname_taken",
            messages.NICKNAME_TAKEN,
            {"nickname": messages.NICKNAME_TAKEN},
        )

    @classmethod
    def invalid_credentials(cls) -> AuthError:
        return cls(401, "invalid_credentials", messages.LOGIN_FAILED)

    @classmethod
    def rate_limited(cls, retry_after_seconds: int) -> AuthError:
        return cls(
            429,
            "rate_limited",
            messages.RATE_LIMITED,
            retry_after_seconds=retry_after_seconds,
        )

    @classmethod
    def unverified(cls) -> AuthError:
        return cls(403, "unverified", messages.EMAIL_UNVERIFIED)

    @classmethod
    def forbidden(cls) -> AuthError:
        return cls(403, "forbidden", messages.FORBIDDEN)

    @classmethod
    def token(cls, code: str, *, verify: bool) -> AuthError:
        if code == "token_used":
            message = messages.VERIFY_USED if verify else messages.RESET_USED
        else:
            message = messages.VERIFY_EXPIRED if verify else messages.RESET_EXPIRED
        return cls(400, code, message)
