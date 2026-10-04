from __future__ import annotations

from models.enums import UserRole

ROLE_RANK: dict[UserRole, int] = {
    UserRole.USER: 0,
    UserRole.PROFESSIONAL: 1,
    UserRole.MODERATOR: 2,
    UserRole.EDITOR: 3,
    UserRole.ADMIN: 4,
}

STAFF_MIN_RANK = ROLE_RANK[UserRole.MODERATOR]
EDITOR_MIN_RANK = ROLE_RANK[UserRole.EDITOR]


def is_staff(role: UserRole) -> bool:
    return ROLE_RANK.get(role, 0) >= STAFF_MIN_RANK


def is_editor(role: UserRole) -> bool:
    return ROLE_RANK.get(role, 0) >= EDITOR_MIN_RANK


def is_admin(role: UserRole) -> bool:
    return role == UserRole.ADMIN
