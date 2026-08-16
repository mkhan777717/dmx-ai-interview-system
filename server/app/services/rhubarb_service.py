"""
rhubarb_service.py — Rhubarb Lip Sync CLI integration
Converts WAV audio + dialog text → list of mouth-cue visemes.
"""

from __future__ import annotations

import json
import os
import platform
import subprocess
import tempfile
from pathlib import Path
from typing import Any

# ── Binary resolution ──────────────────────────────────────────────────────────
_SERVER_ROOT = Path(__file__).parent.parent.parent          # server/
_BIN_DIR     = _SERVER_ROOT / "bin"

def _get_rhubarb_binary() -> Path:
    """Return path to the platform-appropriate Rhubarb binary."""
    system = platform.system().lower()
    if system == "darwin":
        candidates = [_BIN_DIR / "rhubarb", _BIN_DIR / "rhubarb-macos"]
    elif system == "linux":
        candidates = [_BIN_DIR / "rhubarb", _BIN_DIR / "rhubarb-linux"]
    else:
        candidates = [_BIN_DIR / "rhubarb.exe", _BIN_DIR / "rhubarb"]

    # Also accept a system-wide installation
    import shutil
    sys_rhubarb = shutil.which("rhubarb")
    if sys_rhubarb:
        candidates.insert(0, Path(sys_rhubarb))

    for p in candidates:
        if p.exists() and os.access(p, os.X_OK):
            return p

    raise FileNotFoundError(
        f"Rhubarb binary not found. Expected one of: {[str(c) for c in candidates]}. "
        "Run server/scripts/setup_rhubarb.sh to install it."
    )


# ── Rhubarb → VRM expression name mapping ──────────────────────────────────────
# Rhubarb mouth shapes A-X map to @pixiv/three-vrm standard expression names
VISEME_MAP: dict[str, str] = {
    "A": "aa",       # Open vowel (e.g. "bad")
    "B": "oh",       # Rounded bilabial (e.g. "boom")
    "C": "ih",       # Unrounded mid (e.g. "bit")
    "D": "ou",       # Rounded, lips forward (e.g. "boot")
    "E": "ih",       # Tense vowel (e.g. "bee")
    "F": "ff",       # Labiodental fricative (f/v)
    "G": "oh",       # Velar (k/g)
    "H": "aa",       # Laryngeal / open (h)
    "X": "neutral",  # Silence / rest
}


def get_visemes(wav_bytes: bytes, dialog_text: str = "") -> list[dict[str, Any]]:
    """
    Run Rhubarb against WAV bytes and return list of mouth cues:
    [{"start": float, "end": float, "value": str, "vrm_shape": str}, ...]

    Falls back to [] (silent viseme list) on any error so the interview
    continues without lip sync rather than raising.
    """
    if not wav_bytes:
        return []

    try:
        rhubarb = _get_rhubarb_binary()
    except FileNotFoundError as exc:
        _log_warn(f"Rhubarb not available: {exc}")
        return []

    with tempfile.TemporaryDirectory() as tmpdir:
        wav_path    = os.path.join(tmpdir, "speech.wav")
        dialog_path = os.path.join(tmpdir, "dialog.txt")
        out_path    = os.path.join(tmpdir, "cues.json")

        with open(wav_path, "wb") as f:
            f.write(wav_bytes)

        if dialog_text:
            with open(dialog_path, "w", encoding="utf-8") as f:
                f.write(dialog_text.strip())

        cmd = [
            str(rhubarb),
            "-f", "json",                # export format
            "-r", "pocketSphinx",        # accurate English phoneme recognizer
            "--extendedShapes", "GHX",   # G (velar), H (laryngeal), X (silence)
            "-o", out_path,
        ]
        if dialog_text:
            cmd += ["-d", dialog_path]
        cmd.append(wav_path)

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=30,          # 30-second hard limit
                text=True,
            )
        except subprocess.TimeoutExpired:
            _log_warn("Rhubarb timed out after 30 s — returning empty visemes")
            return []
        except Exception as exc:
            _log_warn(f"Rhubarb subprocess error: {exc}")
            return []

        if result.returncode != 0:
            _log_warn(
                f"Rhubarb exit {result.returncode}: {result.stderr[:300]}"
            )
            return []

        try:
            with open(out_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError) as exc:
            _log_warn(f"Rhubarb JSON parse error: {exc}")
            return []

    cues: list[dict[str, Any]] = []
    for cue in data.get("mouthCues", []):
        rh_value  = cue.get("value", "X")
        vrm_shape = VISEME_MAP.get(rh_value, "neutral")
        cues.append({
            "start":     float(cue.get("start", 0)),
            "end":       float(cue.get("end", 0)),
            "value":     rh_value,
            "vrm_shape": vrm_shape,
        })

    return cues


def _log_warn(msg: str) -> None:
    """Emit a simple warning without crashing the request."""
    import logging
    logging.getLogger("rhubarb_service").warning(msg)
