"""
Evaluator Service — scores candidate answers using three signals:
  1. Semantic similarity vs reference answer      (weight: rubric-defined, default 50%)
  2. Concept coverage of evaluation points        (weight: rubric-defined, default 35%)
  3. Keyword presence                             (weight: rubric-defined, default 15%)

Also computes:
  - confidence: how certain the scorer is (0.0–1.0)
  - justification: human-readable quote from the answer justifying the score
  - feedback: optionally LLM-enhanced, falls back to template
"""

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
import statistics
import httpx
from typing import List, Optional
from app.config.settings import settings

MODEL_NAME = "all-MiniLM-L6-v2"
_model = None

# Threshold for considering a concept "covered"
CONCEPT_SIMILARITY_THRESHOLD = 0.45


def _get_model() -> SentenceTransformer:
    """Load model once and cache it (takes ~3s on first call)."""
    global _model
    if _model is None:
        print(f"Loading Sentence Transformer ({MODEL_NAME})...")
        _model = SentenceTransformer(MODEL_NAME)
        print("Sentence Transformer loaded ✅")
    return _model


def evaluate_answer(
    candidate_answer: str,
    reference_answer: str,
    evaluation_points: List[str],
    keywords: List[str],
    weights: Optional[dict] = None,
    **kwargs,
) -> dict:
    """
    Score a candidate's answer using three signals.

    Args:
        candidate_answer: The candidate's response text
        reference_answer: The ideal/reference answer
        evaluation_points: Key concepts that should be covered
        keywords: Domain-specific keywords that should appear
        weights: Optional rubric weights dict with keys semantic, concept, keyword.
                 Defaults to {semantic: 0.50, concept: 0.35, keyword: 0.15}

    Returns:
        dict with scores, covered/missing concepts, confidence, justification, feedback.
        Final score is on a 0–10 scale.
    """
    # ── Default weights ───────────────────────────────────────────────────────
    w = weights or {"semantic": 0.50, "concept": 0.35, "keyword": 0.15}

    # ── Empty answer ──────────────────────────────────────────────────────────
    if not candidate_answer or not candidate_answer.strip():
        return {
            "semantic_score": 0.0,
            "concept_score": 0.0,
            "keyword_score": 0.0,
            "communication_score": 0.0,
            "communication_breakdown": {},
            "final_score": 0.0,
            "covered_concepts": [],
            "missing_concepts": evaluation_points or [],
            "confidence": 0.0,
            "justification": "No answer was provided.",
            "feedback": "No answer was provided.",
        }

    model = _get_model()
    answer = candidate_answer.strip()

    # ── 1. Semantic similarity ────────────────────────────────────────────────
    embeddings = model.encode([answer, reference_answer])
    semantic_score = float(
        cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    )
    semantic_score = max(0.0, min(1.0, semantic_score))

    # ── 2. Concept coverage ───────────────────────────────────────────────────
    covered_concepts: List[str] = []
    missing_concepts: List[str] = []

    if evaluation_points:
        answer_emb = model.encode([answer])
        point_embs = model.encode(evaluation_points)
        answer_lower = answer.lower()
        for i, point in enumerate(evaluation_points):
            sim = float(cosine_similarity(answer_emb, [point_embs[i]])[0][0])
            point_words = [
                w_ for w_ in point.lower().split()
                if len(w_) > 3
            ]
            keyword_hit = bool(point_words) and any(
                w_ in answer_lower for w_ in point_words
            )
            if sim >= CONCEPT_SIMILARITY_THRESHOLD or keyword_hit:
                covered_concepts.append(point)
            else:
                missing_concepts.append(point)
        concept_score = len(covered_concepts) / len(evaluation_points)
    else:
        concept_score = semantic_score

    # ── 3. Keyword presence ───────────────────────────────────────────────────
    if keywords:
        answer_lower_kw = answer.lower()
        found = sum(1 for kw in keywords if kw.lower() in answer_lower_kw)
        keyword_score = found / len(keywords)
    else:
        keyword_score = semantic_score

    # ── 4. Communication quality ──────────────────────────────────────────────
    comm_result = _score_communication_quality(
        answer=answer,
        category=kwargs.get("category", "Technical"),
        expected_time_seconds=kwargs.get("expected_time_seconds", 90),
    )
    communication_score = comm_result["score"]
    communication_breakdown = comm_result["breakdown"]

    # ── Weighted final score (0–10) ───────────────────────────────────────────
    # If rubric includes a communication weight, use it; otherwise blend at 15%
    comm_weight = w.get("communication", 0.15)
    # Re-normalise the other three weights to fill (1 - comm_weight)
    other_sum = w["semantic"] + w["concept"] + w["keyword"]
    scale = (1.0 - comm_weight) / other_sum if other_sum > 0 else 1.0
    raw = (
        semantic_score  * w["semantic"]  * scale
        + concept_score   * w["concept"]   * scale
        + keyword_score   * w["keyword"]   * scale
        + communication_score * comm_weight
    )
    final_score = round(raw * 10, 2)

    # ── Confidence ───────────────────────────────────────────────────────────
    confidence = _compute_confidence(semantic_score, concept_score, evaluation_points)

    # ── Justification ─────────────────────────────────────────────────────────
    justification = _build_justification(
        answer, covered_concepts, missing_concepts, final_score
    )

    # ── Feedback (template) ───────────────────────────────────────────────────
    feedback = _generate_feedback(final_score, covered_concepts, missing_concepts)

    return {
        "semantic_score": round(semantic_score, 3),
        "concept_score": round(concept_score, 3),
        "keyword_score": round(keyword_score, 3),
        "communication_score": round(communication_score, 3),
        "communication_breakdown": communication_breakdown,
        "final_score": final_score,
        "covered_concepts": covered_concepts,
        "missing_concepts": missing_concepts,
        "confidence": round(confidence, 3),
        "justification": justification,
        "feedback": feedback,
    }


