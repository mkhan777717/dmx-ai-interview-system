from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List

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
) -> dict:
    """
    Score a candidate's answer using three signals:
      1. Semantic similarity vs reference_answer       (50%)
      2. Concept coverage of evaluation_points         (35%)
      3. Keyword presence                              (15%)

    Returns a dict with scores, covered/missing concepts, and feedback.
    Final score is on a 0–10 scale.
    """
    # ── Empty answer ──────────────────────────────────────────────────────────
    if not candidate_answer or not candidate_answer.strip():
        return {
            "semantic_score": 0.0,
            "concept_score": 0.0,
            "keyword_score": 0.0,
            "final_score": 0.0,
            "covered_concepts": [],
            "missing_concepts": evaluation_points or [],
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
            # Method 1: semantic similarity
            sim = float(cosine_similarity(answer_emb, [point_embs[i]])[0][0])
            # Method 2: keyword fallback — if significant words from the
            # concept name appear directly in the answer, count it as covered
            # (handles short concept names like "Dynamic Dispatch Mechanism")
            point_words = [
                w for w in point.lower().split()
                if len(w) > 3  # ignore stop words like "of", "the", "vs"
            ]
            keyword_hit = bool(point_words) and any(
                w in answer_lower for w in point_words
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
        answer_lower = answer.lower()
        found = sum(1 for kw in keywords if kw.lower() in answer_lower)
        keyword_score = found / len(keywords)
    else:
        keyword_score = semantic_score

    # ── Weighted final score (0–10) ───────────────────────────────────────────
    raw = (semantic_score * 0.50) + (concept_score * 0.35) + (keyword_score * 0.15)
    final_score = round(raw * 10, 2)

    feedback = _generate_feedback(final_score, covered_concepts, missing_concepts)

    return {
        "semantic_score": round(semantic_score, 3),
        "concept_score": round(concept_score, 3),
        "keyword_score": round(keyword_score, 3),
        "final_score": final_score,
        "covered_concepts": covered_concepts,
        "missing_concepts": missing_concepts,
        "feedback": feedback,
    }


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
