import pandas as pd
import random
from pathlib import Path
from typing import List

CSV_PATH = Path(__file__).parent.parent.parent / "data" / "question_bank.csv"

_df = None


def _get_df() -> pd.DataFrame:
    """Load CSV once and cache it."""
    global _df
    if _df is None:
        print("Loading question bank...")
        _df = pd.read_csv(CSV_PATH)
        # Pre-parse pipe-separated lists
        _df["role_list"] = _df["role"].str.split("|").apply(
            lambda lst: [r.strip() for r in lst]
        )
        _df["keyword_list"] = _df["keywords"].str.split("|").apply(
            lambda lst: [k.strip() for k in lst]
        )
        _df["eval_point_list"] = _df["evaluation_points"].str.split("|").apply(
            lambda lst: [e.strip() for e in lst]
        )
        print(f"Question bank loaded: {len(_df)} questions ✅")
    return _df


def _role_matches(role_list: list, predicted_role: str) -> bool:
    """Check if predicted_role appears in a question's pipe-separated role list."""
    predicted_lower = predicted_role.lower()
    for r in role_list:
        if r.lower() == predicted_lower:
            return True
        # Partial match: "Backend Developer" matches "Backend Developer|Software Engineer"
        if predicted_lower in r.lower() or r.lower() in predicted_lower:
            return True
    # Always include generic Software Engineer questions
    if any("software engineer" in r.lower() for r in role_list):
        return True
    return False


def select_questions(predicted_role: str, skills: List[str], n: int = 5, interview_mode: str = "Technical") -> list:
    """
    Select n personalized questions from the question bank.
    Distribution: 1 Easy + 3 Medium + 1 Hard (Technical)
                  5 Behavioral questions (HR mode)
    Enforces topic diversity: max 1 question per topic.
    Prioritizes questions matching candidate's skills.
    """
    df = _get_df()

    # ── Filter by role ────────────────────────────────────────────────────────
    role_mask = df["role_list"].apply(lambda rl: _role_matches(rl, predicted_role))
    filtered = df[role_mask].copy()

    # Fallback: if too few, use full bank
    if len(filtered) < n:
        filtered = df.copy()

    # ── Skill relevance scoring ───────────────────────────────────────────────
    skills_lower = [s.lower() for s in skills] if skills else []

    def skill_relevance(skill_cell: str) -> int:
        if not skills_lower:
            return 0
        return 1 if any(sk in skill_cell.lower() for sk in skills_lower) else 0

    # ── Helper to pick questions ─────────────────────────────────────────────
    selected_ids = set()
    covered_topics = set()
    selected = []

    def pick_questions(pool_df, count):
        if pool_df.empty: return
        # Shuffle first, then stable sort by relevance so ties remain random
        pool_df = pool_df.sample(frac=1, random_state=random.randint(0, 10000))
        pool_df["relevance"] = pool_df["skill"].apply(skill_relevance)
        pool_df = pool_df.sort_values("relevance", ascending=False, kind="mergesort")
        
        added = 0
        # First pass: enforce topic diversity
        for _, row in pool_df.iterrows():
            if added >= count: break
            if row["id"] in selected_ids: continue
            if row["topic"] not in covered_topics:
                selected.append(row)
                selected_ids.add(row["id"])
                covered_topics.add(row["topic"])
                added += 1

        # Second pass: relax topic constraint if needed
        if added < count:
            for _, row in pool_df.iterrows():
                if added >= count: break
                if row["id"] not in selected_ids:
                    selected.append(row)
                    selected_ids.add(row["id"])
                    added += 1

    # ── Question Selection ────────────────────────────────────────────────────
    behav_pool = df[df["category"] == "Behavioral"].copy()
    
    if interview_mode == "HR":
        pick_questions(behav_pool, n)
    else:
        # Technical mode: 2 Behavioral + 3 Technical (1 Easy, 1 Medium, 1 Hard)
        pick_questions(behav_pool, 2)
        
        # Filter role specifically for technical
        role_mask = df["role_list"].apply(lambda rl: _role_matches(rl, predicted_role))
        tech_pool = df[role_mask & (df["category"] != "Behavioral")].copy()
        if len(tech_pool) < 3:
            tech_pool = df[df["category"] != "Behavioral"].copy()

        for difficulty, count in [("Easy", 1), ("Medium", 1), ("Hard", 1)]:
            diff_pool = tech_pool[tech_pool["difficulty"] == difficulty].copy()
            pick_questions(diff_pool, count)

    return [_format_question(row) for row in selected]


def _format_question(row) -> dict:
    """Convert a DataFrame row to a clean question dict."""
    return {
        "id": int(row["id"]),
        "question": row["question"],
        "reference_answer": row["reference_answer"],
        "skill": row["skill"],
        "topic": row["topic"],
        "subtopic": row["subtopic"],
        "difficulty": row["difficulty"],
        "keywords": row["keyword_list"] if isinstance(row["keyword_list"], list) else [],
        "evaluation_points": row["eval_point_list"] if isinstance(row["eval_point_list"], list) else [],
        "estimated_time_seconds": int(row["estimated_time_seconds"]),
    }
