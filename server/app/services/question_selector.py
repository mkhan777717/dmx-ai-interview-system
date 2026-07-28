"""
Question Selector — selects personalized questions from the question bank.

Features:
  - Role-based filtering with partial matching
  - Skill relevance scoring (prioritizes questions matching candidate skills)
  - Topic diversity (max 1 question per topic)
  - Adaptive difficulty: get_harder_question() / get_easier_question() for mid-interview swaps
  - Randomized selection per session (no two interviews identical)
"""

import pandas as pd
import random
from pathlib import Path
from typing import List, Optional

CSV_PATH = Path(__file__).parent.parent.parent / "data" / "question_bank.csv"

_df = None


DEFAULT_QUESTIONS = [
    {
        "id": 1,
        "question": "Tell me about yourself and your background in software development.",
        "reference_answer": "I am a software developer with experience in [X] years. I have worked on [key projects] using [key technologies]. I am passionate about [areas of interest] and have contributed to [notable achievements].",
        "skill": "Communication",
        "topic": "Behavioral",
        "subtopic": "Self Introduction",
        "difficulty": "Easy",
        "category": "Behavioral",
        "role": "Software Engineer|Frontend Developer|Backend Developer|Full Stack Developer",
        "keywords": "communication|background|experience|projects|skills",
        "evaluation_points": "Clear self-introduction|Relevant technical background|Notable achievements mentioned",
        "estimated_time_seconds": 60,
    },
    {
        "id": 2,
        "question": "What are the core differences between processes and threads, and how does inter-process communication work?",
        "reference_answer": "Processes have independent memory space, whereas threads share the memory space of their parent process. IPC methods include pipes, message queues, shared memory, and sockets.",
        "skill": "Operating Systems",
        "topic": "System Architecture",
        "subtopic": "Concurrency",
        "difficulty": "Easy",
        "category": "Technical",
        "role": "Software Engineer|Backend Developer|Full Stack Developer",
        "keywords": "process|thread|memory|IPC|pipes|shared memory|sockets",
        "evaluation_points": "Independent memory vs shared memory|Inter-process communication mechanisms|Context switching overhead",
        "estimated_time_seconds": 90,
    },
    {
        "id": 3,
        "question": "Explain the concept of RESTful web services and how idempotency applies to HTTP methods.",
        "reference_answer": "REST is an architectural style based on stateless communications using HTTP methods. GET, PUT, DELETE are idempotent because repeating requests yields the same server state, while POST is non-idempotent.",
        "skill": "Web Development",
        "topic": "API Design",
        "subtopic": "REST",
        "difficulty": "Medium",
        "category": "Technical",
        "role": "Software Engineer|Backend Developer|Full Stack Developer|Frontend Developer",
        "keywords": "REST|stateless|HTTP|idempotent|GET|POST|PUT|DELETE",
        "evaluation_points": "Stateless architectural style|HTTP method semantics|Definition and examples of idempotency",
        "estimated_time_seconds": 120,
    },
    {
        "id": 4,
        "question": "How do database indexes (such as B-Trees) optimize query execution, and what are the trade-offs on WRITE operations?",
        "reference_answer": "Indexes provide fast lookup paths (O(log N)) avoiding full table scans. However, write operations (INSERT, UPDATE, DELETE) become slower because index structures must be updated synchronously.",
        "skill": "Databases",
        "topic": "Database Optimization",
        "subtopic": "Indexing",
        "difficulty": "Hard",
        "category": "Technical",
        "role": "Software Engineer|Backend Developer|Database Administrator|Full Stack Developer",
        "keywords": "index|B-Tree|lookup|query planner|write overhead|insert|update",
        "evaluation_points": "B-Tree lookup speed O(log N)|Reduction of full table scans|Write penalty and index maintenance cost",
        "estimated_time_seconds": 120,
    },
    {
        "id": 5,
        "question": "What are SOLID design principles, and how does the Dependency Inversion Principle facilitate testability?",
        "reference_answer": "SOLID stands for Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. DIP states high-level modules should depend on abstractions, allowing easy mocking in tests.",
        "skill": "Software Engineering",
        "topic": "Object Oriented Design",
        "subtopic": "Design Principles",
        "difficulty": "Hard",
        "category": "Technical",
        "role": "Software Engineer|Backend Developer|Full Stack Developer",
        "keywords": "SOLID|Dependency Inversion|abstraction|decoupling|unit testing|mocking",
        "evaluation_points": "Explanation of SOLID acronym|Depend on abstractions not concretions|Enhanced unit testability via mocking",
        "estimated_time_seconds": 120,
    },
]

_DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"]


def _get_df() -> pd.DataFrame:
    """Load CSV once and cache it, with fallback if file is missing."""
    global _df
    if _df is None:
        print("Loading question bank...")
        try:
            if CSV_PATH.exists():
                _df = pd.read_csv(CSV_PATH)
                print(f"Question bank loaded from CSV: {len(_df)} questions ✅")
            else:
                print(f"⚠️  Question bank CSV not found at {CSV_PATH}. Using built-in questions.")
                _df = pd.DataFrame(DEFAULT_QUESTIONS)
        except Exception as e:
            print(f"⚠️  Failed to read question bank CSV ({e}). Using built-in questions.")
            _df = pd.DataFrame(DEFAULT_QUESTIONS)

        # Pre-parse pipe-separated lists
        if "role_list" not in _df.columns:
            _df["role_list"] = _df["role"].astype(str).str.split("|").apply(
                lambda lst: [r.strip() for r in lst]
            )
        if "keyword_list" not in _df.columns:
            _df["keyword_list"] = _df["keywords"].astype(str).str.split("|").apply(
                lambda lst: [k.strip() for k in lst]
            )
        if "eval_point_list" not in _df.columns:
            _df["eval_point_list"] = _df["evaluation_points"].astype(str).str.split("|").apply(
                lambda lst: [e.strip() for e in lst]
            )

    return _df


def _role_matches(role_list: list, predicted_role: str) -> bool:
    """Check if predicted_role appears in a question's pipe-separated role list."""
    predicted_lower = predicted_role.lower()
    for r in role_list:
        if r.lower() == predicted_lower:
            return True
        if predicted_lower in r.lower() or r.lower() in predicted_lower:
            return True
    if any("software engineer" in r.lower() for r in role_list):
        return True
    return False


def _skill_relevance(skill_cell: str, skills_lower: list) -> int:
    if not skills_lower:
        return 0
    return 1 if any(sk in skill_cell.lower() for sk in skills_lower) else 0


def select_questions(
    predicted_role: str,
    skills: List[str],
    n: int = 5,
    interview_mode: str = "Technical",
) -> list:
    """
    Select n personalized questions from the question bank.

    Distribution (Technical mode):
      2 Behavioral warm-up questions first
      1 Easy + 1 Medium + 1 Hard technical question

    Distribution (HR mode):
      5 Behavioral questions

    Enforces topic diversity: max 1 question per topic.
    Prioritizes questions matching candidate's skills.
    Randomizes to ensure different interviews every time.
    """
    df = _get_df()

    # ── Filter by role ────────────────────────────────────────────────────────
    role_mask = df["role_list"].apply(lambda rl: _role_matches(rl, predicted_role))
    filtered = df[role_mask].copy()

    if len(filtered) < n:
        filtered = df.copy()

    skills_lower = [s.lower() for s in skills] if skills else []

    # ── Shared picker state ───────────────────────────────────────────────────
    selected_ids: set = set()
    covered_topics: set = set()
    selected: list = []

    def pick_questions(pool_df, count):
        if pool_df.empty:
            return
        pool_df = pool_df.sample(frac=1, random_state=random.randint(0, 99999))
        pool_df["relevance"] = pool_df["skill"].apply(
            lambda s: _skill_relevance(s, skills_lower)
        )
        pool_df = pool_df.sort_values("relevance", ascending=False, kind="mergesort")

        added = 0
        # First pass: enforce topic diversity
        for _, row in pool_df.iterrows():
            if added >= count:
                break
            if row["id"] in selected_ids:
                continue
            if row["topic"] not in covered_topics:
                selected.append(row)
                selected_ids.add(row["id"])
                covered_topics.add(row["topic"])
                added += 1

        # Second pass: relax topic constraint
        if added < count:
            for _, row in pool_df.iterrows():
                if added >= count:
                    break
                if row["id"] not in selected_ids:
                    selected.append(row)
                    selected_ids.add(row["id"])
                    added += 1

    # ── Select questions ──────────────────────────────────────────────────────
    behav_pool = df[df["category"] == "Behavioral"].copy()

    if interview_mode == "HR":
        pick_questions(behav_pool, n)
    else:
        # Technical mode: 2 behavioral warm-ups + 3 technical
        pick_questions(behav_pool, 2)

        role_mask2 = df["role_list"].apply(lambda rl: _role_matches(rl, predicted_role))
        tech_pool = df[role_mask2 & (df["category"] != "Behavioral")].copy()
        if len(tech_pool) < 3:
            tech_pool = df[df["category"] != "Behavioral"].copy()

        for difficulty, count in [("Easy", 1), ("Medium", 1), ("Hard", 1)]:
            diff_pool = tech_pool[tech_pool["difficulty"] == difficulty].copy()
            if diff_pool.empty:
                diff_pool = tech_pool.copy()
            pick_questions(diff_pool, count)

    return [_format_question(row) for row in selected]


