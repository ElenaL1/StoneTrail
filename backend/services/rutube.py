from __future__ import annotations

import re
from urllib.parse import urlsplit

from core import messages
from core.errors import AuthError

_HOSTS = {"rutube.ru", "www.rutube.ru"}
_VIDEO_ID = re.compile(r"^[0-9a-fA-F]{32}$")


def parse_rutube_id(value: str) -> str:
    parsed = urlsplit(value.strip())
    host = (parsed.hostname or "").lower()
    if parsed.scheme not in {"http", "https"} or host not in _HOSTS:
        raise _invalid()
    if parsed.username or parsed.password:
        raise _invalid()
    parts = [part for part in parsed.path.split("/") if part]
    video_id = _video_id(parts)
    if video_id is None or _VIDEO_ID.fullmatch(video_id) is None:
        raise _invalid()
    return video_id


def embed_url(video_id: str) -> str:
    return f"https://rutube.ru/play/embed/{video_id}"


def _video_id(parts: list[str]) -> str | None:
    if len(parts) == 2 and parts[0] == "video":
        return parts[1]
    if len(parts) == 3 and parts[0] == "video" and parts[1] == "private":
        return parts[2]
    if len(parts) == 3 and parts[0] == "play" and parts[1] == "embed":
        return parts[2]
    if len(parts) == 2 and parts[0] == "shorts":
        return parts[1]
    return None


def _invalid() -> AuthError:
    return AuthError.validation(
        messages.RUTUBE_URL_INVALID, {"url": messages.RUTUBE_URL_INVALID}
    )
