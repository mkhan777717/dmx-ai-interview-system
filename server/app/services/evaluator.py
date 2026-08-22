"""
Evaluator Service — Advanced Multi-Stage Interview Answer Evaluator

Scoring Methodology:
  1. LLM-Powered Multi-Dimensional Rubric Evaluator (Primary when available)
     - Technical Accuracy & Depth (0-10)
     - Core Concept Coverage (0-10)
     - Communication Clarity, Structure, & Articulation (0-10)
     - Code / Algorithm Correctness & Complexity (when code is present)
  2. Calibrated Semantic & Heuristic Scorer (Deterministic Fallback / Calibration Signal)
     - Non-linear calibrated Sentence-Transformer similarity vs reference answer
     - Sentence-level concept coverage matching
     - Communication quality analysis (filler words, length adequacy, structural signposts, vocabulary richness)
     - Keyword presence & domain terminology verification
"""

import json
import re
import asyncio
import httpx
from typing import List, Optional, Dict, Any, cast
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from app.config.settings import settings

MODEL_NAME = "all-MiniLM-L6-v2"
_model = None

# Threshold for considering a concept "covered" in semantic fallback
CONCEPT_SIMILARITY_THRESHOLD = 0.48


def _get_model() -> Optional[SentenceTransformer]:
    """Load SentenceTransformer model once and cache it."""
    global _model
    if _model is None:
        try:
            print(f"Loading Sentence Transformer ({MODEL_NAME})...")
            _model = SentenceTransformer(MODEL_NAME)
            print("Sentence Transformer loaded ✅")
        except Exception as e:
            print(f"Warning: SentenceTransformer load error: {e}")
            _model = None
    return _model


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
    r"\btrade-?offs?\b", r"\bon the other hand\b",
]


def _score_communication_quality(
    answer: str,
    category: str = "Technical",
    expected_time_seconds: int = 90,
) -> dict:
    """
    Compute communication quality sub-scores.
    Returns { score: float 0-1, breakdown: { length, structure, vocabulary, filler } }
    """
    words = answer.split()
    word_count = len(words)
    lower = answer.lower()

    if word_count < 4:
        return {
            "score": 0.1,
            "breakdown": {"length": 0.1, "structure": 0.1, "vocabulary": 0.1, "filler": 0.5},
        }

    # 1. Length adequacy (Expected ~1.5 - 2.5 words/sec)
    expected_min = max(15, int(expected_time_seconds * 0.6))
    expected_max = max(120, int(expected_time_seconds * 2.8))

    if word_count < expected_min:
        length_score = max(0.2, word_count / expected_min)
    elif word_count > expected_max:
        length_score = max(0.6, 1.0 - ((word_count - expected_max) / (expected_max * 1.5)))
    else:
        length_score = 1.0

    # 2. Structural signposts
    marker_count = sum(1 for p in _STRUCTURE_MARKERS if re.search(p, lower))
    structure_score = min(1.0, 0.4 + (marker_count * 0.18))

    # 3. Vocabulary richness (Type-Token Ratio)
    clean_words = [w.strip(".,!?;:()[]{}'\"") for w in words if len(w) > 2]
    if clean_words:
        ttr = len(set(clean_words)) / len(clean_words)
        vocabulary_score = min(1.0, max(0.1, (ttr - 0.25) / 0.45))
    else:
        vocabulary_score = 0.2

    # 4. Filler words penalty
    filler_count = sum(len(re.findall(p, lower)) for p in _FILLER_WORDS)
    filler_rate = (filler_count / max(word_count, 1)) * 100
    filler_score = max(0.1, 1.0 - (filler_rate / 12.0))

    combined = (
        length_score * 0.30
        + structure_score * 0.25
        + vocabulary_score * 0.25
        + filler_score * 0.20
    )

    return {
        "score": round(min(1.0, max(0.0, combined)), 3),
        "breakdown": {
            "length": round(length_score, 2),
            "structure": round(structure_score, 2),
            "vocabulary": round(vocabulary_score, 2),
            "filler": round(filler_score, 2),
        },
    }


# ── Calibrated Semantic + Heuristic Fallback Scorer ────────────────────────────

