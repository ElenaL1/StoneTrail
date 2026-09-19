from sqlalchemy.ext.asyncio import AsyncSession

from repositories.health import HealthRepository
from schemas.health import HealthResponse


class HealthService:
    def __init__(self, session: AsyncSession) -> None:
        self._repository = HealthRepository(session)

    async def check(self) -> HealthResponse:
        await self._repository.ping()
        return HealthResponse(status="ok")
