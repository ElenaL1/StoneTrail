from __future__ import annotations

from dataclasses import dataclass

from core import messages
from core.config import Settings
from core.errors import ApiError

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@dataclass(frozen=True)
class PresignResult:
    upload_url: str
    headers: dict[str, str]


class ObjectStorage:
    def presign_put(
        self, key: str, content_type: str, size_bytes: int
    ) -> PresignResult:
        raise NotImplementedError

    def read(self, key: str) -> tuple[bytes, str] | None:
        raise NotImplementedError

    def delete(self, key: str) -> None:
        raise NotImplementedError

    def public_url(self, key: str) -> str:
        raise NotImplementedError


class UnconfiguredStorage(ObjectStorage):
    def presign_put(
        self, key: str, content_type: str, size_bytes: int
    ) -> PresignResult:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def read(self, key: str) -> tuple[bytes, str] | None:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def delete(self, key: str) -> None:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def public_url(self, key: str) -> str:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)


class MemoryStorage(ObjectStorage):
    def __init__(self) -> None:
        self.objects: dict[str, tuple[bytes, str]] = {}
        self.public_base = "https://media.test"

    def presign_put(
        self, key: str, content_type: str, size_bytes: int
    ) -> PresignResult:
        return PresignResult(
            upload_url=f"memory://{key}",
            headers={"Content-Type": content_type, "Content-Length": str(size_bytes)},
        )

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self.objects[key] = (data, content_type)

    def read(self, key: str) -> tuple[bytes, str] | None:
        return self.objects.get(key)

    def delete(self, key: str) -> None:
        self.objects.pop(key, None)

    def public_url(self, key: str) -> str:
        return f"{self.public_base}/{key}"


class S3Storage(ObjectStorage):
    def __init__(self, settings: Settings) -> None:
        import boto3
        from botocore.client import Config

        self._bucket = settings.s3_bucket
        self._public_base = settings.s3_public_base_url.rstrip("/")
        kwargs: dict[str, object] = {
            "service_name": "s3",
            "region_name": settings.s3_region or "us-east-1",
            "aws_access_key_id": settings.s3_access_key,
            "aws_secret_access_key": settings.s3_secret_key,
            "config": Config(signature_version="s3v4"),
        }
        if settings.s3_endpoint.strip():
            kwargs["endpoint_url"] = settings.s3_endpoint.strip()
        self._client = boto3.client(**kwargs)

    def presign_put(
        self, key: str, content_type: str, size_bytes: int
    ) -> PresignResult:
        url = self._client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self._bucket,
                "Key": key,
                "ContentType": content_type,
                "ContentLength": size_bytes,
            },
            ExpiresIn=300,
        )
        return PresignResult(
            upload_url=url,
            headers={"Content-Type": content_type, "Content-Length": str(size_bytes)},
        )

    def read(self, key: str) -> tuple[bytes, str] | None:
        try:
            response = self._client.get_object(Bucket=self._bucket, Key=key)
        except self._client.exceptions.NoSuchKey:
            return None
        except Exception:
            return None
        body = response["Body"].read()
        content_type = str(response.get("ContentType") or "")
        return body, content_type

    def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)

    def public_url(self, key: str) -> str:
        return f"{self._public_base}/{key}"


def detect_image(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None