def evaluate_answer_heuristic(
    candidate_answer: str,
    reference_answer: str,
    evaluation_points: List[str],
    keywords: List[str],
    weights: Optional[dict] = None,
    category: str = "Technical",
    expected_time_seconds: int = 90,
) -> dict:
    """
    High-accuracy deterministic fallback evaluator using non-linear calibrated
    sentence embeddings and concept matching.
    """
    w = weights or {"semantic": 0.45, "concept": 0.35, "keyword": 0.10, "communication": 0.10}

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
            "justification": "No answer was provided by the candidate.",
            "feedback": "No answer was submitted for this question.",
        }

    answer = candidate_answer.strip()
    model = _get_model()

    # 1. Calibrated Semantic Similarity
    if model is not None and reference_answer:
        raw_embs = model.encode([answer, reference_answer])
        embeddings = np.asarray(raw_embs, dtype=np.float32)
        raw_sim = float(cosine_similarity(cast(Any, embeddings[0:1]), cast(Any, embeddings[1:2]))[0][0])
        # Non-linear scaling: raw cosine between 0.30 and 0.85 mapped smoothly to 0.0–1.0
        calibrated_semantic = max(0.0, min(1.0, (raw_sim - 0.25) / 0.55))
    else:
        # Fallback word overlap if embedding model is not present
        ans_words = set(re.findall(r"\w+", answer.lower()))
        ref_words = set(re.findall(r"\w+", (reference_answer or "").lower()))
        overlap = len(ans_words & ref_words) / max(len(ref_words), 1)
        calibrated_semantic = min(1.0, overlap * 1.5)

    # 2. Concept Coverage
    covered_concepts: List[str] = []
    missing_concepts: List[str] = []

    if evaluation_points:
        answer_lower = answer.lower()
        if model is not None:
            # Segment answer into sentences for better localized matching
            sentences = [s.strip() for s in re.split(r"[.!?\n]+", answer) if len(s.strip()) > 10]
            if not sentences:
                sentences = [answer]

            sent_embs = np.asarray(model.encode(sentences), dtype=np.float32)
            point_embs = np.asarray(model.encode(evaluation_points), dtype=np.float32)

            for i, point in enumerate(evaluation_points):
                # Check maximum similarity across any sentence
                sims = [
                    float(cosine_similarity(cast(Any, sent_embs[s_idx:s_idx+1]), cast(Any, point_embs[i:i+1]))[0][0])
                    for s_idx in range(len(sentences))
                ]
                max_sim = max(sims) if sims else 0.0

                point_words = [w for w in point.lower().split() if len(w) > 3]
                kw_hit = point_words and any(w in answer_lower for w in point_words)

                if max_sim >= CONCEPT_SIMILARITY_THRESHOLD or (max_sim >= 0.40 and kw_hit):
                    covered_concepts.append(point)
                else:
                    missing_concepts.append(point)
        else:
            for point in evaluation_points:
                point_words = [w for w in point.lower().split() if len(w) > 3]
                if any(w in answer_lower for w in point_words):
                    covered_concepts.append(point)
                else:
                    missing_concepts.append(point)

        concept_score = len(covered_concepts) / len(evaluation_points)
    else:
        concept_score = calibrated_semantic

    # 3. Keyword Presence
    if keywords:
        ans_lower = answer.lower()
        found_kw = sum(1 for kw in keywords if kw.lower() in ans_lower)
        keyword_score = found_kw / len(keywords)
    else:
        keyword_score = calibrated_semantic

    # 4. Communication Quality
    comm_result = _score_communication_quality(
        answer=answer,
        category=category,
        expected_time_seconds=expected_time_seconds,
    )
    communication_score = comm_result["score"]

    # 5. Composite Final Score (0–10)
    w_sem = w.get("semantic", 0.45)
    w_con = w.get("concept", 0.35)
    w_kw = w.get("keyword", 0.10)
    w_comm = w.get("communication", 0.10)
    tot_w = w_sem + w_con + w_kw + w_comm

    raw_composite = (
        (calibrated_semantic * w_sem)
        + (concept_score * w_con)
        + (keyword_score * w_kw)
        + (communication_score * w_comm)
    ) / max(tot_w, 0.01)

    final_score = round(raw_composite * 10.0, 1)

    # 6. Confidence & Justification
    confidence = round(
        min(1.0, 0.65 + (len(covered_concepts) * 0.08) if evaluation_points else 0.75),
        2,
    )


    frag = answer[:160].strip()
    if len(answer) > 160:
        frag += "..."

    if final_score >= 8.0:
        justification = f'Demonstrated solid command: "{frag}". Covered key concepts clearly.'
        feedback = f"Great response! Covered {len(covered_concepts)} core concepts with strong clarity."
    elif final_score >= 6.0:
        justification = f'Good grasp of fundamentals: "{frag}".'
        missed = f" Consider diving deeper into {missing_concepts[0]}." if missing_concepts else ""
        feedback = f"Solid answer.{missed}"
    elif final_score >= 4.0:
        justification = f'Partial explanation provided: "{frag}".'
        missed = f" Missing key aspects such as {', '.join(missing_concepts[:2])}." if missing_concepts else ""
        feedback = f"Partial response.{missed}"
    else:
        justification = f'Answer lacks depth or does not address the core question: "{frag}".'
        feedback = "Answer needs more technical detail and structured reasoning."

    return {
        "semantic_score": round(calibrated_semantic, 3),
        "concept_score": round(concept_score, 3),
        "keyword_score": round(keyword_score, 3),
        "communication_score": round(communication_score, 3),
        "communication_breakdown": comm_result["breakdown"],
        "final_score": final_score,
        "covered_concepts": covered_concepts,
        "missing_concepts": missing_concepts,
        "confidence": confidence,
        "justification": justification,
        "feedback": feedback,
    }


