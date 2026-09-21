from __future__ import annotations

import re
import unicodedata

_TRANSLIT = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "i",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
}

_NON_SLUG = re.compile(r"[^a-z0-9]+")
_MULTI_DASH = re.compile(r"-{2,}")


def slugify(value: str, *, fallback: str = "post") -> str:
    folded = unicodedata.normalize("NFKC", value).lower().strip()
    chars: list[str] = []
    for char in folded:
        if char in _TRANSLIT:
            chars.append(_TRANSLIT[char])
        elif char.isascii() and char.isalnum():
            chars.append(char)
        else:
            chars.append("-")
    slug = _MULTI_DASH.sub("-", _NON_SLUG.sub("-", "".join(chars))).strip("-")
    return slug or fallback
