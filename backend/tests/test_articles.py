from __future__ import annotations

import pytest
from community_helpers import (
    login,
    logout,
    register_user,
    register_verified,
    set_role,
)
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from models.enums import UserRole


@pytest.fixture(autouse=True)
async def _clean_articles():
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE articles CASCADE"))
        await session.commit()
    yield
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE articles CASCADE"))
        await session.commit()


async def first_category_id(client: AsyncClient) -> str:
    response = await client.get("/api/articles/categories")
    assert response.status_code == 200
    rows = response.json()
    assert rows
    return rows[0]["id"]


def article_body(category_id: str, **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "title": "Как выбрать алмазный диск",
        "excerpt": "Короткий гид по инструменту",
        "content": "Мы сравнили три диска на граните и записали расход.",
        "categoryId": category_id,
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_guest_cannot_create_article(client: AsyncClient) -> None:
    category_id = await first_category_id(client)
    response = await client.post("/api/articles", json=article_body(category_id))
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_unverified_cannot_create_article(client: AsyncClient) -> None:
    await register_user(client)
    category_id = await first_category_id(client)
    response = await client.post("/api/articles", json=article_body(category_id))
    assert response.status_code == 403
    assert response.json()["code"] == "unverified"


@pytest.mark.asyncio
async def test_new_author_cannot_publish_until_moderated(client: AsyncClient) -> None:
    author = await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post("/api/articles", json=article_body(category_id))
    assert created.status_code == 200, created.text
    slug = created.json()["slug"]
    assert created.json()["publicationStatus"] == "draft"

    forbidden = await client.post(f"/api/articles/{slug}/publish")
    assert forbidden.status_code == 403

    submitted = await client.post(f"/api/articles/{slug}/submit")
    assert submitted.status_code == 200
    assert submitted.json()["publicationStatus"] == "pending_review"

    public = await client.get("/api/articles")
    assert public.json() == []

    await logout(client)
    hidden = await client.get(f"/api/articles/{slug}")
    assert hidden.status_code == 404

    moderator = await register_verified(client)
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    queued = await client.get("/api/articles/moderation")
    assert queued.status_code == 200
    assert queued.json()[0]["slug"] == slug

    published = await client.post(
        f"/api/articles/{slug}/moderate", json={"action": "publish"}
    )
    assert published.status_code == 200, published.text
    assert published.json()["publicationStatus"] == "published"

    await logout(client)
    await login(client, str(author["email"]))
    me = await client.get("/auth/me")
    assert me.json()["canPublishArticles"] is True

    second = await client.post(
        "/api/articles",
        json=article_body(category_id, title="Настройка CNC для мрамора"),
    )
    second_slug = second.json()["slug"]
    live = await client.post(f"/api/articles/{second_slug}/publish")
    assert live.status_code == 200, live.text
    assert live.json()["publicationStatus"] == "published"

    feed = await client.get("/api/articles")
    slugs = {item["slug"] for item in feed.json()}
    assert slug in slugs
    assert second_slug in slugs


@pytest.mark.asyncio
async def test_moderator_can_return_and_author_resubmits(
    client: AsyncClient,
) -> None:
    await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post("/api/articles", json=article_body(category_id))
    slug = created.json()["slug"]
    await client.post(f"/api/articles/{slug}/submit")
    await logout(client)

    moderator = await register_verified(client)
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    returned = await client.post(
        f"/api/articles/{slug}/moderate",
        json={"action": "request_changes", "note": "Добавьте фото процесса."},
    )
    assert returned.status_code == 200
    assert returned.json()["publicationStatus"] == "needs_revision"
    assert "фото" in returned.json()["moderationNote"]


@pytest.mark.asyncio
async def test_author_edit_withdraws_article_from_moderation(
    client: AsyncClient,
) -> None:
    author = await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post("/api/articles", json=article_body(category_id))
    slug = created.json()["slug"]
    submitted = await client.post(f"/api/articles/{slug}/submit")
    assert submitted.json()["publicationStatus"] == "pending_review"
    await logout(client)

    moderator = await register_verified(client)
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    queued = await client.get("/api/articles/moderation")
    assert queued.status_code == 200
    assert any(item["slug"] == slug for item in queued.json())
    await logout(client)

    await login(client, str(author["email"]))
    updated = await client.patch(
        f"/api/articles/{slug}",
        json={"content": "Обновлённый текст после отправки на модерацию."},
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["publicationStatus"] == "draft"
    assert "Обновлённый" in body["content"]
    await logout(client)

    await login(client, str(moderator["email"]))
    queue = await client.get("/api/articles/moderation")
    assert queue.status_code == 200
    assert all(item["slug"] != slug for item in queue.json())
    await logout(client)

    await login(client, str(author["email"]))
    resubmitted = await client.post(f"/api/articles/{slug}/submit")
    assert resubmitted.status_code == 200
    assert resubmitted.json()["publicationStatus"] == "pending_review"


async def categories(client: AsyncClient) -> list[dict[str, object]]:
    response = await client.get("/api/articles/categories")
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) >= 2
    return rows


async def publish_article(
    client: AsyncClient,
    *,
    title: str,
    category_id: str,
    author: dict[str, object] | None = None,
) -> tuple[dict[str, object], str]:
    if author is None:
        author = await register_verified(client)
    else:
        await login(client, str(author["email"]))
    created = await client.post(
        "/api/articles", json=article_body(category_id, title=title)
    )
    assert created.status_code == 200, created.text
    slug = created.json()["slug"]
    submitted = await client.post(f"/api/articles/{slug}/submit")
    assert submitted.status_code == 200, submitted.text
    if submitted.json()["publicationStatus"] == "published":
        return author, slug
    await logout(client)

    moderator = await register_verified(client)
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    published = await client.post(
        f"/api/articles/{slug}/moderate", json={"action": "publish"}
    )
    assert published.status_code == 200, published.text
    await logout(client)
    await login(client, str(author["email"]))
    return author, slug


@pytest.mark.asyncio
async def test_mine_lists_only_own_drafts(client: AsyncClient) -> None:
    await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post("/api/articles", json=article_body(category_id))
    assert created.status_code == 200, created.text
    slug = created.json()["slug"]

    mine = await client.get("/api/articles/mine")
    assert mine.status_code == 200
    assert [item["slug"] for item in mine.json()] == [slug]
    await logout(client)

    await register_verified(client)
    foreign = await client.get("/api/articles/mine")
    assert foreign.status_code == 200
    assert all(item["slug"] != slug for item in foreign.json())
    await logout(client)

    guest = await client.get("/api/articles/mine")
    assert guest.status_code == 401
    assert guest.json()["code"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_comments_and_likes_require_published_article(
    client: AsyncClient,
) -> None:
    author = await register_verified(client)
    category_id = await first_category_id(client)
    draft = await client.post(
        "/api/articles",
        json=article_body(category_id, title="Черновик без комментариев"),
    )
    draft_slug = draft.json()["slug"]
    hidden_comment = await client.post(
        f"/api/articles/{draft_slug}/comments", json={"body": "Рано"}
    )
    assert hidden_comment.status_code == 404
    hidden_like = await client.post(f"/api/articles/{draft_slug}/likes")
    assert hidden_like.status_code == 404

    _, slug = await publish_article(
        client,
        title="Опубликованная статья",
        category_id=category_id,
        author=author,
    )
    await logout(client)

    guest_comment = await client.post(
        f"/api/articles/{slug}/comments", json={"body": "Без входа"}
    )
    assert guest_comment.status_code == 401
    guest_like = await client.post(f"/api/articles/{slug}/likes")
    assert guest_like.status_code == 401

    await login(client, str(author["email"]))
    comment = await client.post(
        f"/api/articles/{slug}/comments", json={"body": "Полезный разбор"}
    )
    assert comment.status_code == 200, comment.text
    assert comment.json()["body"] == "Полезный разбор"
    liked = await client.post(f"/api/articles/{slug}/likes")
    assert liked.status_code == 200, liked.text
    assert liked.json() == {"liked": True, "likesCount": 1}
    removed = await client.post(f"/api/articles/{slug}/likes")
    assert removed.json() == {"liked": False, "likesCount": 0}

    detail = await client.get(f"/api/articles/{slug}")
    assert detail.json()["commentCount"] == 1
    assert detail.json()["comments"][0]["body"] == "Полезный разбор"

    _, other_slug = await publish_article(
        client,
        title="Вторая опубликованная статья",
        category_id=category_id,
        author=author,
    )
    parent_id = comment.json()["id"]
    foreign_parent = await client.post(
        f"/api/articles/{other_slug}/comments",
        json={"body": "Чужой родитель", "parentId": parent_id},
    )
    assert foreign_parent.status_code == 400
    assert foreign_parent.json()["code"] == "validation"
    other = await client.get(f"/api/articles/{other_slug}")
    assert other.json()["comments"] == []


@pytest.mark.asyncio
async def test_article_list_filters_sort_and_favorites(client: AsyncClient) -> None:
    rows = await categories(client)
    author, popular_slug = await publish_article(
        client,
        title="Популярный материал",
        category_id=str(rows[0]["id"]),
    )
    _, quiet_slug = await publish_article(
        client,
        title="Тихий материал",
        category_id=str(rows[1]["id"]),
        author=author,
    )
    liked = await client.post(f"/api/articles/{popular_slug}/likes")
    assert liked.status_code == 200, liked.text

    by_category = await client.get(
        "/api/articles", params={"category": rows[0]["code"]}
    )
    assert by_category.status_code == 200
    assert [item["slug"] for item in by_category.json()] == [popular_slug]

    unknown = await client.get("/api/articles", params={"category": "missing"})
    assert unknown.status_code == 404
    assert unknown.json()["code"] == "not_found"

    popular = await client.get("/api/articles", params={"sort": "popular"})
    assert [item["slug"] for item in popular.json()][:2] == [popular_slug, quiet_slug]

    favorites = await client.get("/api/articles", params={"favorites": "true"})
    assert favorites.status_code == 200
    assert [item["slug"] for item in favorites.json()] == [popular_slug]
    await logout(client)

    guest = await client.get("/api/articles", params={"favorites": "true"})
    assert guest.status_code == 401
    assert guest.json()["code"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_member_cannot_open_moderation(client: AsyncClient) -> None:
    await register_verified(client)
    queued = await client.get("/api/articles/moderation")
    assert queued.status_code == 403
    assert queued.json()["code"] == "forbidden"
    moderated = await client.post(
        "/api/articles/missing/moderate", json={"action": "publish"}
    )
    assert moderated.status_code == 403
    assert moderated.json()["code"] == "forbidden"


@pytest.mark.asyncio
async def test_article_validation_ignores_protected_fields(
    client: AsyncClient,
) -> None:
    author = await register_verified(client)
    category_id = await first_category_id(client)
    invalid = await client.post(
        "/api/articles",
        json=article_body(category_id, title="  ", content="  ", coverUrl="not-a-url"),
    )
    assert invalid.status_code == 422
    body = invalid.json()
    assert body["code"] == "validation"
    assert set(body["fieldErrors"]) >= {"title", "content", "coverUrl"}
    assert set(body) <= {
        "message",
        "code",
        "fieldErrors",
        "retryAfterSeconds",
        "requestId",
    }
    assert "detail" not in body

    created = await client.post(
        "/api/articles",
        json=article_body(
            category_id,
            role="admin",
            publicationStatus="published",
            authorId="00000000-0000-0000-0000-000000000001",
        ),
    )
    assert created.status_code == 200, created.text
    draft = created.json()
    assert draft["publicationStatus"] == "draft"
    me = await client.get("/auth/me")
    assert draft["authorId"] == me.json()["id"]
    assert me.json()["role"] == "user"
    assert me.json()["emailVerified"] is True

    updated = await client.patch(
        f"/api/articles/{draft['slug']}",
        json={"publicationStatus": "published", "authorId": author["email"]},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["publicationStatus"] == "draft"
    assert updated.json()["authorId"] == me.json()["id"]
