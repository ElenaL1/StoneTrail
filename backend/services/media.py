from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.config import get_settings
from core.errors import ApiError, AuthError
from core.rate_limit import limiter
from models.catalog import BlockLot, Product, Stone
from models.enums import MediaKind, MediaOwner, MediaStatus
from models.media import Media, MediaLink
from models.user import User
from schemas.user import CamelModel
from services.media_storage import (
    IMAGE_TYPES,
    PROBE_BYTES,
    VIDEO_TYPES,
    ObjectStorage,
    detect_image,
    detect_video,
)
from services.rutube import embed_url, parse_rutube_id

logger = logging.getLogger(__name__)

EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
}
ACCEPTED_STORED_TYPES = {
    "application/octet-stream",
    "binary/octet-stream",
}
OWNER_MODELS = {
    MediaOwner.STONE: Stone,
    MediaOwner.BLOCK_LOT: BlockLot,
    MediaOwner.PRODUCT: Product,
}


class PresignIn(CamelModel):
    content_type: str
    size_bytes: int


class PresignOut(CamelModel):
    id: uuid.UUID
    storage_key: str
    upload_url: str
    public_url: str
    headers: dict[str, str]


class UploadInitIn(CamelModel):
    purpose: str
    content_type: str
    size_bytes: int


class MediaConfirmIn(CamelModel):
    storage_key: str
    alt: str
    content_type: str
    size_bytes: int


class ExternalVideoIn(CamelModel):
    url: str


class MediaOut(CamelModel):
    id: uuid.UUID
    public_url: str
    alt: str
    mime_type: str
    size_bytes: int
    kind: str = "image"


class MediaLinkIn(CamelModel):
    owner_type: MediaOwner
    owner_slug: str
    is_primary: bool = False
    sort_order: int = 0
    caption: str = ""


class MediaLinkOut(CamelModel):
    id: uuid.UUID
    media_id: uuid.UUID
    owner_type: MediaOwner
    owner_slug: str
    is_primary: bool
    public_url: str
    alt: str
    caption: str = ""


class AttachmentOut(CamelModel):
    id: uuid.UUID
    kind: str
    public_url: str
    mime_type: str
    size_bytes: int
    alt: str


