from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response

from core import messages
from core.deps import get_editor_user, get_media_service, get_verified_user
from core.errors import AuthError
from models.user import User
from services.media import (
    ExternalVideoIn,
    MediaConfirmIn,
    MediaLinkIn,
    MediaLinkOut,
    MediaOut,
    MediaService,
    PresignIn,
    PresignOut,
    UploadInitIn,
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
    editor: Annotated[User, Depends(get_editor_user)],
) -> PresignOut:
    return await service.presign(payload, editor)


@router.post("/uploads", response_model=PresignOut)
async def init_upload(
    payload: UploadInitIn,
    service: Annotated[MediaService, Depends(get_media_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> PresignOut:
    if payload.purpose not in {"avatar", "forum_image", "forum_video"}:
        raise AuthError.validation(
            messages.LOOKUP_INVALID, {"purpose": messages.LOOKUP_INVALID}
        )
    return await service.init_upload(
        user,
        purpose=payload.purpose,
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
    )


@router.post("/external", response_model=MediaOut)
async def add_external_video(
    payload: ExternalVideoIn,
    service: Annotated[MediaService, Depends(get_media_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> MediaOut:
    return await service.add_external(user, payload.url)


@router.delete("/avatar", status_code=204)
async def clear_avatar(
    service: Annotated[MediaService, Depends(get_media_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> Response:
    await service.clear_avatar(user)
    return Response(status_code=204)


@router.post("", response_model=MediaOut)
async def confirm_media(
    payload: MediaConfirmIn,
    service: Annotated[MediaService, Depends(get_media_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> MediaOut:
    return await service.confirm(payload, editor)


@router.post("/{media_id}/complete", response_model=MediaOut)
async def complete_upload(
    media_id: UUID,
    service: Annotated[MediaService, Depends(get_media_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> MediaOut:
    return await service.complete(media_id, user)


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
