"""
AI Answer Detection Service — heuristic, advisory-only detector.

Detects potential AI-generated or copy-pasted answers using purely local
heuristics (no external API calls). Results are ADVISORY ONLY and never
affect the candidate's score.

Signals used:
  1. Sentence length uniformity  — AI text has very uniform sentence lengths
  2. Vocabulary richness (TTR)   — AI text often repeats the same formal words
  3. First-person pronoun ratio  — genuine human answers use "I" naturally
  4. Filler/hedge phrase absence — humans use "I think", "basically", "like"
  5. AI opener patterns          — "Certainly!", "Great question!", "Of course!"
  6. Passive voice density       — formal AI text overuses passive constructions
  7. Bullet-point structure      — AI answers are often perfectly bullet-pointed
  8. Answer length anomaly       — instantly perfect 500-word answer for a 90s question

Each signal is weighted and combined into a single probability score [0.0–1.0].
"""

import re
import math
import statistics
from typing import List

# ── Constants ─────────────────────────────────────────────────────────────────

# Common AI opener patterns (case-insensitive)
AI_OPENER_PATTERNS = [
    r"^certainly\b",
    r"^great question\b",
    r"^of course\b",
    r"^absolutely\b",
    r"^sure thing\b",
    r"^i'd be happy to\b",
    r"^i would be happy to\b",
    r"^as an ai\b",
    r"^as a language model\b",
    r"^to answer your question\b",
    r"^thank you for (asking|the question)\b",
]

# Human filler words that signal authentic speech
HUMAN_FILLERS = [
    "um", "uh", "like", "basically", "you know", "so", "i think",
    "i believe", "i mean", "right", "actually", "kind of", "sort of",
    "i guess", "honestly", "to be honest", "i feel", "in my experience",
    "from my experience", "i've seen", "i've worked",
]

# Passive voice indicators
PASSIVE_PATTERNS = [
    r"\b(is|are|was|were|be|been|being)\s+\w+ed\b",
    r"\b(can be|could be|should be|would be|will be|has been|have been|had been)\b",
]

# Bullet/structure over-formality (AI loves numbered lists)
STRUCTURE_PATTERNS = [
    r"^\s*\d+\.\s+",          # "1. First point"
    r"^\s*[-•*]\s+",          # Bullet points
    r"\bfirstly\b",
    r"\bsecondly\b",
    r"\bthirdly\b",
    r"\bfurthermore\b",
    r"\badditionally\b",
    r"\bin conclusion\b",
    r"\bto summarize\b",
    r"\bin summary\b",
]

# ── Core Scorer ────────────────────────────────────────────────────────────────

