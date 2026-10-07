from __future__ import annotations

import uuid
from datetime import datetime

from models.enums import NotificationType
from schemas.user import CamelModel


class NotificationOut(CamelModel):
    id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime
    entity_type: str | None
    entity_id: uuid.UUID | None
