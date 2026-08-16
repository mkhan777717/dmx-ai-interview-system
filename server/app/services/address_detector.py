"""
address_detector.py — Detects whether a spoken utterance is directly
addressing the AI avatar by name or a trigger phrase.

Two-pass detection:
  1. Fast heuristic (<1ms): name/phrase keyword scan.
  2. LLM fallback (only when ambiguous): gpt-4o-mini with strict YES/NO prompt.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import NamedTuple

# Avatar names used in the system (case-insensitive)
AVATAR_NAMES = {"alex", "sophia", "marcus", "ai", "hey ai"}

# Trigger phrases that almost always mean the AI is being addressed
TRIGGER_PHRASES = [
    r"\bwhat do you think\b",
    r"\bwhat's your (take|opinion|view|thought)\b",
    r"\bcan you (help|explain|tell|show|analyze|look at)\b",
    r"\bdo you (see|know|think|understand|agree)\b",
    r"\byour (opinion|thoughts|analysis|feedback)\b",
    r"\bhey (ai|alex|sophia|marcus)\b",
    r"\b(ai|alex|sophia|marcus)[,\s]+",   # "Alex, what do you..."
    r"^(ai|alex|sophia|marcus)\b",        # starts with avatar name
]

_TRIGGER_RE = re.compile(
    "|".join(TRIGGER_PHRASES),
    re.IGNORECASE | re.UNICODE,
)


@dataclass
class AddressResult:
    addressed: bool
    confidence: float   # 0.0 – 1.0
    trigger: str | None  # matched phrase or name


def detect_address(text: str) -> AddressResult:
    """
    Fast synchronous detection.  Returns immediately without any LLM call.
    Call `detect_address_async` for the LLM fallback path.
    """
    text = (text or "").strip()
    if not text:
        return AddressResult(addressed=False, confidence=0.0, trigger=None)

    lower = text.lower()

    # ── 1. Name check ─────────────────────────────────────────────────────
    for name in AVATAR_NAMES:
        if name in lower:
            return AddressResult(addressed=True, confidence=0.95, trigger=name)

    # ── 2. Trigger phrase check ───────────────────────────────────────────
    m = _TRIGGER_RE.search(text)
    if m:
        return AddressResult(addressed=True, confidence=0.80, trigger=m.group(0).strip())

    # ── 3. Question directed at 2nd person → ambiguous ────────────────────
    # "What do you recommend?" without a name — medium chance
    if re.search(r"\b(you|your)\b", lower) and text.endswith("?"):
        return AddressResult(addressed=False, confidence=0.35, trigger=None)

    return AddressResult(addressed=False, confidence=0.0, trigger=None)


async def detect_address_async(
    text: str,
    avatar_name: str = "Alex",
    timeout_s: float = 2.0,
) -> AddressResult:
    """
    Two-pass detection:
    1. Fast heuristic — if confidence ≥ 0.7 return immediately.
    2. LLM clarification — for 0.3 ≤ confidence < 0.7 only.
    Defaults to NOT addressed on timeout or error.
    """
    fast = detect_address(text)

    # High-confidence → skip LLM
    if fast.confidence >= 0.7:
        return fast

    # Clearly not addressed → skip LLM
    if fast.confidence < 0.3:
        return fast

    # Ambiguous → ask LLM
    try:
        import asyncio
        from app.services.openrouter_service import ask_ai
        prompt = (
            f'Is the following sentence directly addressing an AI assistant called {avatar_name}? '
            f'Reply with exactly one word: YES or NO.\n\nSentence: "{text}"'
        )
        answer = await asyncio.wait_for(
            ask_ai([{"role": "user", "content": prompt}]),
            timeout=timeout_s,
        )
        addressed = answer.strip().upper().startswith("YES")
        return AddressResult(
            addressed=addressed,
            confidence=0.85 if addressed else 0.15,
            trigger="llm" if addressed else None,
        )
    except Exception:
        # On any failure: don't trigger — return the fast result as-is
        return fast