# ── LLM Multi-Dimensional Evaluator (Primary) ─────────────────────────────────

async def evaluate_answer_with_llm(
    question: str,
    candidate_answer: str,
    reference_answer: str,
    evaluation_points: List[str],
    keywords: List[str],
    category: str = "Technical",
    difficulty: str = "Medium",
) -> Optional[Dict[str, Any]]:
    """
    Comprehensive multi-criteria LLM evaluation via OpenRouter GPT-4o-mini.
    Returns structured JSON with accurate calibrated scoring on a 0-10 scale.
    """
    if not settings.OPENROUTER_API_KEY:
        return None

    eval_points_text = (
        "\n".join([f"- {ep}" for ep in evaluation_points])
        if evaluation_points
        else "Standard industry best practices and core accuracy."
    )
    keywords_text = ", ".join(keywords) if keywords else "Relevant domain terminology"

    system_prompt = (
        "You are an expert technical hiring bar-raiser and senior interviewer. "
        "Your role is to rigorously, objectively, and accurately evaluate the candidate's interview answer. "
        "Score on a 0.0 to 10.0 scale according to real-world engineering and domain standards.\n\n"
        "SCORING CRITERIA:\n"
        "- 9.0–10.0 (Exceptional): Flawless accuracy, comprehensive depth, clear trade-offs/edge cases, clean code/articulation.\n"
        "- 7.5–8.9 (Strong): Accurate, covers all core concepts, minor edge cases omitted, structured delivery.\n"
        "- 6.0–7.4 (Good / Acceptable): Understands main principles, lacks depth or has minor inaccuracies.\n"
        "- 4.0–5.9 (Borderline / Partial): Vague, misses key evaluation points, or high-level buzzwords with little depth.\n"
        "- 1.0–3.9 (Weak / Incorrect): Factually wrong, completely missed the question, or trivial non-answer.\n\n"
        "Return ONLY a valid JSON object with EXACTLY this structure:\n"
        "{\n"
        '  "final_score": 8.5,\n'
        '  "technical_score": 8.7,\n'
        '  "concept_score": 8.5,\n'
        '  "communication_score": 8.0,\n'
        '  "covered_concepts": ["concept1", "concept2"],\n'
        '  "missing_concepts": ["concept3"],\n'
        '  "confidence": 0.92,\n'
        '  "justification": "Candidate accurately explained X and handled edge cases well.",\n'
        '  "feedback": "Strong explanation of core architecture. To improve, mention caching trade-offs."\n'
        "}"
    )

    user_prompt = (
        f"QUESTION: {question}\n"
        f"CATEGORY: {category} | DIFFICULTY: {difficulty}\n"
        f"BENCHMARK REFERENCE ANSWER:\n{reference_answer}\n\n"
        f"EXPECTED EVALUATION POINTS:\n{eval_points_text}\n\n"
        f"KEYWORDS / TERMINOLOGY: {keywords_text}\n\n"
        f"CANDIDATE'S ACTUAL ANSWER:\n{candidate_answer}\n\n"
        "Evaluate the candidate's answer thoroughly and provide the exact JSON scorecard."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2,
                },
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()
            raw_content = data["choices"][0]["message"]["content"].strip()
            parsed = json.loads(raw_content)

            # Validate and clamp output values
            final_score = float(parsed.get("final_score", 5.0))
            final_score = max(0.0, min(10.0, round(final_score, 1)))

            tech_score = float(parsed.get("technical_score", final_score))
            conc_score = float(parsed.get("concept_score", final_score))
            comm_score = float(parsed.get("communication_score", 7.0))

            return {
                "final_score": final_score,
                "technical_score": max(0.0, min(10.0, round(tech_score, 1))),
                "concept_score": max(0.0, min(10.0, round(conc_score, 1))),
                "communication_score": max(0.0, min(10.0, round(comm_score, 1))),
                "covered_concepts": list(parsed.get("covered_concepts", [])),
                "missing_concepts": list(parsed.get("missing_concepts", [])),
                "confidence": max(0.0, min(1.0, float(parsed.get("confidence", 0.9)))),
                "justification": str(parsed.get("justification", "")).strip(),
                "feedback": str(parsed.get("feedback", "")).strip(),
            }

    except Exception as e:
        print(f"LLM evaluator notice (falling back to calibrated heuristic): {e}")
        return None


