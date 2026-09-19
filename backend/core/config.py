from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = (
        "postgresql+asyncpg://stonetrail:stonetrail@localhost:5432/stonetrail"
    )
    cors_origins: str = "http://localhost:3000"
    cookie_secure: bool = False
    auth_debug_links: bool = False
    frontend_base_url: str = "http://localhost:3000"

    smtp_host: str = ""
    smtp_port: int = 1126
    smtp_security: Literal["starttls", "tls"] = "starttls"
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_from_name: str = "StoneTrail"

    register_max_attempts: int = 3
    register_window_seconds: int = 15 * 60
    login_max_attempts: int = 5
    login_window_seconds: int = 15 * 60
    forgot_max_attempts: int = 5
    forgot_window_seconds: int = 15 * 60
    resend_cooldown_seconds: int = 60
    verify_token_ttl_seconds: int = 24 * 60 * 60
    reset_token_ttl_seconds: int = 60 * 60
    session_ttl_seconds: int = 7 * 24 * 60 * 60

    @field_validator("smtp_security", mode="before")
    @classmethod
    def normalize_smtp_security(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            return normalized or "starttls"
        return value

    @property
    def smtp_enabled(self) -> bool:
        return bool(
            self.smtp_host.strip()
            and self.smtp_user.strip()
            and self.smtp_password
            and self.smtp_from.strip()
        )

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "+psycopg", 1)

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
