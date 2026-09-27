from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from schemas.health import HealthResponse, ReadyResponse
from services.health import HealthService

router = APIRouter()


@router.get("/health/live", response_model=HealthResponse)
async def health_live() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/health", response_model=HealthResponse)
async def health(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> HealthResponse:
    return await HealthService(session).check()


@router.get(
    "/health/ready",
    response_model=ReadyResponse,
    responses={503: {"model": ReadyResponse}},
)
async def health_ready() -> JSONResponse:
    payload = await HealthService.ready()
    status_code = 503 if payload.status == "down" else 200
    return JSONResponse(status_code=status_code, content=payload.model_dump())
