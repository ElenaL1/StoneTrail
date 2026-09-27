from typing import Literal

from pydantic import BaseModel

CheckStatus = Literal["ok", "error", "skipped"]
ReadyStatus = Literal["ok", "degraded", "down"]


class HealthResponse(BaseModel):
    status: str


class ReadyChecks(BaseModel):
    database: CheckStatus
    smtp: CheckStatus
    yandex: CheckStatus


class ReadyResponse(BaseModel):
    status: ReadyStatus
    checks: ReadyChecks
