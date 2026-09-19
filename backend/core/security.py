from __future__ import annotations

import hashlib
import re
import secrets
from urllib.parse import urlparse

from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

from core import messages

_HASHER = PasswordHash.recommended()
_DUMMY_HASH: str | None = None

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_LETTER_RE = re.compile(r"[A-Za-zА-Яа-яЁё]")
_DIGIT_RE = re.compile(r"\d")
_HAS_SCHEME_RE = re.compile(r"^https?://", re.IGNORECASE)

PASSWORD_MIN_LENGTH = 8
NAME_MIN_LENGTH = 2


def hash_password(password: str) -> str:
    return _HASHER.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _HASHER.verify(password, hashed)
    except (UnknownHashError, ValueError):
        return False


def dummy_password_hash() -> str:
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = hash_password("invalid-dummy-password")
    return _DUMMY_HASH


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def email_error(email: str, *, required: bool = True) -> str | None:
    normalized = normalize_email(email)
    if not normalized:
        return messages.EMAIL_REQUIRED if required else None
    if not _EMAIL_RE.match(normalized):
        return messages.EMAIL_INVALID
    return None


def password_error(password: str) -> str | None:
    if not password:
        return messages.PASSWORD_REQUIRED
    if len(password) < PASSWORD_MIN_LENGTH:
        return messages.PASSWORD_MIN
    if not _LETTER_RE.search(password):
        return messages.PASSWORD_LETTER
    if not _DIGIT_RE.search(password):
        return messages.PASSWORD_DIGIT
    return None


def person_name_error(value: str, field: str, *, required: bool = True) -> str | None:
    trimmed = value.strip()
    if field == "nickname":
        if not trimmed:
            return messages.NICKNAME_REQUIRED
        if len(trimmed) < NAME_MIN_LENGTH:
            return messages.NICKNAME_MIN
        return None
    if field == "firstName":
        if not trimmed:
            return messages.FIRST_NAME_REQUIRED if required else None
        if len(trimmed) < NAME_MIN_LENGTH:
            return messages.FIRST_NAME_MIN
        return None
    if not trimmed:
        return messages.LAST_NAME_REQUIRED if required else None
    if len(trimmed) < NAME_MIN_LENGTH:
        return messages.LAST_NAME_MIN
    return None


def normalize_website(website: str) -> str:
    value = website.strip()
    if not value:
        return ""
    if not _HAS_SCHEME_RE.match(value):
        value = f"https://{value}"
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(messages.WEBSITE_INVALID)
    return value
