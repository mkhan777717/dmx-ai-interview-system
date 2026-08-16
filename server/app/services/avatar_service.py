"""
avatar_service.py — LiveKit room token helper for the TruGen avatar pipeline.

Provides get_room_token() to separate token-generation logic from the route
handler, making it reusable (e.g. from a future WebSocket handshake or a
background task that pre-warms a LiveKit room).

The actual TruGen agent (trugen_agent.py) runs as a separate process and
connects to the same LiveKit room; it picks up audio published by the
/api/v2/speak endpoint and renders the lip-sync video track.

NOTE: TruGen's own conversational LLM is NOT used — interview_agent.py and
question_selector.py remain the authoritative source for all question content.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass

from app.config.settings import settings

log = logging.getLogger("avatar_service")


@dataclass
class RoomToken:
    token: str
    url: str
    room_name: str
    identity: str


class LiveKitNotConfiguredError(Exception):
    """Raised when LIVEKIT_API_KEY or LIVEKIT_API_SECRET are missing/placeholder."""


def _require_livekit_credentials() -> tuple[str, str]:
    """
    Return (api_key, api_secret) or raise LiveKitNotConfiguredError.
    Keeps credential validation in one place.
    """
    api_key = settings.LIVEKIT_API_KEY.strip()
    api_secret = settings.LIVEKIT_API_SECRET.strip()

    placeholders = {"", "your_livekit_api_key_here", "your_livekit_api_secret_here"}
    if api_key in placeholders:
        raise LiveKitNotConfiguredError(
            "LIVEKIT_API_KEY not set. Add it to server/.env — "
            "create a project at https://cloud.livekit.io to get credentials."
        )
    if api_secret in placeholders:
        raise LiveKitNotConfiguredError(
            "LIVEKIT_API_SECRET not set. Add it to server/.env."
        )
    return api_key, api_secret


def get_room_token(
    interview_id: str | int,
    participant_name: str = "candidate",
    user_id: str | int = "anon",
) -> RoomToken:
    """
    Issue a LiveKit Access Token scoped to room=interview_id.

    Args:
        interview_id: The interview session ID — used as the LiveKit room name
                      so both the candidate frontend and the TruGen agent join
                      the same room.
        participant_name: Human-readable participant label (e.g. "candidate").
        user_id: Used to make the token identity unique per user.

    Returns:
        RoomToken with .token (JWT str), .url (wss://...), .room_name, .identity

    Raises:
        LiveKitNotConfiguredError: if credentials are missing/placeholder.
        Exception: on any LiveKit SDK error.
    """
    from livekit import api  # lazy import — keeps startup fast if LiveKit unused

    api_key, api_secret = _require_livekit_credentials()

    room_name = str(interview_id)
    identity = f"{participant_name}_{user_id}_{os.urandom(3).hex()}"

    token = (
        api.AccessToken(api_key, api_secret)
        .with_identity(identity)
        .with_name(participant_name)
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        ))
    )

    jwt = token.to_jwt()
    log.debug("Issued LiveKit token for room=%s identity=%s", room_name, identity)

    return RoomToken(
        token=jwt,
        url=settings.LIVEKIT_URL,
        room_name=room_name,
        identity=identity,
    )


async def start_trugen_avatar_session(
    room_name: str,
    avatar_id: str = "80b9095f",
) -> bool:
    """
    Triggers the TruGen.AI cloud avatar to join the LiveKit room.
    The TruGen avatar joins as 'trugen-avatar' and publishes its video stream.
    """
    trugen_key = settings.TRUGEN_API_KEY.strip()
    if not trugen_key or trugen_key == "your_trugen_key_here":
        log.warning("TRUGEN_API_KEY not configured — skipping TruGen cloud session trigger.")
        return False

    api_key, api_secret = _require_livekit_credentials()

    from livekit import api
    import httpx

    # Create a scoped token for the TruGen avatar agent
    avatar_token = (
        api.AccessToken(api_key, api_secret)
        .with_identity("trugen-avatar")
        .with_name("Trugen Avatar")
        .with_grants(api.VideoGrants(
            room_join=True,
            room=str(room_name),
            can_publish=True,
            can_subscribe=True,
        ))
        .to_jwt()
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.trugen.ai/v1/sessions",
                headers={
                    "x-api-key": trugen_key,
                    "Content-Type": "application/json",
                },
                json={
                    "avatar_id": avatar_id,
                    "livekit_url": settings.LIVEKIT_URL,
                    "livekit_token": avatar_token,
                },
            )
            if resp.status_code in (200, 201):
                log.info("TruGen avatar session started successfully for room: %s (avatar_id: %s)", room_name, avatar_id)
                return True
            else:
                log.warning("TruGen API returned status %s: %s", resp.status_code, resp.text)
                return False
    except Exception as exc:
        log.warning("Failed to start TruGen avatar session: %s", exc)
        return False
