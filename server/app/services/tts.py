import io
import os
import platform
import re
import subprocess
import tempfile
import wave
from typing import Optional

from openai import OpenAI
from app.config.settings import settings

# OpenAI TTS Configuration
TTS_MODEL = "tts-1"
MAX_CHARS = 4096  # OpenAI TTS limit per request

# Persona to voice mapping
PERSONA_VOICE_MAP = {
    "alex": {
        "openai_voice": "echo",     # Crisp, technical male voice
        "macos_voice": "Alex",      # Built-in macOS male voice
    },
    "marcus": {
        "openai_voice": "onyx",     # Deep, authoritative executive male voice
        "macos_voice": "Daniel",    # Built-in macOS male voice
    },
    "sophia": {
        "openai_voice": "nova",     # Natural, clear, empathetic female voice
        "macos_voice": "Samantha",  # Built-in macOS female voice
    },
}

_openai_client = None


def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        api_key = settings.OPENAI_API_KEY.strip()
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY not set. Add it to server/.env and restart the server."
            )
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


def _chunk_text(text: str, max_len: int = MAX_CHARS) -> list[str]:
    """Split text into chunks <= max_len, preferring sentence boundaries."""
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

    if params is None:
        return b""

    with wave.open(output, "wb") as dst:
        dst.setparams(params)
        for frame in frames:
            dst.writeframes(frame)

    return output.getvalue()


def _macos_say_tts(text: str, macos_voice: str = "Samantha") -> bytes:
    """
    macOS-only fallback: system 'say' + 'afconvert' -> WAV bytes.
    Respects selected gender/persona voice.
    """
    if platform.system() != "Darwin":
        return b""
    with tempfile.TemporaryDirectory() as tmpdir:
        aiff_path = os.path.join(tmpdir, "speech.aiff")
        wav_path = os.path.join(tmpdir, "speech.wav")
        r1 = subprocess.run(
            ["say", "-v", macos_voice, "-r", "150", "-o", aiff_path, text],
            capture_output=True,
            timeout=20,
        )
        if r1.returncode != 0:
            # Fallback to default voice if specific voice isn't installed
            r1 = subprocess.run(
                ["say", "-r", "150", "-o", aiff_path, text],
                capture_output=True,
                timeout=20,
            )
            if r1.returncode != 0:
                return b""

        # 22050 Hz, 1 channel (mono), 16-bit PCM
        r2 = subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", "LEI16@22050", "-c", "1", aiff_path, wav_path],
            capture_output=True,
            timeout=10,
        )
        if r2.returncode != 0:
            return b""
        with open(wav_path, "rb") as f:
            return f.read()


def speak_text(
    text: str,
    voice: Optional[str] = None,
    gender: Optional[str] = None,
    persona: Optional[str] = None,
) -> bytes:
    """
    Generate natural WAV audio from text.
    Accurately matches male voice for male personas (Alex, Marcus) and female voice for female personas (Sophia).
    """
    text = (text or "").strip()
    if not text:
        return b""

    # Resolve target voice based on persona and gender
    persona_key = (persona or "").lower().strip()
    gender_key = (gender or "").lower().strip()

    if persona_key in PERSONA_VOICE_MAP:
        selected_openai_voice = PERSONA_VOICE_MAP[persona_key]["openai_voice"]
        selected_macos_voice = PERSONA_VOICE_MAP[persona_key]["macos_voice"]
    elif gender_key == "female":
        selected_openai_voice = "nova"
        selected_macos_voice = "Samantha"
    elif gender_key == "male":
        selected_openai_voice = "echo"
        selected_macos_voice = "Alex"
    else:
        selected_openai_voice = voice or "echo"
        selected_macos_voice = "Alex"

    if voice:
        selected_openai_voice = voice

    # ── 1. Try OpenAI TTS ──────────────────────────────────────────────
    try:
        client = get_openai_client()
        wav_parts: list[bytes] = []
        for chunk in _chunk_text(text):
            response = client.audio.speech.create(
                model=TTS_MODEL,
                voice=selected_openai_voice,
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
            "OpenAI TTS failed (%s) — trying macOS 'say' fallback with voice '%s'",
            api_err,
            selected_macos_voice,
        )

    # ── 2. macOS 'say' fallback with appropriate gender ───────────────
    macos_wav = _macos_say_tts(text, macos_voice=selected_macos_voice)
    if macos_wav:
        return macos_wav

    return b""
