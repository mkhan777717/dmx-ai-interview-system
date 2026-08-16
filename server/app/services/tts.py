import io
import os
import platform
import re
import subprocess
import tempfile
import wave

from openai import OpenAI
from app.config.settings import settings

# OpenAI TTS
TTS_MODEL = "tts-1"
TTS_VOICE = "nova"    # highly realistic, energetic female voice
MAX_CHARS = 4096      # OpenAI TTS limit per request

_openai_client = None

def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY not set. Add it to server/.env and restart the server."
            )
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


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


def _macos_say_tts(text: str) -> bytes:
    """
    macOS-only fallback: system 'say' + 'afconvert' → WAV bytes.
    No external dependencies required.
    """
    if platform.system() != "Darwin":
        return b""
    with tempfile.TemporaryDirectory() as tmpdir:
        aiff_path = os.path.join(tmpdir, "speech.aiff")
        wav_path  = os.path.join(tmpdir, "speech.wav")
        r1 = subprocess.run(
            ["say", "-v", "Samantha", "-r", "150", "-o", aiff_path, text],
            capture_output=True, timeout=20,
        )
        if r1.returncode != 0:
            return b""
        # 22050 Hz, 1 channel (mono), 16-bit PCM — Rhubarb-compatible
        r2 = subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", "LEI16@22050", "-c", "1", aiff_path, wav_path],
            capture_output=True, timeout=10,
        )
        if r2.returncode != 0:
            return b""
        with open(wav_path, "rb") as f:
            return f.read()


def speak_text(text: str) -> bytes:
    """Generate WAV audio from text.  Tries Groq Orpheus first, falls back to macOS 'say'."""
    text = (text or "").strip()
    if not text:
        return b""

    # ── 1. Try OpenAI TTS ──────────────────────────────────────────────
    try:
        client = get_openai_client()
        wav_parts: list[bytes] = []
        for chunk in _chunk_text(text):
            # Using 'pcm' or 'wav'. OpenAI supports 'pcm', 'mp3', 'opus', 'aac', 'flac', 'wav'
            response = client.audio.speech.create(
                model=TTS_MODEL,
                voice=TTS_VOICE,
                input=chunk,
                response_format="wav",
            )
            wav_parts.append(response.read())
        result = _concat_wavs(wav_parts)
        if result:
            return result
    except Exception as api_err:
        import logging
        logging.getLogger("tts").warning(
            "OpenAI TTS failed (%s) — trying macOS 'say' fallback", api_err
        )

    # ── 2. macOS 'say' fallback ──────────────────────────────────────────────
    macos_wav = _macos_say_tts(text)
    if macos_wav:
        return macos_wav

    return b""
