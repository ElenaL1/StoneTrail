from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from core.deps import (
    get_admin_user,
    get_admin_user_service,
    get_editor_user,
    get_page_service,
)
from models.user import User
from services.admin_users import AdminUserOut, AdminUserService, RoleUpdate
from services.audit import AuditEventOut, list_audit
from services.pages import (
    PageAdminOut,
    PageContentService,
    PageDraftIn,
    PagePublishIn,
    PageSummaryOut,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    service: Annotated[AdminUserService, Depends(get_admin_user_service)],
    _admin: Annotated[User, Depends(get_admin_user)],
) -> list[AdminUserOut]:
    return await service.list_users()


@router.patch("/users/{user_id}/role", response_model=AdminUserOut)
async def set_role(
    user_id: UUID,
    payload: RoleUpdate,
    service: Annotated[AdminUserService, Depends(get_admin_user_service)],
    admin: Annotated[User, Depends(get_admin_user)],
) -> AdminUserOut:
    return await service.set_role(user_id, payload, admin)


@router.get("/pages", response_model=list[PageSummaryOut])
async def list_pages(
    service: Annotated[PageContentService, Depends(get_page_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> list[PageSummaryOut]:
    return service.list_pages()


@router.get("/pages/content", response_model=PageAdminOut)
async def get_page(
    page_key: str,
    service: Annotated[PageContentService, Depends(get_page_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
) -> PageAdminOut:
    return await service.admin_page(page_key)


@router.put("/pages/content", response_model=PageAdminOut)
async def save_page(
    page_key: str,
    payload: PageDraftIn,
    service: Annotated[PageContentService, Depends(get_page_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> PageAdminOut:
    return await service.save_draft(page_key, payload, editor)


@router.post("/pages/content/publish", response_model=PageAdminOut)
async def publish_page(
    page_key: str,
    payload: PagePublishIn,
    service: Annotated[PageContentService, Depends(get_page_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> PageAdminOut:
    return await service.publish(page_key, payload, editor)


@router.get("/audit", response_model=list[AuditEventOut])
async def audit_log(
    session: Annotated[AsyncSession, Depends(get_session)],
    _admin: Annotated[User, Depends(get_admin_user)],
) -> list[AuditEventOut]:
    return await list_audit(session)
