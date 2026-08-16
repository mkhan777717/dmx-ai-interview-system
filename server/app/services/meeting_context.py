"""
meeting_context.py — Per-session rolling conversation buffer
Maintains the last N utterances from all participants so the LLM
always has full meeting context when answering questions.
"""

from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass, field
from typing import Deque

MAX_CONTEXT_MESSAGES = 32


@dataclass
class Utterance:
    speaker: str          # "candidate", "ai", "interviewer", "other"
    text: str
    timestamp: float = field(default_factory=time.time)

    def age_seconds(self) -> float:
        return time.time() - self.timestamp

    def to_dict(self) -> dict:
        return {
            "speaker":   self.speaker,
            "text":      self.text,
            "timestamp": self.timestamp,
        }


class ConversationBuffer:
    """
    Thread-safe rolling buffer of the last MAX_CONTEXT_MESSAGES utterances.
    One instance per meeting session.
    """

    def __init__(self, session_id: str, maxlen: int = MAX_CONTEXT_MESSAGES):
        self.session_id = session_id
        self._buffer: Deque[Utterance] = deque(maxlen=maxlen)

    def add(self, speaker: str, text: str) -> None:
        text = (text or "").strip()
        if text:
            self._buffer.append(Utterance(speaker=speaker, text=text))

    def get_context_prompt(self) -> str:
        """Format buffer as a numbered transcript for LLM system prompt injection."""
        if not self._buffer:
            return "(No conversation yet)"
        lines = []
        for i, u in enumerate(self._buffer, 1):
            age = u.age_seconds()
            age_str = f"{int(age)}s ago" if age < 60 else f"{int(age/60)}m ago"
            lines.append(f"[{i}] {u.speaker.upper()} ({age_str}): {u.text}")
        return "\n".join(lines)

    def get_all(self) -> list[dict]:
        return [u.to_dict() for u in self._buffer]

    def __len__(self) -> int:
        return len(self._buffer)


# ── Session registry ──────────────────────────────────────────────────────────
# Keeps one ConversationBuffer per active WebSocket session_id.
_sessions: dict[str, ConversationBuffer] = {}


def get_or_create_session(session_id: str) -> ConversationBuffer:
    if session_id not in _sessions:
        _sessions[session_id] = ConversationBuffer(session_id)
    return _sessions[session_id]


def remove_session(session_id: str) -> None:
    _sessions.pop(session_id, None)


def list_sessions() -> list[str]:
    return list(_sessions.keys())
