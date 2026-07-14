import io
from groq import Groq
from app.config.settings import settings

_client = None


def get_client() -> Groq:
    global _client
    if _client is None:
        api_key = (settings.GROQ_API_KEY or "").strip()
        if not api_key or api_key == "your_groq_api_key_here":
            raise ValueError(
                "GROQ_API_KEY not set. Add it to server/.env and restart the server."
            )
        _client = Groq(api_key=api_key)
    return _client


def transcribe_bytes(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """Send audio bytes to Groq Whisper → return English transcript string."""
    if not audio_bytes or len(audio_bytes) < 500:
        return ""

    # Map mime type to a filename extension Groq accepts
    ext_map = {
        "audio/webm": ".webm",
        "audio/ogg":  ".ogg",
        "audio/mp4":  ".mp4",
        "audio/m4a":  ".m4a",
        "audio/wav":  ".wav",
        "audio/mpeg": ".mp3",
    }
    ext = ".webm"
    for k, v in ext_map.items():
        if k in mime_type:
            ext = v
            break

    filename = f"audio{ext}"
    client = get_client()

    transcription = client.audio.transcriptions.create(
        model="whisper-large-v3-turbo",   # fastest Whisper on Groq
        file=(filename, io.BytesIO(audio_bytes), mime_type),
        language="en",
        response_format="text",
    )

    # response_format="text" returns a plain string directly
    return transcription.strip() if isinstance(transcription, str) else transcription.text.strip()