def get_harder_question(
    predicted_role: str,
    skills: List[str],
    current_difficulty: str,
    excluded_ids: List[int],
    current_topic: str,
) -> Optional[dict]:
    """
    Return a harder question than the current difficulty level.
    Returns None if no harder question is available.

    Used for adaptive difficulty: triggered when candidate answers consistently well.
    """
    df = _get_df()
    skills_lower = [s.lower() for s in skills] if skills else []

    # Find the next difficulty level up
    diff_idx = _DIFFICULTY_ORDER.index(current_difficulty) if current_difficulty in _DIFFICULTY_ORDER else 0
    target_difficulty = _DIFFICULTY_ORDER[min(diff_idx + 1, len(_DIFFICULTY_ORDER) - 1)]

    if target_difficulty == current_difficulty:
        return None  # Already at max difficulty

    role_mask = df["role_list"].apply(lambda rl: _role_matches(rl, predicted_role))
    pool = df[
        role_mask
        & (df["difficulty"] == target_difficulty)
        & (df["category"] != "Behavioral")
        & ~df["id"].isin(excluded_ids)
    ].copy()

    # Try different topic first
    diff_topic_pool = pool[pool["topic"] != current_topic]
    chosen_pool = diff_topic_pool if not diff_topic_pool.empty else pool

    if chosen_pool.empty:
        return None

    # Rank by skill relevance then pick one randomly from top candidates
    chosen_pool = chosen_pool.copy()
    chosen_pool["relevance"] = chosen_pool["skill"].apply(
        lambda s: _skill_relevance(s, skills_lower)
    )
    chosen_pool = chosen_pool.sort_values("relevance", ascending=False, kind="mergesort")
    top_candidates = chosen_pool.head(5)
    row = top_candidates.sample(1).iloc[0]
    return _format_question(row)


def get_easier_question(
    predicted_role: str,
    skills: List[str],
    current_difficulty: str,
    excluded_ids: List[int],
    current_topic: str,
) -> Optional[dict]:
    """
    Return an easier question than the current difficulty level.
    Returns None if no easier question is available.

    Used for adaptive difficulty: triggered when candidate performs poorly.
    """
    df = _get_df()
    skills_lower = [s.lower() for s in skills] if skills else []

    diff_idx = _DIFFICULTY_ORDER.index(current_difficulty) if current_difficulty in _DIFFICULTY_ORDER else 2
    target_difficulty = _DIFFICULTY_ORDER[max(diff_idx - 1, 0)]

    if target_difficulty == current_difficulty:
        return None  # Already at min difficulty

    role_mask = df["role_list"].apply(lambda rl: _role_matches(rl, predicted_role))
    pool = df[
        role_mask
        & (df["difficulty"] == target_difficulty)
        & (df["category"] != "Behavioral")
        & ~df["id"].isin(excluded_ids)
    ].copy()

    diff_topic_pool = pool[pool["topic"] != current_topic]
    chosen_pool = diff_topic_pool if not diff_topic_pool.empty else pool

    if chosen_pool.empty:
        return None

    chosen_pool = chosen_pool.copy()
    chosen_pool["relevance"] = chosen_pool["skill"].apply(
        lambda s: _skill_relevance(s, skills_lower)
    )
    chosen_pool = chosen_pool.sort_values("relevance", ascending=False, kind="mergesort")
    top_candidates = chosen_pool.head(5)
    row = top_candidates.sample(1).iloc[0]
    return _format_question(row)


def _format_question(row) -> dict:
    """Convert a DataFrame row to a clean question dict."""
    return {
        "id": int(row["id"]),
        "question": row["question"],
        "reference_answer": row["reference_answer"],
        "skill": row["skill"],
        "topic": row["topic"],
        "subtopic": row.get("subtopic", ""),
        "difficulty": row["difficulty"],
        "category": row.get("category", "Technical"),
        "keywords": row["keyword_list"] if isinstance(row["keyword_list"], list) else [],
        "evaluation_points": row["eval_point_list"] if isinstance(row["eval_point_list"], list) else [],
        "estimated_time_seconds": int(row["estimated_time_seconds"]),
    }
