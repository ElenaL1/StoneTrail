from typing import Annotated

from fastapi import APIRouter, Depends, Response

from core.deps import (
    get_admin_user,
    get_editor_user,
    get_optional_user,
    get_promotion_service,
    get_verified_user,
)
from models.user import User
from schemas.feed import (
    ActivePromotionOut,
    LikeOut,
    PromotionOut,
    PromotionUpdate,
    PromotionWrite,
)
from services.promotions import PromotionService

router = APIRouter(prefix="/api/promotions", tags=["promotions"])


@router.get("", response_model=list[PromotionOut])
async def list_promotions(
    service: Annotated[PromotionService, Depends(get_promotion_service)],
    viewer: Annotated[User | None, Depends(get_optional_user)],
) -> list[PromotionOut]:
    return await service.list_public(viewer)


@router.get("/active", response_model=list[ActivePromotionOut])
async def list_active(
    service: Annotated[PromotionService, Depends(get_promotion_service)],
) -> list[ActivePromotionOut]:
    return await service.list_active()


@router.get("/manage", response_model=list[PromotionOut])
async def list_managed(
    service: Annotated[PromotionService, Depends(get_promotion_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
    deleted: bool = False,
) -> list[PromotionOut]:
    return await service.list_managed(deleted=deleted)


@router.post("", response_model=PromotionOut)
async def create_promotion(
    payload: PromotionWrite,
    service: Annotated[PromotionService, Depends(get_promotion_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> PromotionOut:
    return await service.create(payload, editor)


@router.get("/{slug}", response_model=PromotionOut)
async def get_promotion(
    slug: str,
    service: Annotated[PromotionService, Depends(get_promotion_service)],
    viewer: Annotated[User | None, Depends(get_optional_user)],
) -> PromotionOut:
    return await service.get(slug, viewer)


@router.patch("/{slug}", response_model=PromotionOut)
async def update_promotion(
    slug: str,
    payload: PromotionUpdate,
    service: Annotated[PromotionService, Depends(get_promotion_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> PromotionOut:
    return await service.update(slug, payload, editor)


@router.delete("/{slug}", status_code=204)
async def delete_promotion(
    slug: str,
    service: Annotated[PromotionService, Depends(get_promotion_service)],
    admin: Annotated[User, Depends(get_admin_user)],
) -> Response:
    await service.hide(slug, admin)
    return Response(status_code=204)


@router.post("/{slug}/restore", response_model=PromotionOut)
async def restore_promotion(
    slug: str,
    service: Annotated[PromotionService, Depends(get_promotion_service)],
    admin: Annotated[User, Depends(get_admin_user)],
) -> PromotionOut:
    return await service.restore(slug, admin)


@router.post("/{slug}/likes", response_model=LikeOut)
async def toggle_like(
    slug: str,
    service: Annotated[PromotionService, Depends(get_promotion_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> LikeOut:
    return await service.toggle_like(slug, user)
