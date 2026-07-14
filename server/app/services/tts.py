import io
import re
import wave

from app.services.transcriber import get_client

# Orpheus replaced decommissioned playai-tts (Dec 2025)
TTS_MODEL = "canopylabs/orpheus-v1-english"
TTS_VOICE = "diana"   # calm, clear female — good for reading questions
MAX_CHARS = 200       # Orpheus API limit per request


def _chunk_text(text: str, max_len: int = MAX_CHARS) -> list[str]:
    """Split text into chunks ≤ max_len, preferring sentence boundaries."""
    if len(text) <= max_len:
        return [text]

    chunks: list[str] = []
    current = ""

    for part in re.split(r"(?<=[.!?])\s+", text):
        if not part:
            continue
        if len(part) > max_len:
            for word in part.split():
                next_piece = f"{current} {word}".strip()
                if len(next_piece) <= max_len:
                    current = next_piece
                else:
                    if current:
                        chunks.append(current)
                    current = word[:max_len]
            continue

        next_piece = f"{current} {part}".strip()
        if len(next_piece) <= max_len:
            current = next_piece
        else:
            if current:
                chunks.append(current)
            current = part

    if current:
        chunks.append(current)
    return chunks or [text[:max_len]]


def _concat_wavs(wav_bytes_list: list[bytes]) -> bytes:
    if not wav_bytes_list:
        return b""
    if len(wav_bytes_list) == 1:
        return wav_bytes_list[0]

    output = io.BytesIO()
    params = None
    frames: list[bytes] = []

    for wav_data in wav_bytes_list:
        with wave.open(io.BytesIO(wav_data), "rb") as src:
            if params is None:
                params = src.getparams()
            frames.append(src.readframes(src.getnframes()))

    with wave.open(output, "wb") as dst:
        dst.setparams(params)
        for frame in frames:
            dst.writeframes(frame)

    return output.getvalue()


def speak_text(text: str) -> bytes:
    """Generate WAV audio from text via Groq Orpheus TTS."""
    text = (text or "").strip()
    if not text:
        return b""

    client = get_client()
    wav_parts: list[bytes] = []

    for chunk in _chunk_text(text):
        response = client.audio.speech.create(
            model=TTS_MODEL,
            voice=TTS_VOICE,
            input=chunk,
            response_format="wav",
        )
        wav_parts.append(response.read())

    return _concat_wavs(wav_parts)
