from typing import Annotated

from fastapi import APIRouter, Depends

from core.deps import get_catalog_service
from schemas.catalog import MaterialOut, ProductOut, StoneBlockOut
from services.catalog import CatalogService

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get(
    "/stones",
    response_model=list[MaterialOut],
    response_model_exclude_none=True,
)
async def list_stones(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> list[MaterialOut]:
    return await service.list_stones()


@router.get(
    "/stones/{slug}",
    response_model=MaterialOut,
    response_model_exclude_none=True,
)
async def get_stone(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> MaterialOut:
    return await service.get_stone(slug)


@router.get(
    "/blocks",
    response_model=list[StoneBlockOut],
    response_model_exclude_none=True,
)
async def list_blocks(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> list[StoneBlockOut]:
    return await service.list_blocks()


@router.get(
    "/blocks/{slug}",
    response_model=StoneBlockOut,
    response_model_exclude_none=True,
)
async def get_block(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> StoneBlockOut:
    return await service.get_block(slug)


@router.get(
    "/products",
    response_model=list[ProductOut],
    response_model_exclude_none=True,
)
async def list_products(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    category: str | None = None,
    group: str | None = None,
) -> list[ProductOut]:
    return await service.list_products(category=category, group=group)


@router.get(
    "/products/{slug}",
    response_model=ProductOut,
    response_model_exclude_none=True,
)
async def get_product(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> ProductOut:
    return await service.get_product(slug)
