from __future__ import annotations

import pytest
from community_helpers import login, logout, register_verified, set_role
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from core.deps import get_object_storage
from models.enums import UserRole
from services.media_storage import MemoryStorage


@pytest.fixture(autouse=True)
async def _clean_media():
    async with SessionLocal() as session:
        await session.execute(
            text(
                "TRUNCATE TABLE forum_posts, stones, block_lots, "
                "products, media CASCADE"
            )
        )
        await session.commit()
    yield


@pytest.mark.asyncio
async def test_editor_confirms_upload_and_links_stone(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    app.dependency_overrides[get_object_storage] = lambda: storage
    account = await register_verified(
        client, email="media-editor@example.com", nickname="media-editor"
    )
    await set_role(str(account["email"]), UserRole.EDITOR)
    await login(client, str(account["email"]))

    stone = await client.post(
        "/api/catalog/stones",
        json={
            "name": "Базальт",
            "stoneTypeCode": "marble",
            "quarry": "Урал",
            "country": "Россия",
        },
    )
    assert stone.status_code == 200, stone.text

    presign = await client.post(
        "/api/media/presign",
        json={"contentType": "image/jpeg", "sizeBytes": 4},
    )
    assert presign.status_code == 200, presign.text
    key = presign.json()["storageKey"]
    storage.put(key, b"\xff\xd8\xff\x00", "image/jpeg")

    confirmed = await client.post(
        "/api/media",
        json={
            "storageKey": key,
            "alt": "Слэб базальта",
            "contentType": "image/jpeg",
            "sizeBytes": 4,
        },
    )
    assert confirmed.status_code == 200, confirmed.text
    media_id = confirmed.json()["id"]

    linked = await client.post(
        f"/api/media/{media_id}/links",
        json={"ownerType": "stone", "ownerSlug": stone.json()["id"], "isPrimary": True},
    )
    assert linked.status_code == 200, linked.text

    public = await client.get(f"/api/catalog/stones/{stone.json()['id']}")
    assert public.json()["image"].endswith(key)

    deleted = await client.delete(f"/api/media/{media_id}")
    assert deleted.status_code == 204
    assert storage.read(key) is None
    app.dependency_overrides.pop(get_object_storage, None)


JPEG = b"\xff\xd8\xff\x00"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16
MP4 = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 4
WEBM = b"\x1a\x45\xdf\xa3" + b"\x00" * 4
RUTUBE_ID = "a1b2c3d4e5f6789012345678abcdef01"


def _use(app, storage: MemoryStorage) -> None:
    app.dependency_overrides[get_object_storage] = lambda: storage


async def _category_id(client: AsyncClient) -> str:
    response = await client.get("/api/forum/categories")
    assert response.status_code == 200, response.text
    return response.json()[0]["id"]


async def _upload(
    client: AsyncClient,
    storage: MemoryStorage,
    *,
    purpose: str,
    content_type: str,
    body: bytes,
    declared_size: int | None = None,
) -> dict[str, object]:
    size = len(body) if declared_size is None else declared_size
    presign = await client.post(
        "/api/media/uploads",
        json={"purpose": purpose, "contentType": content_type, "sizeBytes": size},
    )
    assert presign.status_code == 200, presign.text
    payload = presign.json()
    storage.put(str(payload["storageKey"]), body, content_type)
    done = await client.post(f"/api/media/{payload['id']}/complete")
    assert done.status_code == 200, done.text
    return done.json()


@pytest.mark.asyncio
async def test_rejects_wrong_type_and_oversize(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    _use(app, storage)
    account = await register_verified(
        client, email="media-user@example.com", nickname="media-user"
    )
    await login(client, str(account["email"]))
    svg = await client.post(
        "/api/media/uploads",
        json={"purpose": "avatar", "contentType": "image/svg+xml", "sizeBytes": 10},
    )
    assert svg.status_code == 422
    huge = await client.post(
        "/api/media/uploads",
        json={"purpose": "avatar", "contentType": "image/jpeg", "sizeBytes": 2_000_000},
    )
    assert huge.status_code == 422
    catalog = await client.post(
        "/api/media/uploads",
        json={"purpose": "catalog", "contentType": "image/jpeg", "sizeBytes": 4},
    )
    assert catalog.status_code == 422
    app.dependency_overrides.pop(get_object_storage, None)


@pytest.mark.asyncio
async def test_spoofed_image_is_deleted(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    _use(app, storage)
    account = await register_verified(
        client, email="spoof@example.com", nickname="spoof-user"
    )
    await login(client, str(account["email"]))
    presign = await client.post(
        "/api/media/uploads",
        json={
            "purpose": "forum_image",
            "contentType": "image/jpeg",
            "sizeBytes": len(PNG),
        },
    )
    assert presign.status_code == 200, presign.text
    key = presign.json()["storageKey"]
    storage.put(key, PNG, "image/jpeg")
    done = await client.post(f"/api/media/{presign.json()['id']}/complete")
    assert done.status_code == 422
    assert key not in storage.objects
    app.dependency_overrides.pop(get_object_storage, None)


@pytest.mark.asyncio
async def test_other_user_cannot_complete(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    _use(app, storage)
    owner = await register_verified(
        client, email="owner-media@example.com", nickname="owner-media"
    )
    await login(client, str(owner["email"]))
    presign = await client.post(
        "/api/media/uploads",
        json={"purpose": "avatar", "contentType": "image/jpeg", "sizeBytes": len(JPEG)},
    )
    assert presign.status_code == 200, presign.text
    media_id = presign.json()["id"]
    storage.put(presign.json()["storageKey"], JPEG, "image/jpeg")
    await logout(client)
    other = await register_verified(
        client, email="other-media@example.com", nickname="other-media"
    )
    await login(client, str(other["email"]))
    done = await client.post(f"/api/media/{media_id}/complete")
    assert done.status_code == 403
    app.dependency_overrides.pop(get_object_storage, None)


@pytest.mark.asyncio
async def test_avatar_replaces_previous_object(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    _use(app, storage)
    account = await register_verified(
        client, email="avatar@example.com", nickname="avatar-user"
    )
    await login(client, str(account["email"]))
    first = await _upload(
        client,
        storage,
        purpose="avatar",
        content_type="image/jpeg",
        body=JPEG,
    )
    me = await client.get("/auth/me")
    assert me.json()["avatar"].endswith(str(first["publicUrl"].split("/")[-1]))
    second = await _upload(
        client,
        storage,
        purpose="avatar",
        content_type="image/png",
        body=PNG,
    )
    assert first["id"] != second["id"]
    avatar_keys = [key for key in storage.objects if key.startswith("avatars/")]
    assert avatar_keys
    assert all(key.endswith(".png") for key in avatar_keys)
    again = await client.get("/auth/me")
    assert again.json()["avatar"].endswith(".png")
    cleared = await client.delete("/api/media/avatar")
    assert cleared.status_code == 204
    empty = await client.get("/auth/me")
    assert empty.json()["avatar"] == ""
    app.dependency_overrides.pop(get_object_storage, None)


@pytest.mark.asyncio
async def test_forum_limits_and_rutube(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    _use(app, storage)
    account = await register_verified(
        client, email="forum-media@example.com", nickname="forum-media"
    )
    await login(client, str(account["email"]))
    images = []
    for _ in range(5):
        images.append(
            await _upload(
                client,
                storage,
                purpose="forum_image",
                content_type="image/jpeg",
                body=JPEG,
            )
        )
    video = await _upload(
        client,
        storage,
        purpose="forum_video",
        content_type="video/mp4",
        body=MP4,
    )
    assert storage.full_reads == 0
    category_id = await _category_id(client)
    too_many = await client.post(
        "/api/forum/posts",
        json={
            "title": "Слишком много фото",
            "categoryId": category_id,
            "content": "Пять снимков.",
            "attachmentIds": [item["id"] for item in images],
        },
    )
    assert too_many.status_code == 422
    two_videos_rutube = await client.post(
        "/api/media/external",
        json={"url": f"https://rutube.ru/video/{RUTUBE_ID}/"},
    )
    assert two_videos_rutube.status_code == 200, two_videos_rutube.text
    assert two_videos_rutube.json()["publicUrl"] == (
        f"https://rutube.ru/play/embed/{RUTUBE_ID}"
    )
    both = await client.post(
        "/api/forum/posts",
        json={
            "title": "Два видео",
            "categoryId": category_id,
            "content": "Файл и ссылка.",
            "attachmentIds": [video["id"], two_videos_rutube.json()["id"]],
        },
    )
    assert both.status_code == 422
    created = await client.post(
        "/api/forum/posts",
        json={
            "title": "Снимок и ролик",
            "categoryId": category_id,
            "content": "Один кадр и Rutube.",
            "attachmentIds": [images[0]["id"], two_videos_rutube.json()["id"]],
        },
    )
    assert created.status_code == 200, created.text
    kinds = {item["kind"] for item in created.json()["attachments"]}
    assert kinds == {"image", "external_video"}
    foreign = await client.post(
        "/api/media/external",
        json={"url": "https://evil.com/video/" + RUTUBE_ID},
    )
    assert foreign.status_code == 422
    lookalike = await client.post(
        "/api/media/external",
        json={"url": f"https://rutube.ru.evil.com/video/{RUTUBE_ID}"},
    )
    assert lookalike.status_code == 422
    userinfo = await client.post(
        "/api/media/external",
        json={"url": f"https://user:pass@rutube.ru/video/{RUTUBE_ID}"},
    )
    assert userinfo.status_code == 422
    app.dependency_overrides.pop(get_object_storage, None)


@pytest.mark.asyncio
async def test_expired_pending_is_removed(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    _use(app, storage)
    account = await register_verified(
        client, email="pending@example.com", nickname="pending-user"
    )
    await login(client, str(account["email"]))
    presign = await client.post(
        "/api/media/uploads",
        json={"purpose": "forum_image", "contentType": "image/jpeg", "sizeBytes": 4},
    )
    assert presign.status_code == 200, presign.text
    key = presign.json()["storageKey"]
    media_id = presign.json()["id"]
    storage.put(key, JPEG, "image/jpeg")
    async with SessionLocal() as session:
        await session.execute(
            text(
                "UPDATE media SET created_at = now() - interval '2 days' "
                "WHERE id = CAST(:id AS uuid)"
            ),
            {"id": media_id},
        )
        await session.commit()
    again = await client.post(
        "/api/media/uploads",
        json={
            "purpose": "forum_image",
            "contentType": "image/jpeg",
            "sizeBytes": len(JPEG),
        },
    )
    assert again.status_code == 200, again.text
    assert key not in storage.objects
    async with SessionLocal() as session:
        found = await session.scalar(
            text("SELECT count(*) FROM media WHERE id = CAST(:id AS uuid)"),
            {"id": media_id},
        )
    assert found == 0
    app.dependency_overrides.pop(get_object_storage, None)


@pytest.mark.asyncio
async def test_webm_upload_does_not_read_whole_file(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    _use(app, storage)
    account = await register_verified(
        client, email="webm@example.com", nickname="webm-user"
    )
    await login(client, str(account["email"]))
    saved = await _upload(
        client,
        storage,
        purpose="forum_video",
        content_type="video/webm",
        body=WEBM,
    )
    assert saved["kind"] == "video"
    assert storage.full_reads == 0
    app.dependency_overrides.pop(get_object_storage, None)
