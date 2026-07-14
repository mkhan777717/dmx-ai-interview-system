from typing import List


def decide_next_action(
    current_score: float,
    question_index: int,
    total_planned: int,
    consecutive_good: int,
    has_follow_up_been_asked: bool,
    missing_concepts: List[str],
) -> dict:
    """
    Rule-based decision engine for the interview agent.

    Rules:
      - score >= 7.0  → next question (good answer)
      - score < 7.0 AND follow-up not yet asked AND concepts missing → follow_up
      - Last question done → finish

    Returns action + updated state hints.
    """
    is_last = (question_index + 1) >= total_planned

    # Consecutive good tracking
    new_consecutive_good = (consecutive_good + 1) if current_score >= 7.0 else 0

    # Difficulty increase hint (caller handles actual logic)
    difficulty_increase = new_consecutive_good >= 2

    # Decide action
    needs_follow_up = (
        current_score < 7.0
        and not has_follow_up_been_asked
        and bool(missing_concepts)
        and not is_last
    )

    if is_last:
        action = "finish"
    elif needs_follow_up:
        action = "follow_up"
    else:
        action = "next_question"

    return {
        "action": action,
        "trigger_follow_up": needs_follow_up,
        "new_consecutive_good": new_consecutive_good,
        "difficulty_increase": difficulty_increase,
    }


def get_hiring_recommendation(overall_score: float) -> dict:
    """Map overall score (0–10) to a hiring recommendation."""
    if overall_score >= 8.0:
        return {"recommendation": "Strong Hire", "color": "green"}
    elif overall_score >= 6.5:
        return {"recommendation": "Hire", "color": "blue"}
    elif overall_score >= 5.0:
        return {"recommendation": "Borderline", "color": "yellow"}
    else:
        return {"recommendation": "Reject", "color": "red"}


def build_skill_breakdown(answers: list) -> dict:
    """Aggregate per-skill performance from all answers."""
    skill_scores: dict = {}
    for ans in answers:
        skill = ans.get("skill", "General")
        score = ans.get("final_score", 0.0)
        if skill not in skill_scores:
            skill_scores[skill] = []
        skill_scores[skill].append(score)

    breakdown = {}
    for skill, scores in skill_scores.items():
        avg = round(sum(scores) / len(scores), 1)
        status = "Strong" if avg >= 7.0 else ("Average" if avg >= 5.0 else "Weak")
        breakdown[skill] = {"score": avg, "status": status}
    return breakdown


def get_strengths_weaknesses(answers: list) -> dict:
    """Return top strengths and weaknesses based on answer scores."""
    strong, weak = [], []
    seen_skills: set = set()
    for ans in sorted(answers, key=lambda a: a.get("final_score", 0), reverse=True):
        skill = ans.get("skill", "")
        score = ans.get("final_score", 0.0)
        if skill and skill not in seen_skills:
            seen_skills.add(skill)
            if score >= 7.0:
                strong.append(skill)
            elif score < 5.0:
                weak.append(skill)
    return {"strengths": strong[:3], "weaknesses": weak[:3]}