class MediaService:
    def __init__(self, session: AsyncSession, storage: ObjectStorage) -> None:
        self._session = session
        self._storage = storage

    async def list_media(self) -> list[MediaOut]:
        result = await self._session.execute(
            select(Media)
            .where(
                Media.status == MediaStatus.READY,
                Media.kind == MediaKind.IMAGE,
            )
            .order_by(Media.created_at.desc())
        )
        return [self._out(row) for row in result.scalars().all()]

    async def presign(self, payload: PresignIn, actor: User) -> PresignOut:
        return await self.init_upload(
            actor,
            purpose="catalog",
            content_type=payload.content_type,
            size_bytes=payload.size_bytes,
        )

    async def init_upload(
        self,
        actor: User,
        *,
        purpose: str,
        content_type: str,
        size_bytes: int,
    ) -> PresignOut:
        self._hit_limit(actor)
        expired = await self._drop_expired(actor)
        normalized = content_type.strip().lower()
        kind, limit, size_message = _rules(purpose, normalized)
        if size_bytes <= 0 or size_bytes > limit:
            raise AuthError.validation(size_message, {"sizeBytes": size_message})
        key = f"{_prefix(purpose, actor)}/{uuid.uuid4()}.{EXTENSIONS[normalized]}"
        signed = self._storage.presign_put(key, normalized, size_bytes)
        media = Media(
            storage_key=key,
            public_url=self._storage.public_url(key),
            mime_type=normalized,
            size_bytes=size_bytes,
            alt="",
            kind=kind,
            status=MediaStatus.PENDING,
            uploaded_by=actor.id,
        )
        self._session.add(media)
        await self._session.commit()
        await self._session.refresh(media)
        self.delete_stored(expired)
        _log(actor.id, media, "init")
        return PresignOut(
            id=media.id,
            storage_key=key,
            upload_url=signed.upload_url,
            public_url=media.public_url,
            headers=signed.headers,
        )

    async def confirm(self, payload: MediaConfirmIn, actor: User) -> MediaOut:
        alt = payload.alt.strip()
        if not alt:
            raise AuthError.validation(
                messages.ALT_REQUIRED, {"alt": messages.ALT_REQUIRED}
            )
        media = await self._session.scalar(
            select(Media).where(Media.storage_key == payload.storage_key)
        )
        if media is None or media.uploaded_by != actor.id:
            raise AuthError.validation(
                messages.MEDIA_MISSING, {"storageKey": messages.MEDIA_MISSING}
            )
        if media.status == MediaStatus.READY:
            return self._out(media)
        return await self._finish(
            media,
            actor,
            alt=alt,
            declared_type=payload.content_type,
            declared_size=payload.size_bytes,
        )

    async def complete(self, media_id: uuid.UUID, actor: User) -> MediaOut:
        media = await self._owned(media_id, actor)
        if media.status == MediaStatus.READY:
            return self._out(media)
        return await self._finish(
            media,
            actor,
            alt=_default_alt(media.kind),
            declared_type=media.mime_type,
            declared_size=media.size_bytes,
        )

    async def add_external(self, actor: User, url: str) -> MediaOut:
        self._hit_limit(actor)
        video_id = parse_rutube_id(url)
        media = Media(
            storage_key=None,
            public_url=embed_url(video_id),
            mime_type="external/rutube",
            size_bytes=0,
            alt="Видео Rutube",
            kind=MediaKind.EXTERNAL_VIDEO,
            status=MediaStatus.READY,
            uploaded_by=actor.id,
            external_provider="rutube",
            external_id=video_id,
        )
        self._session.add(media)
        await self._session.commit()
        await self._session.refresh(media)
        _log(actor.id, media, "external")
        return self._out(media)

    async def clear_avatar(self, actor: User) -> None:
        keys = await self.remove_owner(MediaOwner.USER_AVATAR, actor.id)
        await self._session.commit()
        self.delete_stored(keys)

    async def link(self, media_id: uuid.UUID, payload: MediaLinkIn) -> MediaLinkOut:
        media = await self._session.get(Media, media_id)
        if media is None or media.status != MediaStatus.READY:
            raise ApiError.not_found()
        if payload.owner_type not in OWNER_MODELS:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"ownerType": messages.LOOKUP_INVALID}
            )
        owner = await self._owner(payload.owner_type, payload.owner_slug)
        if payload.is_primary:
            existing_primary = await self._session.scalars(
                select(MediaLink).where(
                    MediaLink.owner_type == payload.owner_type,
                    MediaLink.owner_id == owner.id,
                    MediaLink.is_primary.is_(True),
                )
            )
            for row in existing_primary:
                row.is_primary = False
            await self._session.flush()
        link = await self._session.scalar(
            select(MediaLink).where(
                MediaLink.media_id == media.id,
                MediaLink.owner_type == payload.owner_type,
                MediaLink.owner_id == owner.id,
            )
        )
        caption = payload.caption.strip()
        if link is None:
            link = MediaLink(
                media_id=media.id,
                owner_type=payload.owner_type,
                owner_id=owner.id,
                sort_order=payload.sort_order,
                is_primary=payload.is_primary,
                caption=caption,
            )
            self._session.add(link)
        else:
            link.sort_order = payload.sort_order
            link.is_primary = payload.is_primary
            link.caption = caption
        await self._session.commit()
        await self._session.refresh(link)
        return MediaLinkOut(
            id=link.id,
            media_id=media.id,
            owner_type=payload.owner_type,
            owner_slug=payload.owner_slug,
            is_primary=link.is_primary,
            public_url=self._display(media),
            alt=media.alt,
            caption=link.caption,
        )

    async def unlink(self, link_id: uuid.UUID) -> None:
        link = await self._session.get(MediaLink, link_id)
        if link is None:
            raise ApiError.not_found()
        media_id = link.media_id
        await self._session.delete(link)
        await self._session.flush()
        keys = await self._drop_if_orphan(media_id)
        await self._session.commit()
        self.delete_stored(keys)

    async def delete_media(self, media_id: uuid.UUID) -> None:
        media = await self._session.get(Media, media_id)
        if media is None:
            raise ApiError.not_found()
        key = media.storage_key
        links = await self._session.scalars(
            select(MediaLink).where(MediaLink.media_id == media.id)
        )
        for link in links:
            await self._session.delete(link)
        await self._session.delete(media)
        await self._session.commit()
        if key:
            self.delete_stored([key])
        _log(media.uploaded_by, media, "delete")

    async def sync_post_attachments(
        self, post_id: uuid.UUID, author: User, media_ids: list[uuid.UUID]
    ) -> list[str]:
        unique_ids = list(dict.fromkeys(media_ids))
        rows: list[Media] = []
        for media_id in unique_ids:
            media = await self._session.get(Media, media_id)
            if media is None:
                raise ApiError.not_found()
            rows.append(media)
        self._ensure_forum_media(rows, author)
        existing = list(
            await self._session.scalars(
                select(MediaLink).where(
                    MediaLink.owner_type == MediaOwner.FORUM_POST,
                    MediaLink.owner_id == post_id,
                )
            )
        )
        desired = {row.id for row in rows}
        removed: list[str] = []
        for link in existing:
            if link.media_id in desired:
                continue
            media_id = link.media_id
            await self._session.delete(link)
            await self._session.flush()
            removed.extend(await self._drop_if_orphan(media_id))
        for index, media in enumerate(rows):
            await self._ensure_free(media.id, post_id)
            link = await self._session.scalar(
                select(MediaLink).where(
                    MediaLink.media_id == media.id,
                    MediaLink.owner_type == MediaOwner.FORUM_POST,
                    MediaLink.owner_id == post_id,
                )
            )
            if link is None:
                self._session.add(
                    MediaLink(
                        media_id=media.id,
                        owner_type=MediaOwner.FORUM_POST,
                        owner_id=post_id,
                        sort_order=index,
                        is_primary=False,
                    )
                )
            else:
                link.sort_order = index
        return removed

    async def attachments_for(
        self, post_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, list[AttachmentOut]]:
        if not post_ids:
            return {}
        result = await self._session.execute(
            select(MediaLink, Media)
            .join(Media, Media.id == MediaLink.media_id)
            .where(
                MediaLink.owner_type == MediaOwner.FORUM_POST,
                MediaLink.owner_id.in_(post_ids),
                Media.status == MediaStatus.READY,
            )
            .order_by(MediaLink.sort_order.asc(), MediaLink.id.asc())
        )
        grouped: dict[uuid.UUID, list[AttachmentOut]] = {}
        for link, media in result.all():
            grouped.setdefault(link.owner_id, []).append(self._attachment(media))
        return grouped

    async def remove_owner(
        self, owner_type: MediaOwner, owner_id: uuid.UUID
    ) -> list[str]:
        links = list(
            await self._session.scalars(
                select(MediaLink).where(
                    MediaLink.owner_type == owner_type,
                    MediaLink.owner_id == owner_id,
                )
            )
        )
        keys: list[str] = []
        for link in links:
            media_id = link.media_id
            await self._session.delete(link)
            await self._session.flush()
            keys.extend(await self._drop_if_orphan(media_id))
        return keys

    def delete_stored(self, keys: list[str]) -> None:
        for key in keys:
            try:
                self._storage.delete(key)
            except Exception:
                logger.warning("media_object_delete_failed")

    async def _finish(
        self,
        media: Media,
        actor: User,
        *,
        alt: str,
        declared_type: str,
        declared_size: int,
    ) -> MediaOut:
        if media.status == MediaStatus.FAILED or media.storage_key is None:
            raise AuthError.validation(
                messages.MEDIA_MISSING, {"storageKey": messages.MEDIA_MISSING}
            )
        limit = _size_limit(media)
        head = self._storage.head(media.storage_key)
        if head is None:
            await self._fail(media, delete_object=False)
            raise AuthError.validation(
                messages.MEDIA_MISSING, {"storageKey": messages.MEDIA_MISSING}
            )
        probe = self._storage.read_range(media.storage_key, PROBE_BYTES) or b""
        if media.kind == MediaKind.VIDEO:
            detected = detect_video(probe)
        else:
            detected = detect_image(probe)
        type_message = (
            messages.MEDIA_VIDEO_TYPE_INVALID
            if media.kind == MediaKind.VIDEO
            else messages.MEDIA_TYPE_INVALID
        )
        size_message = _size_message(media)
        declared = declared_type.strip().lower()
        stored_type = ""
        if head is not None:
            stored_type = head.content_type.split(";")[0].strip().lower()
        size_ok = (
            head is not None
            and head.size_bytes == declared_size
            and head.size_bytes == media.size_bytes
            and 0 < head.size_bytes <= limit
        )
        type_ok = (
            detected is not None
            and detected == declared
            and detected == media.mime_type
            and (not stored_type or stored_type in {detected, *ACCEPTED_STORED_TYPES})
        )
        if not size_ok or not type_ok:
            await self._fail(media, delete_object=head is not None)
            if not size_ok:
                raise AuthError.validation(size_message, {"sizeBytes": size_message})
            raise AuthError.validation(type_message, {"contentType": type_message})
        assert head is not None
        assert detected is not None
        width, height = _dimensions(probe, detected)
        media.mime_type = detected
        media.size_bytes = head.size_bytes
        media.width_px = width
        media.height_px = height
        media.alt = alt
        media.status = MediaStatus.READY
        media.public_url = self._storage.public_url(media.storage_key)
        replaced: list[str] = []
        if media.storage_key.startswith("avatars/"):
            replaced = await self._swap_avatar(media, actor)
        await self._session.commit()
        self.delete_stored(replaced)
        _log(actor.id, media, "complete")
        return self._out(media)

    async def _fail(self, media: Media, *, delete_object: bool) -> None:
        key = media.storage_key if delete_object else None
        media.status = MediaStatus.FAILED
        await self._session.commit()
        if key:
            self.delete_stored([key])
        _log(media.uploaded_by, media, "fail")

    async def _swap_avatar(self, media: Media, actor: User) -> list[str]:
        links = list(
            await self._session.scalars(
                select(MediaLink).where(
                    MediaLink.owner_type == MediaOwner.USER_AVATAR,
                    MediaLink.owner_id == actor.id,
                )
            )
        )
        keys: list[str] = []
        for link in links:
            if link.media_id == media.id:
                continue
            old = await self._session.get(Media, link.media_id)
            await self._session.delete(link)
            if old is not None and old.id != media.id:
                if old.storage_key:
                    keys.append(old.storage_key)
                await self._session.delete(old)
        await self._session.flush()
        self._session.add(
            MediaLink(
                media_id=media.id,
                owner_type=MediaOwner.USER_AVATAR,
                owner_id=actor.id,
                is_primary=True,
            )
        )
        return keys

    async def _owned(self, media_id: uuid.UUID, actor: User) -> Media:
        media = await self._session.get(Media, media_id)
        if media is None:
            raise ApiError.not_found()
        if media.uploaded_by != actor.id:
            raise AuthError(403, "forbidden", messages.MEDIA_FORBIDDEN)
        return media

    def _ensure_forum_media(self, rows: list[Media], author: User) -> None:
        settings = get_settings()
        images = [row for row in rows if row.kind == MediaKind.IMAGE]
        videos = [
            row
            for row in rows
            if row.kind in {MediaKind.VIDEO, MediaKind.EXTERNAL_VIDEO}
        ]
        if len(images) > settings.max_forum_images:
            raise AuthError.validation(
                messages.MEDIA_LIMIT_IMAGES,
                {"attachmentIds": messages.MEDIA_LIMIT_IMAGES},
            )
        if len(videos) > settings.max_forum_videos:
            raise AuthError.validation(
                messages.MEDIA_LIMIT_VIDEO,
                {"attachmentIds": messages.MEDIA_LIMIT_VIDEO},
            )
        prefix = f"forum/{author.id}/"
        for row in rows:
            if row.uploaded_by != author.id:
                raise AuthError(403, "forbidden", messages.MEDIA_FORBIDDEN)
            if row.status != MediaStatus.READY:
                raise AuthError.validation(
                    messages.MEDIA_NOT_READY,
                    {"attachmentIds": messages.MEDIA_NOT_READY},
                )
            if row.kind == MediaKind.EXTERNAL_VIDEO:
                continue
            if not (row.storage_key or "").startswith(prefix):
                raise AuthError.validation(
                    messages.MEDIA_MISSING, {"attachmentIds": messages.MEDIA_MISSING}
                )

    async def _ensure_free(self, media_id: uuid.UUID, post_id: uuid.UUID) -> None:
        other = await self._session.scalar(
            select(MediaLink.id).where(
                MediaLink.media_id == media_id,
                MediaLink.owner_type == MediaOwner.FORUM_POST,
                MediaLink.owner_id != post_id,
            )
        )
        if other is not None:
            raise AuthError(403, "forbidden", messages.MEDIA_FORBIDDEN)

    async def _drop_expired(self, actor: User) -> list[str]:
        settings = get_settings()
        cutoff = datetime.now(UTC) - timedelta(
            seconds=settings.media_pending_ttl_seconds
        )
        rows = list(
            await self._session.scalars(
                select(Media).where(
                    Media.uploaded_by == actor.id,
                    Media.status == MediaStatus.PENDING,
                    Media.created_at < cutoff,
                )
            )
        )
        keys = [row.storage_key for row in rows if row.storage_key]
        for row in rows:
            await self._session.delete(row)
        if rows:
            await self._session.flush()
        return keys

    async def _drop_if_orphan(self, media_id: uuid.UUID) -> list[str]:
        count = await self._session.scalar(
            select(func.count())
            .select_from(MediaLink)
            .where(MediaLink.media_id == media_id)
        )
        if int(count or 0) > 0:
            return []
        media = await self._session.get(Media, media_id)
        if media is None:
            return []
        key = media.storage_key
        await self._session.delete(media)
        return [key] if key else []

    async def _owner(self, owner_type: MediaOwner, slug: str):
        model = OWNER_MODELS[owner_type]
        row = await self._session.scalar(
            select(model).where(model.slug == slug, model.deleted_at.is_(None))
        )
        if row is None:
            raise ApiError.not_found()
        return row

    def _out(self, row: Media) -> MediaOut:
        return MediaOut(
            id=row.id,
            public_url=self._display(row),
            alt=row.alt,
            mime_type=row.mime_type,
            size_bytes=row.size_bytes,
            kind=row.kind.value,
        )

    def _attachment(self, row: Media) -> AttachmentOut:
        return AttachmentOut(
            id=row.id,
            kind=row.kind.value,
            public_url=self._display(row),
            mime_type=row.mime_type,
            size_bytes=row.size_bytes,
            alt=row.alt,
        )

    def _display(self, row: Media) -> str:
        if row.kind == MediaKind.EXTERNAL_VIDEO and row.external_id:
            return embed_url(row.external_id)
        if row.storage_key:
            return self._storage.public_url(row.storage_key)
        return row.public_url

    def _hit_limit(self, actor: User) -> None:
        settings = get_settings()
        key = f"media-init:{actor.id}"
        retry = limiter.retry_after(
            key, settings.media_init_max_attempts, settings.media_init_window_seconds
        )
        if retry is not None:
            raise AuthError.rate_limited(retry)
        limiter.hit(
            key,
            settings.media_init_max_attempts,
            settings.media_init_window_seconds,
        )


