from __future__ import annotations

import logging
from email.message import EmailMessage
from email.utils import formataddr
from typing import Literal

import aiosmtplib

from core.config import Settings, get_settings

logger = logging.getLogger(__name__)

AuthEmailKind = Literal["verify", "reset"]

_SUBJECTS: dict[AuthEmailKind, str] = {
    "verify": "Подтвердите email — StoneTrail",
    "reset": "Восстановление пароля — StoneTrail",
}

_TEXT: dict[AuthEmailKind, str] = {
    "verify": (
        "Чтобы подтвердить адрес, откройте ссылку:\n{url}\n\n"
        "Ссылка действует 24 часа. Если вы не регистрировались на StoneTrail, "
        "проигнорируйте это письмо."
    ),
    "reset": (
        "Чтобы задать новый пароль, откройте ссылку:\n{url}\n\n"
        "Ссылка действует 1 час. Если вы не запрашивали восстановление, "
        "проигнорируйте это письмо."
    ),
}

_HTML: dict[AuthEmailKind, str] = {
    "verify": (
        "<p>Чтобы подтвердить адрес, перейдите по ссылке:</p>"
        '<p><a href="{url}">{url}</a></p>'
        "<p>Ссылка действует 24 часа. Если вы не регистрировались на StoneTrail, "
        "проигнорируйте это письмо.</p>"
    ),
    "reset": (
        "<p>Чтобы задать новый пароль, перейдите по ссылке:</p>"
        '<p><a href="{url}">{url}</a></p>'
        "<p>Ссылка действует 1 час. Если вы не запрашивали восстановление, "
        "проигнорируйте это письмо.</p>"
    ),
}


def _absolute_url(settings: Settings, path: str) -> str:
    return f"{settings.frontend_base_url.rstrip('/')}{path}"


def _message(
    kind: AuthEmailKind, to: str, url: str, settings: Settings
) -> EmailMessage:
    message = EmailMessage()
    message["From"] = formataddr((settings.smtp_from_name, settings.smtp_from))
    message["To"] = to
    message["Subject"] = _SUBJECTS[kind]
    message.set_content(_TEXT[kind].replace("{url}", url))
    message.add_alternative(_HTML[kind].replace("{url}", url), subtype="html")
    return message


async def send_auth_email(kind: AuthEmailKind, to: str, path: str) -> bool:
    settings = get_settings()
    if not settings.smtp_enabled:
        return False

    url = _absolute_url(settings, path)
    start_tls = settings.smtp_security == "starttls"
    use_tls = settings.smtp_security == "tls"
    try:
        await aiosmtplib.send(
            _message(kind, to, url, settings),
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=start_tls,
            use_tls=use_tls,
            timeout=15,
        )
    except Exception:
        domain = to.rsplit("@", 1)[-1] if "@" in to else "unknown"
        logger.exception("Failed to send %s email to domain %s", kind, domain)
        return False
    return True
