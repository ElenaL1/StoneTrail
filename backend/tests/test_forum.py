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


@pytest.mark.asyncio
async def test_author_restores_own_topic_stranger_and_staff(
    client: AsyncClient,
) -> None:
    author = await register_verified(
        client, nickname="author-two", email="author-two@example.com"
    )
    slug = await _topic(client, "Скрытие темы")
    hidden = await client.delete(f"/api/forum/posts/{slug}")
    assert hidden.status_code == 204
    await logout(client)

    await register_verified(
        client, nickname="stranger-two", email="stranger-two@example.com"
    )
    denied = await client.post(f"/api/forum/posts/{slug}/restore")
    assert denied.status_code == 403
    assert denied.json()["code"] == "forbidden"
    await logout(client)

    await login(client, str(author["email"]))
    restored = await client.post(f"/api/forum/posts/{slug}/restore")
    assert restored.status_code == 200, restored.text
    assert restored.json()["deleted"] is False
    assert restored.json()["content"] == "Текст темы."
    again = await client.post(f"/api/forum/posts/{slug}/restore")
    assert again.status_code == 404
    missing = await client.post("/api/forum/posts/missing-topic/restore")
    assert missing.status_code == 404
    await logout(client)

    moderator = await register_verified(
        client, nickname="mod-two", email="mod-two@example.com"
    )
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    await login(client, str(moderator["email"]))
    await client.delete(f"/api/forum/posts/{slug}")
    await logout(client)

    await login(client, str(author["email"]))
    staff_hide = await client.post(f"/api/forum/posts/{slug}/restore")
    assert staff_hide.status_code == 403
    await logout(client)

    await login(client, str(moderator["email"]))
    staff_restored = await client.post(f"/api/forum/posts/{slug}/restore")
    assert staff_restored.status_code == 200, staff_restored.text
    assert staff_restored.json()["deleted"] is False


@pytest.mark.asyncio
async def test_stranger_cannot_delete_topic_or_comment(client: AsyncClient) -> None:
    await register_verified(client)
    slug = await _topic(client, "Чужая тема")
    comment = await client.post(
        f"/api/forum/posts/{slug}/comments", json={"body": "Мой ответ"}
    )
    comment_id = comment.json()["id"]
    await logout(client)

    await register_verified(client)
    topic = await client.delete(f"/api/forum/posts/{slug}")
    assert topic.status_code == 403
    reply = await client.delete(f"/api/forum/posts/{slug}/comments/{comment_id}")
    assert reply.status_code == 403
    detail = await client.get(f"/api/forum/posts/{slug}")
    assert detail.status_code == 200
    assert detail.json()["comments"][0]["id"] == comment_id


@pytest.mark.asyncio
async def test_list_posts_filters_by_category(client: AsyncClient) -> None:
    categories = (await client.get("/api/forum/categories")).json()
    assert len(categories) >= 2
    await register_verified(client)
    created = await client.post(
        "/api/forum/posts",
        json={
            "title": "Фильтр категории",
            "categoryId": categories[0]["id"],
            "content": "Текст темы.",
        },
    )
    slug = created.json()["slug"]
    matched = await client.get(
        "/api/forum/posts", params={"category": categories[0]["code"]}
    )
    assert matched.status_code == 200
    assert [item["slug"] for item in matched.json()] == [slug]
    other = await client.get(
        "/api/forum/posts", params={"category": categories[1]["code"]}
    )
    assert other.json() == []
    unknown = await client.get("/api/forum/posts", params={"category": "missing"})
    assert unknown.status_code == 404
    assert unknown.json()["code"] == "not_found"


@pytest.mark.asyncio
async def test_forum_rejects_empty_fields_and_bad_comment_id(
    client: AsyncClient,
) -> None:
    await register_verified(client)
    category_id = await first_category_id(client)
    empty_title = await client.post(
        "/api/forum/posts",
        json={"title": "  ", "categoryId": category_id, "content": "Текст"},
    )
    assert empty_title.status_code == 422
    assert empty_title.json()["fieldErrors"]["title"]
    empty_content = await client.post(
        "/api/forum/posts",
        json={"title": "Заголовок", "categoryId": category_id, "content": "  "},
    )
    assert empty_content.status_code == 422
    assert "content" in empty_content.json()["fieldErrors"]

    slug = await _topic(client, "Проверка ответа")
    empty_body = await client.post(
        f"/api/forum/posts/{slug}/comments", json={"body": "  "}
    )
    assert empty_body.status_code == 422
    assert "body" in empty_body.json()["fieldErrors"]
    bad_id = await client.patch(
        f"/api/forum/posts/{slug}/comments/not-a-uuid", json={"body": "Текст"}
    )
    assert bad_id.status_code == 422
    assert bad_id.json()["code"] == "validation"


@pytest.mark.asyncio
async def test_comment_rejects_hidden_topic_and_foreign_parent(
    client: AsyncClient,
) -> None:
    await register_verified(client)
    hidden = await _topic(client, "Скрытая тема")
    assert (await client.delete(f"/api/forum/posts/{hidden}")).status_code == 204
    denied = await client.post(
        f"/api/forum/posts/{hidden}/comments", json={"body": "На скрытую"}
    )
    assert denied.status_code == 404

    first = await _topic(client, "Первая тема")
    second = await _topic(client, "Вторая тема")
    parent = await client.post(
        f"/api/forum/posts/{first}/comments", json={"body": "Корень"}
    )
    foreign = await client.post(
        f"/api/forum/posts/{second}/comments",
        json={"body": "Чужой родитель", "parentId": parent.json()["id"]},
    )
    assert foreign.status_code == 400
    assert foreign.json()["code"] == "validation"
    detail = await client.get(f"/api/forum/posts/{second}")
    assert detail.json()["comments"] == []