# ── Unified Evaluator Interface ───────────────────────────────────────────────

async def evaluate_answer_advanced(
    candidate_answer: str,
    question: str,
    reference_answer: str,
    evaluation_points: List[str],
    keywords: List[str],
    weights: Optional[dict] = None,
    category: str = "Technical",
    difficulty: str = "Medium",
    expected_time_seconds: int = 90,
) -> dict:
    """
    Main evaluation pipeline:
      - Runs high-precision LLM evaluation.
      - Concurrently computes heuristic embedding & communication signals.
      - Synthesizes both for reliable, insightful scoring.
    """
    # 1. Baseline heuristic / embedding evaluation
    heuristic_res = evaluate_answer_heuristic(
        candidate_answer=candidate_answer,
        reference_answer=reference_answer,
        evaluation_points=evaluation_points,
        keywords=keywords,
        weights=weights,
        category=category,
        expected_time_seconds=expected_time_seconds,
    )

    if not candidate_answer or not candidate_answer.strip():
        return heuristic_res

    # 2. Try LLM Deep Evaluation
    llm_res = await evaluate_answer_with_llm(
        question=question,
        candidate_answer=candidate_answer,
        reference_answer=reference_answer,
        evaluation_points=evaluation_points,
        keywords=keywords,
        category=category,
        difficulty=difficulty,
    )

    if llm_res is not None:
        # Blend LLM evaluation with communication quality and embedding baseline for stability
        blended_final = round(
            (llm_res["final_score"] * 0.75) + (heuristic_res["final_score"] * 0.25),
            1,
        )

        return {
            "semantic_score": round(llm_res["technical_score"] / 10.0, 3),
            "concept_score": round(llm_res["concept_score"] / 10.0, 3),
            "keyword_score": heuristic_res["keyword_score"],
            "communication_score": round(llm_res["communication_score"] / 10.0, 3),
            "communication_breakdown": heuristic_res["communication_breakdown"],
            "final_score": blended_final,
            "technical_score": llm_res["technical_score"],
            "covered_concepts": llm_res["covered_concepts"] or heuristic_res["covered_concepts"],
            "missing_concepts": llm_res["missing_concepts"] or heuristic_res["missing_concepts"],
            "confidence": llm_res["confidence"],
            "justification": llm_res["justification"] or heuristic_res["justification"],
            "feedback": llm_res["feedback"] or heuristic_res["feedback"],
        }

    # Fallback to calibrated heuristic if LLM is unavailable
    return heuristic_res


# ── Synchronous Backward Compatibility Wrapper ────────────────────────────────

def evaluate_answer(
    candidate_answer: str,
    reference_answer: str,
    evaluation_points: List[str],
    keywords: List[str],
    weights: Optional[dict] = None,
    **kwargs,
) -> dict:
    """Synchronous wrapper for legacy callers."""
    return evaluate_answer_heuristic(
        candidate_answer=candidate_answer,
        reference_answer=reference_answer,
        evaluation_points=evaluation_points,
        keywords=keywords,
        weights=weights,
        category=kwargs.get("category", "Technical"),
        expected_time_seconds=kwargs.get("expected_time_seconds", 90),
    )


async def generate_llm_feedback(
    question: str,
    candidate_answer: str,
    score: float,
    missing_concepts: List[str],
) -> Optional[str]:
    """Backward compatibility helper."""
    return None
