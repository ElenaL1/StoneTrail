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
    inquiry_to: str = ""
    inquiry_max_attempts: int = 5
    inquiry_window_seconds: int = 15 * 60

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
    oauth_state_ttl_seconds: int = 10 * 60
    yandex_client_id: str = ""
    yandex_client_secret: str = ""
    yandex_redirect_uri: str = ""
    log_level: Literal["debug", "info", "warning", "error"] = "info"
    s3_endpoint: str = ""
    s3_region: str = "us-east-1"
    s3_bucket: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_public_base_url: str = ""
    s3_upload_expires_seconds: int = 300
    max_image_size_bytes: int = 10 * 1024 * 1024
    max_avatar_size_bytes: int = 1 * 1024 * 1024
    max_video_size_bytes: int = 100 * 1024 * 1024
    max_forum_images: int = 4
    max_forum_videos: int = 1
    media_pending_ttl_seconds: int = 24 * 60 * 60
    media_init_max_attempts: int = 30
    media_init_window_seconds: int = 15 * 60

    @field_validator("log_level", mode="before")
    @classmethod
    def normalize_log_level(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"debug", "info", "warning", "error", "warn"}:
                return "warning" if normalized == "warn" else normalized
        return "info"

    @field_validator("smtp_security", mode="before")
    @classmethod
    def normalize_smtp_security(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            return normalized or "starttls"
        return value

    @property
    def yandex_enabled(self) -> bool:
        return bool(
            self.yandex_client_id.strip()
            and self.yandex_client_secret
            and self.yandex_redirect_uri.strip()
        )

    @property
    def s3_enabled(self) -> bool:
        return bool(
            self.s3_bucket.strip()
            and self.s3_access_key.strip()
            and self.s3_secret_key
            and self.s3_public_base_url.strip()
        )

    @property
    def s3_region_ready(self) -> bool:
        region = self.s3_region.strip()
        endpoint = self.s3_endpoint.strip().lower()
        if "selcloud.ru" in endpoint:
            return bool(region) and region != "us-east-1"
        return bool(region)

    @property
    def smtp_enabled(self) -> bool:
        return bool(
            self.smtp_host.strip()
            and self.smtp_user.strip()
            and self.smtp_password
            and self.smtp_from.strip()
        )

    @property
    def inquiry_recipients(self) -> list[str]:
        return [item.strip() for item in self.inquiry_to.split(",") if item.strip()]

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "+psycopg", 1)

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
