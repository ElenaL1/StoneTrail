from __future__ import annotations

from dataclasses import dataclass

from core import messages
from core.config import Settings
from core.errors import ApiError

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
VIDEO_TYPES = {"video/mp4", "video/webm"}
ALLOWED_TYPES = IMAGE_TYPES
PROBE_BYTES = 32


@dataclass(frozen=True)
class PresignResult:
    upload_url: str
    headers: dict[str, str]


@dataclass(frozen=True)
class ObjectHead:
    size_bytes: int
    content_type: str


class ObjectStorage:
    def presign_put(
        self, key: str, content_type: str, size_bytes: int
    ) -> PresignResult:
        raise NotImplementedError

    def head(self, key: str) -> ObjectHead | None:
        raise NotImplementedError

    def read_range(self, key: str, amount: int = PROBE_BYTES) -> bytes | None:
        raise NotImplementedError

    def read(self, key: str) -> tuple[bytes, str] | None:
        raise NotImplementedError

    def delete(self, key: str) -> None:
        raise NotImplementedError

    def put(self, key: str, data: bytes, content_type: str) -> None:
        raise NotImplementedError

    def public_url(self, key: str) -> str:
        raise NotImplementedError


class UnconfiguredStorage(ObjectStorage):
    def presign_put(
        self, key: str, content_type: str, size_bytes: int
    ) -> PresignResult:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def head(self, key: str) -> ObjectHead | None:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def read_range(self, key: str, amount: int = PROBE_BYTES) -> bytes | None:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def read(self, key: str) -> tuple[bytes, str] | None:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def delete(self, key: str) -> None:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def put(self, key: str, data: bytes, content_type: str) -> None:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)

    def public_url(self, key: str) -> str:
        raise ApiError.unavailable(messages.MEDIA_UNAVAILABLE)


class MemoryStorage(ObjectStorage):
    def __init__(self) -> None:
        self.objects: dict[str, tuple[bytes, str]] = {}
        self.public_base = "https://media.test"
        self.full_reads = 0

    def presign_put(
        self, key: str, content_type: str, size_bytes: int
    ) -> PresignResult:
        return PresignResult(
            upload_url=f"memory://{key}",
            headers={"Content-Type": content_type, "Content-Length": str(size_bytes)},
        )

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self.objects[key] = (data, content_type)

    def head(self, key: str) -> ObjectHead | None:
        item = self.objects.get(key)
        if item is None:
            return None
        data, content_type = item
        return ObjectHead(size_bytes=len(data), content_type=content_type)

    def read_range(self, key: str, amount: int = PROBE_BYTES) -> bytes | None:
        item = self.objects.get(key)
        if item is None:
            return None
        return item[0][:amount]

    def read(self, key: str) -> tuple[bytes, str] | None:
        self.full_reads += 1
        return self.objects.get(key)

    def delete(self, key: str) -> None:
        self.objects.pop(key, None)

    def public_url(self, key: str) -> str:
        return f"{self.public_base}/{key}"


class S3Storage(ObjectStorage):
    def __init__(self, settings: Settings) -> None:
        import boto3
        from botocore.client import Config

        if not settings.s3_region_ready:
            raise ApiError.unavailable(messages.S3_REGION_INVALID)
        self._bucket = settings.s3_bucket
        self._public_base = settings.s3_public_base_url.rstrip("/")
        self._expires = max(settings.s3_upload_expires_seconds, 60)
        # Selectel virtual-hosted: https://<bucket>.s3.<pool>.storage.selcloud.ru
        kwargs: dict[str, object] = {
            "service_name": "s3",
            "region_name": settings.s3_region.strip(),
            "aws_access_key_id": settings.s3_access_key,
            "aws_secret_access_key": settings.s3_secret_key,
            "config": Config(
                signature_version="s3v4",
                request_checksum_calculation="when_required",
                response_checksum_validation="when_required",
                s3={"addressing_style": "virtual"},
            ),
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
            ExpiresIn=self._expires,
        )
        return PresignResult(
            upload_url=url,
            headers={"Content-Type": content_type, "Content-Length": str(size_bytes)},
        )

    def head(self, key: str) -> ObjectHead | None:
        from botocore.exceptions import ClientError

        try:
            response = self._client.head_object(Bucket=self._bucket, Key=key)
        except ClientError as exc:
            if _missing(exc):
                return None
            raise
        return ObjectHead(
            size_bytes=int(response["ContentLength"]),
            content_type=str(response.get("ContentType") or ""),
        )

    def read_range(self, key: str, amount: int = PROBE_BYTES) -> bytes | None:
        from botocore.exceptions import ClientError

        try:
            response = self._client.get_object(
                Bucket=self._bucket,
                Key=key,
                Range=f"bytes=0-{max(amount, 1) - 1}",
            )
        except ClientError as exc:
            if _missing(exc):
                return None
            raise
        return response["Body"].read()

    def read(self, key: str) -> tuple[bytes, str] | None:
        from botocore.exceptions import ClientError

        try:
            response = self._client.get_object(Bucket=self._bucket, Key=key)
        except ClientError as exc:
            if _missing(exc):
                return None
            raise
        body = response["Body"].read()
        content_type = str(response.get("ContentType") or "")
        return body, content_type

    def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def public_url(self, key: str) -> str:
        return f"{self._public_base}/{key}"


def _missing(exc: Exception) -> bool:
    response = getattr(exc, "response", None)
    if not isinstance(response, dict):
        return False
    code = str(response.get("Error", {}).get("Code", ""))
    status = int(response.get("ResponseMetadata", {}).get("HTTPStatusCode", 0))
    return code in {"404", "NoSuchKey", "NotFound"} or status == 404


def detect_image(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def detect_video(data: bytes) -> str | None:
    if len(data) >= 12 and data[4:8] == b"ftyp":
        if data[8:12] == b"qt  ":
            return None
        return "video/mp4"
    if data.startswith(b"\x1a\x45\xdf\xa3"):
        return "video/webm"
    return None