async def avatar_url(session: AsyncSession, user_id: uuid.UUID) -> str:
    row = await session.scalar(
        select(Media)
        .join(MediaLink, MediaLink.media_id == Media.id)
        .where(
            MediaLink.owner_type == MediaOwner.USER_AVATAR,
            MediaLink.owner_id == user_id,
            Media.status == MediaStatus.READY,
        )
        .order_by(MediaLink.is_primary.desc(), Media.created_at.desc())
        .limit(1)
    )
    if row is None:
        return ""
    base = get_settings().s3_public_base_url.strip().rstrip("/")
    if row.storage_key and base:
        return f"{base}/{row.storage_key}"
    return row.public_url


def _rules(purpose: str, content_type: str) -> tuple[MediaKind, int, str]:
    settings = get_settings()
    if purpose in {"catalog", "forum_image"}:
        if content_type not in IMAGE_TYPES:
            raise AuthError.validation(
                messages.MEDIA_TYPE_INVALID,
                {"contentType": messages.MEDIA_TYPE_INVALID},
            )
        return MediaKind.IMAGE, settings.max_image_size_bytes, messages.MEDIA_TOO_LARGE
    if purpose == "avatar":
        if content_type not in IMAGE_TYPES:
            raise AuthError.validation(
                messages.MEDIA_TYPE_INVALID,
                {"contentType": messages.MEDIA_TYPE_INVALID},
            )
        return (
            MediaKind.IMAGE,
            settings.max_avatar_size_bytes,
            messages.MEDIA_AVATAR_TOO_LARGE,
        )
    if purpose == "forum_video":
        if content_type not in VIDEO_TYPES:
            raise AuthError.validation(
                messages.MEDIA_VIDEO_TYPE_INVALID,
                {"contentType": messages.MEDIA_VIDEO_TYPE_INVALID},
            )
        return (
            MediaKind.VIDEO,
            settings.max_video_size_bytes,
            messages.MEDIA_VIDEO_TOO_LARGE,
        )
    raise AuthError.validation(
        messages.LOOKUP_INVALID, {"purpose": messages.LOOKUP_INVALID}
    )


