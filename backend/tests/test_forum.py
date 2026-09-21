from __future__ import annotations

import pytest
from community_helpers import login, logout, register_user, register_verified
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal


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
