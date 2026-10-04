from typing import Annotated

from fastapi import APIRouter, Depends

from core.deps import get_page_service
from services.pages import PageContentService, PublicPageOut

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("/content", response_model=PublicPageOut)
async def public_page(
    page_key: str,
    service: Annotated[PageContentService, Depends(get_page_service)],
) -> PublicPageOut:
    return await service.public_page(page_key)
