from __future__ import annotations

import logging
from email.message import EmailMessage
from email.utils import formataddr
from html import escape
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


def _inquiry_parts(
    name: str, reply_to: str, message_text: str, lines: list[tuple[str, str]]
) -> tuple[str, str]:
    text = [f"Имя: {name}", f"Email: {reply_to}", ""]
    html = [
        f"<p><strong>Имя:</strong> {escape(name)}</p>",
        f"<p><strong>Email:</strong> {escape(reply_to)}</p>",
    ]
    if lines:
        text.append("Позиции:")
        items: list[str] = []
        for title, summary in lines:
            text.append(f"- {title}")
            if summary:
                text.append(f"  {summary}")
            detail = escape(title)
            if summary:
                detail = f"{detail}<br>{escape(summary)}"
            items.append(f"<li>{detail}</li>")
        text.append("")
        html.append(f"<p><strong>Позиции:</strong></p><ul>{''.join(items)}</ul>")
    if message_text:
        text.extend(["Сообщение:", message_text])
        html.append(
            "<p><strong>Сообщение:</strong></p>"
            f"<p>{escape(message_text).replace(chr(10), '<br>')}</p>"
        )
    return "\n".join(text), "".join(html)


def _inquiry_message(
    *,
    name: str,
    reply_to: str,
    message_text: str,
    lines: list[tuple[str, str]],
    recipients: list[str],
    settings: Settings,
) -> EmailMessage:
    text, html = _inquiry_parts(name, reply_to, message_text, lines)
    message = EmailMessage()
    message["From"] = formataddr((settings.smtp_from_name, settings.smtp_from))
    message["To"] = ", ".join(recipients)
    message["Reply-To"] = reply_to
    message["Subject"] = "Заявка с сайта — StoneTrail"
    message.set_content(text)
    message.add_alternative(html, subtype="html")
    return message


async def send_inquiry_email(
    *,
    name: str,
    reply_to: str,
    message_text: str,
    lines: list[tuple[str, str]],
    recipients: list[str],
) -> bool:
    settings = get_settings()
    if not settings.smtp_enabled or not recipients:
        return False
    start_tls = settings.smtp_security == "starttls"
    use_tls = settings.smtp_security == "tls"
    try:
        await aiosmtplib.send(
            _inquiry_message(
                name=name,
                reply_to=reply_to,
                message_text=message_text,
                lines=lines,
                recipients=recipients,
                settings=settings,
            ),
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=start_tls,
            use_tls=use_tls,
            timeout=15,
        )
    except Exception:
        logger.exception(
            "Failed to send inquiry email to %s recipients", len(recipients)
        )
        return False
    return True
