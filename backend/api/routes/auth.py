from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from core.cookies import clear_session_cookie, set_session_cookie
from core.deps import (
    client_ip,
    get_auth_service,
    get_current_user,
    get_optional_session,
)
from models.user import User
from schemas.auth import (
    ChangeEmailRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LogoutResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    RegisterResponse,
    ResendResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenRequest,
)
from schemas.user import PublicUser, activity_to_label
from services.auth import AuthOutcome, AuthService, ResolvedSession

router = APIRouter(prefix="/auth", tags=["auth"])


def _public_user(user: User) -> dict[str, object]:
    payload = PublicUser(
        id=user.id,
        email=str(user.email),
        nickname=user.nickname,
        first_name=user.first_name,
        last_name=user.last_name,
        company=user.company,
        position=user.position,
        activity_type=activity_to_label(user.activity_type),
        avatar="",
        country=user.country,
        city=user.city,
        bio=user.bio,
        website=user.website,
        phone=user.phone,
        email_verified=user.email_verified,
        role=user.role,
        marketing_consent=user.marketing_consent,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
    )
    return payload.model_dump(by_alias=True, mode="json")


def _apply_outcome(response: Response, outcome: AuthOutcome) -> None:
    if outcome.raw_session_token:
        set_session_cookie(response, outcome.raw_session_token)
    if outcome.clear_session_cookie:
        clear_session_cookie(response)


@router.post("/register", response_model=RegisterResponse)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, object]:
    outcome = await service.register(payload, ip=client_ip(request))
    _apply_outcome(response, outcome)
    assert outcome.user is not None
    body = _public_user(outcome.user)
    if outcome.demo_verification_path:
        body["demoVerificationPath"] = outcome.demo_verification_path
    return body


@router.post("/login", response_model=PublicUser)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, object]:
    outcome = await service.login(payload, ip=client_ip(request))
    _apply_outcome(response, outcome)
    assert outcome.user is not None
    return _public_user(outcome.user)


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    service: Annotated[AuthService, Depends(get_auth_service)],
    resolved: Annotated[ResolvedSession | None, Depends(get_optional_session)],
) -> LogoutResponse:
    outcome = await service.logout(resolved)
    _apply_outcome(response, outcome)
    return LogoutResponse()


@router.get("/me", response_model=PublicUser)
async def me(
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, object]:
    return _public_user(user)


@router.patch("/profile", response_model=PublicUser)
async def update_profile(
    payload: ProfileUpdateRequest,
    user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, object]:
    outcome = await service.update_profile(user, payload)
    assert outcome.user is not None
    return _public_user(outcome.user)


@router.post("/verify-email", response_model=PublicUser)
async def verify_email(
    payload: TokenRequest,
    response: Response,
    service: Annotated[AuthService, Depends(get_auth_service)],
    resolved: Annotated[ResolvedSession | None, Depends(get_optional_session)],
) -> dict[str, object]:
    outcome = await service.verify_email(payload.token, resolved)
    _apply_outcome(response, outcome)
    assert outcome.user is not None
    return _public_user(outcome.user)


@router.post("/resend-verification", response_model=ResendResponse)
async def resend_verification(
    request: Request,
    user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ResendResponse:
    outcome = await service.resend_verification(user, ip=client_ip(request))
    return ResendResponse(
        resend_available_at=outcome.resend_available_at,
        demo_verification_path=outcome.demo_verification_path,
    )


@router.post("/change-email", response_model=ResendResponse)
async def change_email(
    payload: ChangeEmailRequest,
    request: Request,
    user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ResendResponse:
    outcome = await service.change_email(user, payload, ip=client_ip(request))
    return ResendResponse(
        resend_available_at=outcome.resend_available_at,
        demo_verification_path=outcome.demo_verification_path,
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ForgotPasswordResponse:
    outcome = await service.forgot_password(payload, ip=client_ip(request))
    return ForgotPasswordResponse(demo_reset_path=outcome.demo_reset_path)


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    response: Response,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ResetPasswordResponse:
    outcome = await service.reset_password(payload)
    _apply_outcome(response, outcome)
    return ResetPasswordResponse()
