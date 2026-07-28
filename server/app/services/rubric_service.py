"""
Rubric Service — configurable per-role weighted evaluation criteria.

Built-in rubrics ship with the system. Each rubric defines:
  - weights for the three scoring components (semantic, concept, keyword)
  - human-readable criteria for the report
  - version for audit trail
"""

from typing import Optional

# ── Built-in Rubric Definitions ───────────────────────────────────────────────

RUBRICS: dict = {
    "technical_standard": {
        "id": "technical_standard",
        "name": "Technical Interview — Standard",
        "version": 1,
        "description": "Balanced rubric for general software engineering technical rounds.",
        "criteria": [
            {
                "name": "Semantic Relevance",
                "weight": 0.50,
                "description": "How well the answer addresses the question conceptually.",
            },
            {
                "name": "Concept Coverage",
                "weight": 0.35,
                "description": "How many key technical concepts/evaluation points were covered.",
            },
            {
                "name": "Keyword Precision",
                "weight": 0.15,
                "description": "Accurate use of domain-specific technical terminology.",
            },
        ],
        "weights": {
            "semantic": 0.50,
            "concept": 0.35,
            "keyword": 0.15,
        },
    },

    "technical_depth": {
        "id": "technical_depth",
        "name": "Technical Interview — Deep Dive",
        "version": 1,
        "description": "Emphasizes concept depth for senior/specialist roles.",
        "criteria": [
            {
                "name": "Semantic Relevance",
                "weight": 0.35,
                "description": "Overall relevance and correctness of the answer.",
            },
            {
                "name": "Concept Coverage",
                "weight": 0.50,
                "description": "Comprehensive coverage of evaluation points — breadth and depth.",
            },
            {
                "name": "Keyword Precision",
                "weight": 0.15,
                "description": "Use of precise technical terminology.",
            },
        ],
        "weights": {
            "semantic": 0.35,
            "concept": 0.50,
            "keyword": 0.15,
        },
    },

    "behavioral_standard": {
        "id": "behavioral_standard",
        "name": "Behavioral / HR Interview — Standard",
        "version": 1,
        "description": "Rubric optimized for behavioral and soft-skills evaluation.",
        "criteria": [
            {
                "name": "Communication Clarity",
                "weight": 0.60,
                "description": "Clarity, structure, and relevance of the response (STAR method).",
            },
            {
                "name": "Content Coverage",
                "weight": 0.30,
                "description": "Coverage of expected behavioral elements (situation, action, result).",
            },
            {
                "name": "Keyword Alignment",
                "weight": 0.10,
                "description": "Use of relevant behavioral and professional vocabulary.",
            },
        ],
        "weights": {
            "semantic": 0.60,
            "concept": 0.30,
            "keyword": 0.10,
        },
    },

    "data_science": {
        "id": "data_science",
        "name": "Data Science / ML Interview",
        "version": 1,
        "description": "Rubric for data science, ML engineering, and analytics roles.",
        "criteria": [
            {
                "name": "Conceptual Accuracy",
                "weight": 0.40,
                "description": "Correctness of statistical, mathematical, and ML concepts.",
            },
            {
                "name": "Concept Coverage",
                "weight": 0.45,
                "description": "Coverage of key ML/statistical principles and evaluation points.",
            },
            {
                "name": "Technical Terminology",
                "weight": 0.15,
                "description": "Correct use of data science and ML-specific vocabulary.",
            },
        ],
        "weights": {
            "semantic": 0.40,
            "concept": 0.45,
            "keyword": 0.15,
        },
    },

    "system_design": {
        "id": "system_design",
        "name": "System Design Interview",
        "version": 1,
        "description": "Rubric for system design and architecture rounds.",
        "criteria": [
            {
                "name": "Design Relevance",
                "weight": 0.45,
                "description": "How well the candidate addresses the core design problem.",
            },
            {
                "name": "Component Coverage",
                "weight": 0.40,
                "description": "Coverage of key architectural components and trade-offs.",
            },
            {
                "name": "Technical Vocabulary",
                "weight": 0.15,
                "description": "Use of correct system design and infrastructure terminology.",
            },
        ],
        "weights": {
            "semantic": 0.45,
            "concept": 0.40,
            "keyword": 0.15,
        },
    },
}


# ── Role-to-Rubric Mapping ─────────────────────────────────────────────────────

_ROLE_RUBRIC_MAP: dict = {
    "data scientist": "data_science",
    "ml engineer": "data_science",
    "machine learning engineer": "data_science",
    "data engineer": "data_science",
    "data analyst": "data_science",
}

_DSA_ROLES = {"software engineer", "backend developer", "full stack developer"}


def resolve_rubric(interview_mode: str, predicted_role: str, rubric_id: str = "auto") -> dict:
    """
    Resolve the appropriate rubric given mode, role, and explicit rubric_id.
    Returns the full rubric dict.
    """
    if rubric_id != "auto" and rubric_id in RUBRICS:
        return RUBRICS[rubric_id]

    # Auto-resolve
    mode_lower = interview_mode.lower()
    role_lower = predicted_role.lower()

    if mode_lower == "hr":
        return RUBRICS["behavioral_standard"]

    # Data science roles
    for role_key, rubric_key in _ROLE_RUBRIC_MAP.items():
        if role_key in role_lower:
            return RUBRICS[rubric_key]

    # Default: technical standard
    return RUBRICS["technical_standard"]


def get_rubric(rubric_id: str) -> Optional[dict]:
    """Fetch a specific rubric by ID."""
    return RUBRICS.get(rubric_id)


def list_rubrics() -> list:
    """Return all available rubrics (safe for API serialization)."""
    return list(RUBRICS.values())
