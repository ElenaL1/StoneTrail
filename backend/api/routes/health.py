from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from schemas.health import HealthResponse
from services.health import HealthService

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> HealthResponse:
    return await HealthService(session).check()