def _compute_confidence(
    semantic_score: float,
    concept_score: float,
    evaluation_points: List[str],
) -> float:
    """
    Compute how confident the evaluator is in the score.

    High confidence when:
      - Semantic score is decisive (very high or very low, not 0.4–0.6 ambiguous range)
      - Concept coverage is unambiguous (all covered or none)
      - Sufficient evaluation points exist for a meaningful assessment
    """
    # Ambiguity penalty: scores near 0.5 are ambiguous
    semantic_ambiguity = 1.0 - abs(semantic_score - 0.5) * 2  # peaks at 0.5
    concept_ambiguity = 1.0 - abs(concept_score - 0.5) * 2

    # Data richness: more evaluation points = more reliable
    richness = min(1.0, len(evaluation_points) / 5.0) if evaluation_points else 0.5

    # Confidence = 1 - average ambiguity, weighted by richness
    avg_ambiguity = (semantic_ambiguity + concept_ambiguity) / 2
    confidence = (1.0 - avg_ambiguity) * 0.6 + richness * 0.4

    return max(0.0, min(1.0, confidence))


def _build_justification(
    answer: str,
    covered: List[str],
    missing: List[str],
    score: float,
) -> str:
    """
    Build a human-readable justification quoting/referencing the candidate's answer.
    """
    # Extract a meaningful fragment from the answer (first 200 chars)
    fragment = answer[:200].strip()
    if len(answer) > 200:
        fragment += "..."

    if score >= 8.0:
        justification = f'Answer demonstrates strong understanding: "{fragment}"'
        if covered:
            justification += f" Key concepts covered: {', '.join(covered[:3])}."
    elif score >= 6.0:
        justification = f'Answer shows good grasp of the topic: "{fragment}"'
        if missing:
            justification += f" Could be strengthened by addressing: {', '.join(missing[:2])}."
    elif score >= 4.0:
        justification = f'Partial answer provided: "{fragment}"'
        if missing:
            justification += f" Missing key concepts: {', '.join(missing[:3])}."
    else:
        justification = f'Answer does not adequately address the question: "{fragment}"'
        if missing:
            justification += f" Expected concepts not mentioned: {', '.join(missing[:3])}."

    return justification


def _generate_feedback(
    score: float,
    covered: List[str],
    missing: List[str],
) -> str:
    """Generate a short, human-readable feedback string."""
    if score >= 8.0:
        base = "Excellent — covered all key concepts clearly."
    elif score >= 6.5:
        base = "Good answer with solid understanding."
    elif score >= 5.0:
        base = "Partial answer — some correct points but incomplete."
    elif score >= 3.0:
        base = "Weak answer — missing several core concepts."
    else:
        base = "Answer does not adequately address the question."

    if missing:
        missed_str = ", ".join(missing[:2])
        base += f" Missing: {missed_str}."

    return base


# ── Communication Quality Scorer ──────────────────────────────────────────────

