from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response

from core.deps import get_editor_user, get_media_service
from models.user import User
from services.media import (
    MediaConfirmIn,
    MediaLinkIn,
    MediaLinkOut,
    MediaOut,
    MediaService,
    PresignIn,
    PresignOut,
)

router = APIRouter(prefix="/api/media", tags=["media"])


@router.get("", response_model=list[MediaOut])
async def list_media(
    service: Annotated[MediaService, Depends(get_media_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> list[MediaOut]:
    return await service.list_media()


@router.post("/presign", response_model=PresignOut)
async def presign_media(
    payload: PresignIn,
    service: Annotated[MediaService, Depends(get_media_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> PresignOut:
    return service.presign(payload)


@router.post("", response_model=MediaOut)
async def confirm_media(
    payload: MediaConfirmIn,
    service: Annotated[MediaService, Depends(get_media_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> MediaOut:
    return await service.confirm(payload, editor)


@router.post("/{media_id}/links", response_model=MediaLinkOut)
async def link_media(
    media_id: UUID,
    payload: MediaLinkIn,
    service: Annotated[MediaService, Depends(get_media_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> MediaLinkOut:
    return await service.link(media_id, payload)


@router.delete("/links/{link_id}", status_code=204)
async def unlink_media(
    link_id: UUID,
    service: Annotated[MediaService, Depends(get_media_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> Response:
    await service.unlink(link_id)
    return Response(status_code=204)


@router.delete("/{media_id}", status_code=204)
async def delete_media(
    media_id: UUID,
    service: Annotated[MediaService, Depends(get_media_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> Response:
    await service.delete_media(media_id)
    return Response(status_code=204)
