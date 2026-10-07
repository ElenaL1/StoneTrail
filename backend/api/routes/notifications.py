import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response

from core.deps import get_current_user, get_notification_service
from models.user import User
from schemas.notifications import NotificationOut
from services.notifications import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    service: Annotated[NotificationService, Depends(get_notification_service)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[NotificationOut]:
    return await service.list_for_user(user)


@router.post("/read", status_code=204)
async def mark_all_read(
    service: Annotated[NotificationService, Depends(get_notification_service)],
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    await service.mark_all_read(user)
    return Response(status_code=204)


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(
    notification_id: uuid.UUID,
    service: Annotated[NotificationService, Depends(get_notification_service)],
    user: Annotated[User, Depends(get_current_user)],
) -> NotificationOut:
    return await service.mark_read(notification_id, user)
