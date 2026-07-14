"""POST /api/v2/transcribe — audio → text via local Whisper"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.transcriber import transcribe_bytes

router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Accepts an audio file (webm/mp4/wav/ogg) from the browser MediaRecorder.
    Returns { "text": "..." }  — transcribed with local Whisper, no Google.
    """
    try:
        content = await audio.read()
        mime = audio.content_type or "audio/webm"
        text = transcribe_bytes(content, mime)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