def detect_ai_answer(
    answer: str,
    question_category: str = "Technical",
    expected_time_seconds: int = 90,
) -> dict:
    """
    Analyze an answer for AI-generation signals.

    Args:
        answer: The candidate's raw answer text
        question_category: "Behavioral", "Technical", "DSA", etc.
        expected_time_seconds: How long the candidate had to answer

    Returns:
        {
            ai_probability: float,  # 0.0 = definitely human, 1.0 = likely AI
            flags: list[str],       # human-readable flag descriptions
            breakdown: dict         # per-signal scores
        }
    """
    if not answer or len(answer.strip()) < 20:
        return {
            "ai_probability": 0.0,
            "flags": [],
            "breakdown": {},
        }

    text = answer.strip()
    lower = text.lower()
    flags: List[str] = []
    breakdown: dict = {}

    # ── Signal 1: AI opener patterns ─────────────────────────────────────────
    opener_score = 0.0
    for pattern in AI_OPENER_PATTERNS:
        if re.match(pattern, lower, re.IGNORECASE):
            opener_score = 1.0
            flags.append("Answer starts with a formulaic AI opener phrase")
            break
    breakdown["opener_pattern"] = opener_score

    # ── Signal 2: Sentence length uniformity ─────────────────────────────────
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 10]
    uniformity_score = 0.0
    if len(sentences) >= 3:
        lengths = [len(s.split()) for s in sentences]
        try:
            stdev = statistics.stdev(lengths)
            mean = statistics.mean(lengths)
            cv = stdev / mean if mean > 0 else 1.0  # coefficient of variation
            # Low CV (< 0.25) = uniform = suspicious
            uniformity_score = max(0.0, 1.0 - (cv / 0.25))
        except statistics.StatisticsError:
            uniformity_score = 0.0
        if uniformity_score > 0.6:
            flags.append("Unusually uniform sentence lengths (common in AI text)")
    breakdown["sentence_uniformity"] = round(uniformity_score, 3)

    # ── Signal 3: Type-Token Ratio (vocabulary richness) ─────────────────────
    words = re.findall(r'\b[a-z]+\b', lower)
    ttr_score = 0.0
    if len(words) >= 20:
        unique = len(set(words))
        ttr = unique / len(words)
        # Very high TTR (>0.75) combined with formal language = AI-like
        # Very low TTR (<0.4) = repetitive/poor = human but weak
        # We flag suspiciously high TTR in long answers
        if len(words) > 80 and ttr > 0.72:
            ttr_score = (ttr - 0.72) / 0.15  # scale 0.72–0.87 to 0–1
            ttr_score = min(1.0, ttr_score)
            if ttr_score > 0.5:
                flags.append("Unusually high vocabulary diversity for answer length")
    breakdown["vocabulary_ttr"] = round(ttr_score, 3)

    # ── Signal 4: First-person pronoun ratio ─────────────────────────────────
    first_person = len(re.findall(r"\b(i|i've|i'm|i'd|i'll|my|me|myself)\b", lower))
    fp_ratio = first_person / max(len(words), 1)
    # Very low first-person in behavioral questions is suspicious
    fp_score = 0.0
    if question_category == "Behavioral" and fp_ratio < 0.03 and len(words) > 50:
        fp_score = 0.7
        flags.append("Behavioral answer lacks first-person perspective (expected 'I', 'my', 'me')")
    breakdown["first_person_ratio"] = round(fp_score, 3)

    # ── Signal 5: Human filler absence ───────────────────────────────────────
    filler_count = sum(1 for f in HUMAN_FILLERS if f in lower)
    # Absence of any human markers in long answers is mildly suspicious
    filler_absence_score = 0.0
    if len(words) > 100 and filler_count == 0:
        filler_absence_score = 0.4
    breakdown["filler_absence"] = round(filler_absence_score, 3)

    # ── Signal 6: Passive voice density ──────────────────────────────────────
    passive_count = sum(
        len(re.findall(p, lower)) for p in PASSIVE_PATTERNS
    )
    passive_density = passive_count / max(len(sentences), 1)
    passive_score = min(1.0, passive_density / 3.0)
    if passive_score > 0.5:
        flags.append("High density of passive voice constructions")
    breakdown["passive_voice"] = round(passive_score, 3)

    # ── Signal 7: Over-structured bullet formatting ───────────────────────────
    structure_count = sum(
        1 for p in STRUCTURE_PATTERNS
        if re.search(p, text, re.MULTILINE | re.IGNORECASE)
    )
    structure_score = min(1.0, structure_count / 4.0)
    if structure_score > 0.5:
        flags.append("Answer is heavily structured with AI-style formatting markers")
    breakdown["over_structure"] = round(structure_score, 3)

    # ── Signal 8: Length anomaly ─────────────────────────────────────────────
    # ~130 words/min speaking rate. If answer is 3x what's achievable in time, suspicious.
    max_reasonable_words = (expected_time_seconds / 60.0) * 130 * 1.5
    length_anomaly = 0.0
    if len(words) > max_reasonable_words and max_reasonable_words > 0:
        ratio = len(words) / max_reasonable_words
        length_anomaly = min(1.0, (ratio - 1.0) / 2.0)
        if length_anomaly > 0.4:
            flags.append(f"Answer length ({len(words)} words) exceeds what could be typed/spoken in {expected_time_seconds}s")
    breakdown["length_anomaly"] = round(length_anomaly, 3)

    # ── Weighted combination ──────────────────────────────────────────────────
    weights = {
        "opener_pattern":    0.30,  # strongest signal
        "sentence_uniformity": 0.18,
        "vocabulary_ttr":    0.12,
        "first_person_ratio": 0.15,
        "filler_absence":    0.08,
        "passive_voice":     0.07,
        "over_structure":    0.05,
        "length_anomaly":    0.05,
    }
    ai_probability = sum(breakdown.get(k, 0.0) * w for k, w in weights.items())
    ai_probability = round(min(1.0, ai_probability), 3)

    return {
        "ai_probability": ai_probability,
        "flags": flags,
        "breakdown": breakdown,
    }
