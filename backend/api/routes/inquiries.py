from typing import Annotated

from fastapi import APIRouter, Depends, Response

from core.deps import get_current_user
from models.user import User
from schemas.inquiry import InquiryCreate
from services.inquiries import submit_inquiry

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])


@router.post("", status_code=204)
async def create_inquiry(
    payload: InquiryCreate,
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    await submit_inquiry(user, payload)
    return Response(status_code=204)
