from __future__ import annotations

from httpx import AsyncClient
from sqlalchemy import update
from test_auth import PASSWORD, register_body, token_from_path

from core.db import SessionLocal
from models.enums import UserRole
from models.user import User


async def register_user(client: AsyncClient, **overrides: object) -> dict[str, object]:
    body = register_body(**overrides)
    created = await client.post("/auth/register", json=body)
    assert created.status_code == 200, created.text
    payload = created.json()
    return {
        "email": body["email"],
        "password": PASSWORD,
        "nickname": body["nickname"],
        "demoVerificationPath": payload["demoVerificationPath"],
    }


async def verify_email(client: AsyncClient, path: str) -> None:
    token = token_from_path(path)
    verified = await client.post("/auth/verify-email", json={"token": token})
    assert verified.status_code == 200, verified.text


async def register_verified(
    client: AsyncClient, **overrides: object
) -> dict[str, object]:
    account = await register_user(client, **overrides)
    await verify_email(client, str(account["demoVerificationPath"]))
    return account


async def login(client: AsyncClient, email: str, password: str = PASSWORD) -> None:
    response = await client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    assert response.status_code == 200, response.text


async def logout(client: AsyncClient) -> None:
    await client.post("/auth/logout")


async def set_role(email: str, role: UserRole) -> None:
    async with SessionLocal() as session:
        await session.execute(update(User).where(User.email == email).values(role=role))
        await session.commit()
