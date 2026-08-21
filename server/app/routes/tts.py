"""POST /api/v2/speak — text -> natural speech via OpenAI / native TTS with male/female voice mapping"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.tts import speak_text

router = APIRouter()


class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    gender: Optional[str] = None
    persona: Optional[str] = None


@router.post("/speak")
async def speak(body: SpeakRequest):
    try:
        audio = speak_text(
            text=body.text,
            voice=body.voice,
            gender=body.gender,
            persona=body.persona,
        )
        if not audio:
            raise HTTPException(status_code=400, detail="Empty text or failed synthesis")
        return Response(content=audio, media_type="audio/wav")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech failed: {str(e)}")
