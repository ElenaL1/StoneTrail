from __future__ import annotations

import pytest
from community_helpers import login, logout, register_user, register_verified, set_role
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from models.enums import UserRole


@pytest.fixture(autouse=True)
async def _clean_forum():
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE forum_posts CASCADE"))
        await session.commit()
    yield
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE forum_posts CASCADE"))
        await session.commit()


async def first_category_id(client: AsyncClient) -> str:
    response = await client.get("/api/forum/categories")
    assert response.status_code == 200
    rows = response.json()
    assert rows
    return rows[0]["id"]


@pytest.mark.asyncio
async def test_guest_cannot_create_topic(client: AsyncClient) -> None:
    category_id = await first_category_id(client)
    response = await client.post(
        "/api/forum/posts",
        json={
            "title": "Как пилить гранит",
            "categoryId": category_id,
            "content": "Подскажите диск.",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_unverified_cannot_create_topic(client: AsyncClient) -> None:
    await register_user(client)
    category_id = await first_category_id(client)
    response = await client.post(
        "/api/forum/posts",
        json={
            "title": "Как пилить гранит",
            "categoryId": category_id,
            "content": "Подскажите диск.",
        },
    )
    assert response.status_code == 403
    assert response.json()["code"] == "unverified"


@pytest.mark.asyncio
async def test_verified_user_creates_and_comments(client: AsyncClient) -> None:
    await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post(
        "/api/forum/posts",
        json={
            "title": "Как пилить гранит",
            "categoryId": category_id,
            "content": "Подскажите диск для мокрой резки.",
        },
    )
    assert created.status_code == 200, created.text
    post = created.json()
    assert post["slug"] == "kak-pilit-granit"
    assert post["commentCount"] == 0

    listed = await client.get("/api/forum/posts")
    assert listed.status_code == 200
    assert listed.json()[0]["slug"] == post["slug"]

    comment = await client.post(
        f"/api/forum/posts/{post['slug']}/comments",
        json={"body": "Берите диск с сегментами."},
    )
    assert comment.status_code == 200, comment.text
    detail = await client.get(f"/api/forum/posts/{post['slug']}")
    assert detail.json()["commentCount"] == 1
    assert detail.json()["comments"][0]["body"] == "Берите диск с сегментами."


@pytest.mark.asyncio
async def test_guest_can_read_but_not_comment(client: AsyncClient) -> None:
    account = await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post(
        "/api/forum/posts",
        json={
            "title": "Вопрос по полировке",
            "categoryId": category_id,
            "content": "Чем полировать мрамор?",
        },
    )
    slug = created.json()["slug"]
    await logout(client)

    public = await client.get(f"/api/forum/posts/{slug}")
    assert public.status_code == 200
    denied = await client.post(
        f"/api/forum/posts/{slug}/comments", json={"body": "Пробую без входа"}
    )
    assert denied.status_code == 401

    await login(client, str(account["email"]))
    still = await client.post(
        f"/api/forum/posts/{slug}/comments", json={"body": "Теперь с аккаунтом"}
    )
    assert still.status_code == 200


@pytest.mark.asyncio
async def test_author_can_edit_topic_stranger_cannot(client: AsyncClient) -> None:
    await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post(
        "/api/forum/posts",
        json={
            "title": "Как пилить гранит",
            "categoryId": category_id,
            "content": "Исходный текст.",
        },
    )
    slug = created.json()["slug"]
    updated = await client.patch(
        f"/api/forum/posts/{slug}",
        json={"content": "Исправленный текст темы."},
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["slug"] == slug
    assert body["content"] == "Исправленный текст темы."
    assert body["authorId"] == created.json()["authorId"]
    assert created.json()["editedAt"] is None
    assert body["editedAt"] is not None
    await logout(client)

    guest = await client.patch(
        f"/api/forum/posts/{slug}", json={"content": "Чужая правка"}
    )
    assert guest.status_code == 401

    await register_verified(client)
    stranger = await client.patch(
        f"/api/forum/posts/{slug}", json={"content": "Чужая правка"}
    )
    assert stranger.status_code == 403


@pytest.mark.asyncio
async def test_topic_views_likes_and_reply_tree(client: AsyncClient) -> None:
    await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post(
        "/api/forum/posts",
        json={
            "title": "Просмотры и ответы",
            "categoryId": category_id,
            "content": "Текст темы.",
        },
    )
    slug = created.json()["slug"]

    first = await client.get(f"/api/forum/posts/{slug}")
    assert first.json()["viewCount"] == 1
    assert first.json()["editedAt"] is None
    second = await client.get(f"/api/forum/posts/{slug}")
    assert second.json()["viewCount"] == 2

    liked = await client.post(f"/api/forum/posts/{slug}/like")
    assert liked.status_code == 200, liked.text
    assert liked.json() == {"liked": True, "likesCount": 1}
    unliked = await client.post(f"/api/forum/posts/{slug}/like")
    assert unliked.json() == {"liked": False, "likesCount": 0}

    root = await client.post(
        f"/api/forum/posts/{slug}/comments", json={"body": "Первый ответ"}
    )
    assert root.status_code == 200, root.text
    root_id = root.json()["id"]
    reply = await client.post(
        f"/api/forum/posts/{slug}/comments",
        json={"body": "Ответ на ответ", "parentId": root_id},
    )
    assert reply.status_code == 200, reply.text
    assert reply.json()["parentId"] == root_id

    comment_like = await client.post(
        f"/api/forum/posts/{slug}/comments/{root_id}/like"
    )
    assert comment_like.status_code == 200, comment_like.text
    assert comment_like.json()["liked"] is True
    assert comment_like.json()["likesCount"] == 1
    removed = await client.post(f"/api/forum/posts/{slug}/comments/{root_id}/like")
    assert removed.json()["liked"] is False

    detail = await client.get(f"/api/forum/posts/{slug}")
    by_id = {item["id"]: item for item in detail.json()["comments"]}
    assert by_id[reply.json()["id"]]["parentId"] == root_id


@pytest.mark.asyncio
async def test_author_can_edit_own_comment(client: AsyncClient) -> None:
    await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post(
        "/api/forum/posts",
        json={
            "title": "Правка ответа",
            "categoryId": category_id,
            "content": "Текст темы.",
        },
    )
    slug = created.json()["slug"]
    comment = await client.post(
        f"/api/forum/posts/{slug}/comments", json={"body": "Черновик ответа"}
    )
    comment_id = comment.json()["id"]
    updated = await client.patch(
        f"/api/forum/posts/{slug}/comments/{comment_id}",
        json={"body": "Исправленный ответ"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["body"] == "Исправленный ответ"
    assert comment.json()["editedAt"] is None
    assert updated.json()["editedAt"] is not None
    assert updated.json()["parentId"] is None
    await logout(client)

    await register_verified(client)
    stranger = await client.patch(
        f"/api/forum/posts/{slug}/comments/{comment_id}",
        json={"body": "Чужая правка"},
    )
    assert stranger.status_code == 403


async def _topic(client: AsyncClient, title: str) -> str:
    category_id = await first_category_id(client)
    created = await client.post(
        "/api/forum/posts",
        json={"title": title, "categoryId": category_id, "content": "Текст темы."},
    )
    assert created.status_code == 200, created.text
    return created.json()["slug"]


@pytest.mark.asyncio
async def test_author_hides_leaf_and_empty_topic(client: AsyncClient) -> None:
    await register_verified(client)
    slug = await _topic(client, "Пустая тема")
    hidden = await client.delete(f"/api/forum/posts/{slug}")
    assert hidden.status_code == 204
    assert (await client.get(f"/api/forum/posts/{slug}")).status_code == 404
    assert (await client.get("/api/forum/posts")).json() == []

    slug = await _topic(client, "Тема с ответом")
    comment = await client.post(f"/api/forum/posts/{slug}/comments", json={"body": "Лист"})
    comment_id = comment.json()["id"]
    blocked = await client.delete(f"/api/forum/posts/{slug}")
    assert blocked.status_code == 403
    assert (await client.delete(f"/api/forum/posts/{slug}/comments/{comment_id}")).status_code == 204
    detail = await client.get(f"/api/forum/posts/{slug}")
    assert detail.json()["comments"] == []


@pytest.mark.asyncio
async def test_author_cannot_hide_comment_with_reply(client: AsyncClient) -> None:
    await register_verified(client)
    slug = await _topic(client, "Ветка")
    root = await client.post(f"/api/forum/posts/{slug}/comments", json={"body": "Корень"})
    root_id = root.json()["id"]
    await client.post(
        f"/api/forum/posts/{slug}/comments",
        json={"body": "Ответ", "parentId": root_id},
    )
    denied = await client.delete(f"/api/forum/posts/{slug}/comments/{root_id}")
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_staff_hides_restores_and_destroys(client: AsyncClient) -> None:
    author = await register_verified(client, nickname="author-one", email="author-one@example.com")
    slug = await _topic(client, "Модерация")
    root = await client.post(f"/api/forum/posts/{slug}/comments", json={"body": "Секрет"})
    root_id = root.json()["id"]
    child = await client.post(
        f"/api/forum/posts/{slug}/comments",
        json={"body": "Ветка жива", "parentId": root_id},
    )
    child_id = child.json()["id"]
    await logout(client)

    moderator = await register_verified(client, nickname="mod-one", email="mod-one@example.com")
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    await login(client, str(moderator["email"]))

    hidden = await client.delete(f"/api/forum/posts/{slug}/comments/{root_id}")
    assert hidden.status_code == 204
    detail = await client.get(f"/api/forum/posts/{slug}")
    hidden_root = next(item for item in detail.json()["comments"] if item["id"] == root_id)
    assert hidden_root["deleted"] is True
    assert hidden_root["body"] == "Секрет"
    assert hidden_root["deletedBy"] == moderator["nickname"]

    await logout(client)
    await login(client, str(author["email"]))
    public = await client.get(f"/api/forum/posts/{slug}")
    plaque = next(item for item in public.json()["comments"] if item["id"] == root_id)
    assert plaque["deleted"] is True
    assert plaque["body"] == ""
    assert plaque["deletedBy"] is None
    reply = await client.post(
        f"/api/forum/posts/{slug}/comments",
        json={"body": "На плиту", "parentId": root_id},
    )
    assert reply.status_code == 400

    await logout(client)
    await login(client, str(moderator["email"]))
    restored = await client.post(f"/api/forum/posts/{slug}/comments/{root_id}/restore")
    assert restored.status_code == 200
    assert any(item["body"] == "Секрет" for item in restored.json()["comments"])

    await client.delete(f"/api/forum/posts/{slug}/comments/{root_id}")
    destroyed = await client.delete(f"/api/forum/posts/{slug}/comments/{root_id}/permanent")
    assert destroyed.status_code == 204
    after = await client.get(f"/api/forum/posts/{slug}")
    by_id = {item["id"]: item for item in after.json()["comments"]}
    assert root_id not in by_id
    assert by_id[child_id]["parentId"] is None

    await client.delete(f"/api/forum/posts/{slug}")
    staff_view = await client.get(f"/api/forum/posts/{slug}")
    assert staff_view.status_code == 200
    assert staff_view.json()["deleted"] is True
    assert staff_view.json()["content"] == "Текст темы."
    await logout(client)
    await login(client, str(author["email"]))
    assert (await client.get(f"/api/forum/posts/{slug}")).status_code == 404

    await logout(client)
    await login(client, str(moderator["email"]))
    assert (await client.delete(f"/api/forum/posts/{slug}/permanent")).status_code == 204
    assert (await client.get(f"/api/forum/posts/{slug}")).status_code == 404
