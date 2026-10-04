from typing import Annotated

from fastapi import APIRouter, Depends, Response

from core.deps import get_catalog_service, get_editor_user
from models.user import User
from schemas.catalog import MaterialOut, ProductOut, StoneBlockOut
from schemas.catalog_admin import (
    BlockLotEditOut,
    BlockLotWrite,
    CatalogLookupsOut,
    ProductEditOut,
    ProductWrite,
    StoneEditOut,
    StoneWrite,
)
from services.catalog import CatalogService

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


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


@router.get("/lookups", response_model=CatalogLookupsOut)
async def catalog_lookups(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> CatalogLookupsOut:
    return await service.lookups()


@router.get("/stones/{slug}/edit", response_model=StoneEditOut)
async def stone_edit(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> StoneEditOut:
    return await service.stone_edit(slug)


@router.post("/stones", response_model=MaterialOut, response_model_exclude_none=True)
async def create_stone(
    payload: StoneWrite,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> MaterialOut:
    return await service.create_stone(payload, editor)


@router.patch(
    "/stones/{slug}", response_model=MaterialOut, response_model_exclude_none=True
)
async def update_stone(
    slug: str,
    payload: StoneWrite,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> MaterialOut:
    return await service.update_stone(slug, payload, editor)


@router.delete("/stones/{slug}", status_code=204)
async def delete_stone(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> Response:
    await service.delete_stone(slug, editor)
    return Response(status_code=204)


@router.post(
    "/stones/{slug}/restore",
    response_model=MaterialOut,
    response_model_exclude_none=True,
)
async def restore_stone(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> MaterialOut:
    return await service.restore_stone(slug, editor)


@router.get("/blocks/{slug}/edit", response_model=BlockLotEditOut)
async def block_edit(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> BlockLotEditOut:
    return await service.block_edit(slug)


@router.post("/blocks", response_model=StoneBlockOut, response_model_exclude_none=True)
async def create_block(
    payload: BlockLotWrite,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> StoneBlockOut:
    return await service.create_block(payload, editor)


@router.patch(
    "/blocks/{slug}", response_model=StoneBlockOut, response_model_exclude_none=True
)
async def update_block(
    slug: str,
    payload: BlockLotWrite,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> StoneBlockOut:
    return await service.update_block(slug, payload, editor)


@router.delete("/blocks/{slug}", status_code=204)
async def delete_block(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> Response:
    await service.delete_block(slug, editor)
    return Response(status_code=204)


@router.post(
    "/blocks/{slug}/restore",
    response_model=StoneBlockOut,
    response_model_exclude_none=True,
)
async def restore_block(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> StoneBlockOut:
    return await service.restore_block(slug, editor)


@router.get("/products/{slug}/edit", response_model=ProductEditOut)
async def product_edit(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> ProductEditOut:
    return await service.product_edit(slug)


@router.post("/products", response_model=ProductOut, response_model_exclude_none=True)
async def create_product(
    payload: ProductWrite,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> ProductOut:
    return await service.create_product(payload, editor)


@router.patch(
    "/products/{slug}", response_model=ProductOut, response_model_exclude_none=True
)
async def update_product(
    slug: str,
    payload: ProductWrite,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> ProductOut:
    return await service.update_product(slug, payload, editor)


@router.delete("/products/{slug}", status_code=204)
async def delete_product(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> Response:
    await service.delete_product(slug, editor)
    return Response(status_code=204)


@router.post(
    "/products/{slug}/restore",
    response_model=ProductOut,
    response_model_exclude_none=True,
)
async def restore_product(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> ProductOut:
    return await service.restore_product(slug, editor)
