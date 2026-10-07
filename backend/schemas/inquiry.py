from __future__ import annotations

from pydantic import field_validator, model_validator

from core import messages
from schemas.user import CamelModel


class InquiryLineIn(CamelModel):
    id: str
    title: str
    summary: str = ""

    @field_validator("id", "title", "summary")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("id", "title")
    @classmethod
    def require_text(cls, value: str) -> str:
        if not value:
            raise ValueError(messages.INQUIRY_LINE_REQUIRED)
        if len(value) > 200:
            raise ValueError(messages.INQUIRY_LINE_LONG)
        return value

    @field_validator("summary")
    @classmethod
    def limit_summary(cls, value: str) -> str:
        if len(value) > 500:
            raise ValueError(messages.INQUIRY_LINE_LONG)
        return value


class InquiryCreate(CamelModel):
    name: str
    message: str = ""
    lines: list[InquiryLineIn] = []

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError(messages.INQUIRY_NAME_REQUIRED)
        if len(trimmed) > 120:
            raise ValueError(messages.INQUIRY_NAME_LONG)
        return trimmed

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) > 4000:
            raise ValueError(messages.INQUIRY_MESSAGE_LONG)
        return trimmed

    @model_validator(mode="after")
    def require_content(self) -> InquiryCreate:
        if not self.message and not self.lines:
            raise ValueError(messages.INQUIRY_EMPTY)
        if len(self.lines) > 30:
            raise ValueError(messages.INQUIRY_TOO_MANY)
        return self
