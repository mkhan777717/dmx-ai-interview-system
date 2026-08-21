"""
GET /api/livekit/token/{room_name}
Issues a LiveKit Access Token scoped to a specific room (interview session).
Also launches the TruGen cloud avatar into the room.
"""
import logging
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Cookie, Query
from pydantic import BaseModel

from app.config.settings import settings
from app.config.jwt_handler import verify_token
from app.services.avatar_service import get_room_token, start_trugen_avatar_session, LiveKitNotConfiguredError

log = logging.getLogger("livekit_route")
router = APIRouter()


class TokenResponse(BaseModel):
    token: str
    url: str
    room_name: str
    trugen_triggered: bool = False


@router.get("/token/{room_name}", response_model=TokenResponse)
async def get_livekit_token(
    room_name: str,
    participant_name: str = "candidate",
    avatar_id: Optional[str] = Query("db56efae-05b0-4c3b-956c-914bc31e4c04", description="TruGen avatar ID to join room"),
    token: Optional[str] = Cookie(None),
):
    """
    Generate a LiveKit Access Token scoped to a specific room (interview_id).
    Also triggers the TruGen AI avatar session so the avatar joins the room.
    """
    user_id = "guest"
    if token:
        payload = verify_token(token)
        if payload and payload.get("userId"):
            user_id = str(payload.get("userId"))

    try:
        room_tok = get_room_token(
            interview_id=room_name,
            participant_name=participant_name,
            user_id=user_id,
        )

        # Trigger TruGen cloud avatar to join the LiveKit room
        trugen_ok = False
        if avatar_id:
            trugen_ok = await start_trugen_avatar_session(
                room_name=room_name,
                avatar_id=avatar_id,
            )

        return TokenResponse(
            token=room_tok.token,
            url=room_tok.url,
            room_name=room_tok.room_name,
            trugen_triggered=trugen_ok,
        )
    except LiveKitNotConfiguredError as exc:
        log.warning("LiveKit credentials error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        log.error("LiveKit token generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Token generation failed: {exc}")
