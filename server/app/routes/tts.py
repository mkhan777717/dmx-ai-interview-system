"""POST /api/v2/speak — text → natural speech via Groq PlayAI TTS"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.tts import speak_text

router = APIRouter()


class SpeakRequest(BaseModel):
    text: str


@router.post("/speak")
async def speak(body: SpeakRequest):
    try:
        audio = speak_text(body.text)
        if not audio:
            raise HTTPException(status_code=400, detail="Empty text")
        return Response(content=audio, media_type="audio/wav")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech failed: {str(e)}")
