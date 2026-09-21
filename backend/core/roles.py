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


def is_staff(role: UserRole) -> bool:
    return ROLE_RANK.get(role, 0) >= STAFF_MIN_RANK
