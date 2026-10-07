from __future__ import annotations

import re

from core import messages
from core.config import get_settings
from core.errors import ApiError, AuthError
from core.rate_limit import limiter
from models.user import User
from schemas.inquiry import InquiryCreate
from services.mail import send_inquiry_email

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _recipients_ready(recipients: list[str]) -> bool:
    return bool(recipients) and all(_EMAIL.fullmatch(item) for item in recipients)


async def submit_inquiry(user: User, payload: InquiryCreate) -> None:
    settings = get_settings()
    rate_key = f"inquiry:{user.id}"
    retry = limiter.retry_after(
        rate_key, settings.inquiry_max_attempts, settings.inquiry_window_seconds
    )
    if retry is not None:
        raise AuthError.rate_limited(retry)
    limiter.hit(
        rate_key, settings.inquiry_max_attempts, settings.inquiry_window_seconds
    )

    recipients = settings.inquiry_recipients
    if not settings.smtp_enabled or not _recipients_ready(recipients):
        raise ApiError.unavailable(messages.UNAVAILABLE)

    sent = await send_inquiry_email(
        name=payload.name,
        reply_to=user.email,
        message_text=payload.message,
        lines=[(line.title, line.summary) for line in payload.lines],
        recipients=recipients,
    )
    if not sent:
        raise ApiError.unavailable(messages.UNAVAILABLE)