def _prefix(purpose: str, actor: User) -> str:
    if purpose == "catalog":
        return "catalog"
    if purpose == "avatar":
        return f"avatars/{actor.id}"
    return f"forum/{actor.id}"


def _size_limit(media: Media) -> int:
    settings = get_settings()
    if (media.storage_key or "").startswith("avatars/"):
        return settings.max_avatar_size_bytes
    if media.kind == MediaKind.VIDEO:
        return settings.max_video_size_bytes
    return settings.max_image_size_bytes


def _size_message(media: Media) -> str:
    if (media.storage_key or "").startswith("avatars/"):
        return messages.MEDIA_AVATAR_TOO_LARGE
    if media.kind == MediaKind.VIDEO:
        return messages.MEDIA_VIDEO_TOO_LARGE
    return messages.MEDIA_TOO_LARGE


def _default_alt(kind: MediaKind) -> str:
    if kind == MediaKind.VIDEO:
        return "Видео"
    if kind == MediaKind.EXTERNAL_VIDEO:
        return "Видео Rutube"
    return "Изображение"


def _dimensions(data: bytes, mime: str) -> tuple[int | None, int | None]:
    if mime == "image/png" and len(data) >= 24:
        width = int.from_bytes(data[16:20], "big")
        height = int.from_bytes(data[20:24], "big")
        return width or None, height or None
    return None, None


def _log(user_id: uuid.UUID | None, media: Media, action: str) -> None:
    logger.info(
        "media_action user_id=%s media_id=%s kind=%s action=%s status=%s",
        user_id,
        media.id,
        media.kind.value,
        action,
        media.status.value,
    )
