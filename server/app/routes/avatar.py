"""
POST /api/avatar/speak
Returns TTS audio (base64 WAV) + Rhubarb viseme cues for avatar lip sync.

Response shape (always HTTP 200):
{
  "audio":   "<base64-encoded WAV>",   # null on TTS failure
  "visemes": [                          # [] if Rhubarb unavailable
    {"start": 0.0, "end": 0.21, "value": "B", "vrm_shape": "oh"},
    ...
  ],
  "duration": 3.42,                     # total audio duration in seconds
  "cached":   false,                    # true if served from Redis/memory cache
  "error":    null                      # string error message if partial failure
}

Design: never raises HTTPException — client handles partial results gracefully
so the interview always continues even if avatar lip-sync is unavailable.
"""

from __future__ import annotations

import base64
import io
import logging
import wave
import uuid
import os
import httpx
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.avatar_cache import cache_get, cache_set
from app.services.tts import speak_text

log = logging.getLogger("avatar_route")
router = APIRouter()

os.makedirs("public/videos", exist_ok=True)

class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000,
                      description="Interview question text to synthesize")


def _wav_duration(wav_bytes: bytes) -> float:
    """Return duration of WAV bytes in seconds."""
    try:
        with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
            return wf.getnframes() / max(wf.getframerate(), 1)
    except Exception:
        return 0.0


@router.post("/speak")
async def avatar_speak(body: SpeakRequest) -> dict[str, Any]:
    """
    Synthesise question audio and generate Wav2Lip video.
    Gracefully falls back to returning audio-only if ML service is down.
    """
    text = body.text.strip()
    error_msg: str | None = None

    # ── 1. Cache lookup ──────────────────────────────────────────────────────
    cached_payload = await cache_get(text)
    if cached_payload:
        cached_payload["cached"] = True
        return cached_payload

    # ── 2. TTS synthesis ─────────────────────────────────────────────────────
    audio_b64: str | None = None
    wav_bytes: bytes = b""

    try:
        wav_bytes = speak_text(text)
        if wav_bytes:
            audio_b64 = base64.b64encode(wav_bytes).decode()
    except Exception as exc:
        log.error("TTS failed for avatar/speak: %s", exc)
        error_msg = f"TTS unavailable: {str(exc)[:120]}"

    # ── 3. Wav2Lip ML Microservice ───────────────────────────────────────────
    video_url: str | None = None
    if wav_bytes:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                files = {"audio": ("speech.wav", wav_bytes, "audio/wav")}
                res = await client.post("http://localhost:8001/generate", files=files)
                if res.status_code == 200:
                    vid_id = str(uuid.uuid4())
                    vid_path = f"public/videos/{vid_id}.mp4"
                    with open(vid_path, "wb") as f:
                        f.write(res.content)
                    video_url = f"/public/videos/{vid_id}.mp4"
                else:
                    log.warning(f"Wav2Lip service returned {res.status_code}: {res.text}")
                    error_msg = f"Wav2Lip generation failed: {res.text[:120]}"
        except Exception as exc:
            log.warning("Could not reach Wav2Lip microservice (is it running?): %s", exc)
            if not error_msg:
                error_msg = "Wav2Lip service offline; degrading to audio-only"

    # ── 4. Duration ──────────────────────────────────────────────────────────
    duration = _wav_duration(wav_bytes) if wav_bytes else 0.0

    # ── 5. Build + cache payload ─────────────────────────────────────────────
    payload: dict[str, Any] = {
        "videoUrl": video_url,
        "audio":    audio_b64,
        "duration": round(duration, 3),
        "cached":   False,
        "error":    error_msg,
    }

    if video_url or audio_b64:
        await cache_set(text, payload)

    return payload
