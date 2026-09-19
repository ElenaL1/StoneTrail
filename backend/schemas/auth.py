from __future__ import annotations

from pydantic import Field, ValidationInfo, field_validator

from core import messages
from core.security import (
    email_error,
    normalize_email,
    normalize_website,
    password_error,
    person_name_error,
)
from schemas.user import CamelModel, PublicUser, parse_activity


class RegisterRequest(CamelModel):
    nickname: str
    first_name: str = ""
    last_name: str = ""
    email: str
    password: str
    company: str = ""
    position: str = ""
    activity_type: str = ""
    terms_accepted: bool
    marketing_consent: bool = False

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, value: str) -> str:
        error = person_name_error(value, "nickname")
        if error:
            raise ValueError(error)
        return value.strip()

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, value: str) -> str:
        error = person_name_error(value, "firstName", required=False)
        if error:
            raise ValueError(error)
        return value.strip()

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, value: str) -> str:
        error = person_name_error(value, "lastName", required=False)
        if error:
            raise ValueError(error)
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        error = email_error(value)
        if error:
            raise ValueError(error)
        return normalize_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        error = password_error(value)
        if error:
            raise ValueError(error)
        return value

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError(messages.TERMS_REQUIRED)
        return value

    @field_validator("activity_type")
    @classmethod
    def validate_activity(cls, value: str) -> str:
        parse_activity(value)
        return value.strip()


class LoginRequest(CamelModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        error = email_error(value)
        if error:
            raise ValueError(error)
        return normalize_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value:
            raise ValueError(messages.PASSWORD_REQUIRED)
        return value


class ProfileUpdateRequest(CamelModel):
    nickname: str
    first_name: str = ""
    last_name: str = ""
    company: str = ""
    position: str = ""
    activity_type: str = ""
    country: str = ""
    city: str = ""
    bio: str = ""
    website: str = ""
    phone: str = ""
    marketing_consent: bool = False

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, value: str) -> str:
        error = person_name_error(value, "nickname")
        if error:
            raise ValueError(error)
        return value.strip()

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, value: str) -> str:
        error = person_name_error(value, "firstName", required=False)
        if error:
            raise ValueError(error)
        return value.strip()

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, value: str) -> str:
        error = person_name_error(value, "lastName", required=False)
        if error:
            raise ValueError(error)
        return value.strip()

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str) -> str:
        try:
            return normalize_website(value)
        except ValueError as exc:
            raise ValueError(messages.WEBSITE_INVALID) from exc

    @field_validator("activity_type")
    @classmethod
    def validate_activity(cls, value: str) -> str:
        parse_activity(value)
        return value.strip()

    @field_validator("city", "company", "position", "phone", "bio", "country")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class TokenRequest(CamelModel):
    token: str = Field(min_length=1)


class ChangeEmailRequest(CamelModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        error = email_error(value)
        if error:
            raise ValueError(error)
        return normalize_email(value)


class ForgotPasswordRequest(CamelModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        error = email_error(value)
        if error:
            raise ValueError(error)
        return normalize_email(value)


class ResetPasswordRequest(CamelModel):
    token: str = Field(min_length=1)
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        error = password_error(value)
        if error:
            raise ValueError(error)
        return value

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info: ValidationInfo) -> str:
        password = info.data.get("password")
        if password is not None and value != password:
            raise ValueError(messages.PASSWORD_MISMATCH)
        return value


class RegisterResponse(PublicUser):
    demo_verification_path: str | None = None


class ResendResponse(CamelModel):
    resend_available_at: int
    demo_verification_path: str | None = None


class ForgotPasswordResponse(CamelModel):
    submitted: bool = True
    demo_reset_path: str | None = None


class ResetPasswordResponse(CamelModel):
    completed: bool = True


class LogoutResponse(CamelModel):
    ok: bool = True
