from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field
from pydantic.alias_generators import to_camel

from models.enums import ActivityType, UserRole

ACTIVITY_LABELS: dict[ActivityType, str] = {
    ActivityType.ARCHITECT: "Архитектор",
    ActivityType.DESIGNER: "Дизайнер",
    ActivityType.STONE_PROCESSOR: "Камнеобработчик",
    ActivityType.SUPPLIER: "Поставщик",
    ActivityType.MANUFACTURER: "Производитель",
    ActivityType.CONSTRUCTION_COMPANY: "Строительная компания",
    ActivityType.INSTALLATION_COMPANY: "Монтажная компания",
    ActivityType.RESTORER: "Реставратор",
    ActivityType.OTHER: "Другое",
}

LABEL_TO_ACTIVITY: dict[str, ActivityType] = {
    label: value for value, label in ACTIVITY_LABELS.items()
}


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="ignore",
        from_attributes=True,
    )


class PublicUser(CamelModel):
    id: uuid.UUID
    email: str
    nickname: str
    first_name: str
    last_name: str
    company: str
    position: str
    activity_type: str = ""
    avatar: str = ""
    country: str
    city: str
    bio: str
    website: str
    phone: str
    email_verified: bool
    yandex_linked: bool = False
    can_publish_articles: bool = False
    role: UserRole
    marketing_consent: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None

    @computed_field
    @property
    def name(self) -> str:
        return self.nickname


def activity_to_label(value: ActivityType | None) -> str:
    if value is None:
        return ""
    return ACTIVITY_LABELS.get(value, "")


def parse_activity(value: str) -> ActivityType | None:
    from core import messages

    trimmed = value.strip()
    if not trimmed:
        return None
    if trimmed in LABEL_TO_ACTIVITY:
        return LABEL_TO_ACTIVITY[trimmed]
    try:
        return ActivityType(trimmed)
    except ValueError as exc:
        raise ValueError(messages.ACTIVITY_INVALID) from exc