_FILLER_WORDS = [
    r"\bum\b", r"\buh\b", r"\blike\b", r"\bbasically\b",
    r"\byou know\b", r"\bso\b", r"\bactually\b", r"\bkind of\b",
    r"\bsort of\b", r"\bi guess\b", r"\bhonestly\b",
    r"\bjust\b", r"\breally\b", r"\bvery\b",
]

_STRUCTURE_MARKERS = [
    r"first(ly)?\b", r"second(ly)?\b", r"third(ly)?\b",
    r"\bin conclusion\b", r"\bto summarize\b",
    r"\bfor example\b", r"\bfor instance\b", r"\bsuch as\b",
    r"\btherefore\b", r"\bhowever\b", r"\bmoreover\b",
]


def _score_communication_quality(
    answer: str,
    category: str = "Technical",
    expected_time_seconds: int = 90,
) -> dict:
    """
    Compute communication quality sub-scores.

    Returns:
        { score: float 0-1, breakdown: { length, structure, vocabulary, filler } }
    """
    words = answer.split()
    word_count = len(words)
    lower = answer.lower()

    if word_count < 5:
        return {"score": 0.0, "breakdown": {}}

    # ── Length adequacy ───────────────────────────────────────────────────────
    # Expected words: ~2 words/second of answer time (conservative typing/speech)
    expected_min = int(expected_time_seconds * 0.8)
    expected_max = int(expected_time_seconds * 2.5)
    if word_count < expected_min:
        length_score = max(0.2, word_count / expected_min)
    elif word_count > expected_max:
        length_score = max(0.5, 1.0 - (word_count - expected_max) / expected_max)
    else:
        length_score = 1.0

    # ── Structural markers ────────────────────────────────────────────────────
    marker_count = sum(
        1 for p in _STRUCTURE_MARKERS
        if re.search(p, lower)
    )
    structure_score = min(1.0, 0.4 + (marker_count * 0.15))

    # ── Vocabulary richness (Type-Token Ratio, normalized) ────────────────────
    clean_words = [w.strip(".,!?;:") for w in words if len(w) > 2]
    if clean_words:
        ttr = len(set(clean_words)) / len(clean_words)
        # Scale: TTR 0.3 → score 0.3, TTR 0.7 → score 1.0
        vocabulary_score = min(1.0, max(0.0, (ttr - 0.3) / 0.4))
    else:
        vocabulary_score = 0.0

    # ── Filler word rate ──────────────────────────────────────────────────────
    filler_count = sum(
        len(re.findall(p, lower)) for p in _FILLER_WORDS
    )
    filler_rate = filler_count / max(word_count, 1) * 100  # per 100 words
    # Score: 0 fillers → 1.0, 15+ per 100 words → 0.0
    filler_score = max(0.0, 1.0 - filler_rate / 15.0)

    # ── Weighted combination ──────────────────────────────────────────────────
    score = (
        length_score    * 0.30
        + structure_score * 0.25
        + vocabulary_score * 0.25
        + filler_score    * 0.20
    )

    return {
        "score": round(min(1.0, score), 3),
        "breakdown": {
            "length": round(length_score, 3),
            "structure": round(structure_score, 3),
            "vocabulary": round(vocabulary_score, 3),
            "filler": round(filler_score, 3),
        },
    }


async def generate_llm_feedback(
    question: str,
    candidate_answer: str,
    score: float,
    missing_concepts: List[str],
) -> Optional[str]:
    """
    Generate personalized LLM feedback for the candidate's answer.
    Returns None on failure — caller should fall back to template feedback.

    Called asynchronously with a timeout to avoid blocking the response.
    """
    missing_text = ", ".join(missing_concepts[:3]) if missing_concepts else "none identified"
    score_band = (
        "excellent (8-10)" if score >= 8.0
        else "good (6.5-8)" if score >= 6.5
        else "partial (5-6.5)" if score >= 5.0
        else "weak (3-5)" if score >= 3.0
        else "very weak (below 3)"
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a senior technical interviewer. "
                "Write 2 sentences of personalized feedback for a candidate's interview answer. "
                "Be specific, constructive, and reference their actual response. "
                "Start with what they did well, then suggest one specific improvement. "
                "Keep it under 60 words. Plain text only — no bullet points or headers."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Question: {question}\n"
                f"Candidate's answer: {candidate_answer[:500]}\n"
                f"Score band: {score_band}\n"
                f"Missing concepts: {missing_text}"
            ),
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json={"model": "openai/gpt-4o-mini", "messages": messages},
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        print(f"LLM feedback generation error: {e}")
        return None
