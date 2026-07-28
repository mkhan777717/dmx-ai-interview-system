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


# ── Improvement Plan Generator ────────────────────────────────────────────────

_SKILL_RESOURCES: dict = {
    "Data Structures": ["Visualgo.net", "LeetCode DSA Explore", "MIT 6.006 lectures"],
    "Algorithms":      ["LeetCode", "NeetCode.io", "CLRS textbook"],
    "System Design":   ["System Design Primer (GitHub)", "ByteByteGo", "Designing Data-Intensive Applications"],
    "Databases":       ["Use The Index, Luke", "PostgreSQL official docs", "Stanford DB course"],
    "Networking":      ["Julia Evans zines", "Beej's Guide to Networking", "Computer Networking by Kurose"],
    "Operating Systems": ["OS: Three Easy Pieces (free)", "OSTEP exercises", "Linux man pages"],
    "Web Development": ["MDN Web Docs", "web.dev", "Full Stack Open course"],
    "API Design":      ["REST API Design Rulebook", "Stripe API docs (reference)", "Postman Learning Center"],
    "Python":          ["Python Docs", "Fluent Python", "Real Python tutorials"],
    "JavaScript":      ["javascript.info", "You Don't Know JS", "MDN Web Docs"],
    "React":           ["Official React Docs", "Epic React by Kent C. Dodds", "Egghead.io React"],
    "Cloud":           ["AWS Well-Architected", "GCP training", "A Cloud Guru"],
    "Security":        ["OWASP Top 10", "PortSwigger Web Security Academy", "Secure by Design book"],
    "Machine Learning": ["fast.ai", "deeplearning.ai", "Kaggle Learn"],
    "Communication":   ["STAR method guide", "Toastmasters", "Harvard Business Review writing guides"],
    "Behavioral":      ["STAR method", "Amazon Leadership Principles guide", "Interview preparation workbooks"],
}

_DEFAULT_RESOURCES = ["LeetCode", "YouTube tech channels", "Official documentation"]


def generate_improvement_plan(answers: list) -> list:
    """
    Generate 3–5 personalized coaching suggestions based on weak-scoring answers.

    Args:
        answers: List of answer dicts from finish_interview (with skill, topic, final_score, missing_concepts)

    Returns:
        List of suggestion dicts: { skill, topic, priority, suggestion, resources, score }
    """
    # Group by skill, compute avg score per skill
    skill_data: dict = {}
    for ans in answers:
        skill = ans.get("skill", "General") or "General"
        topic = ans.get("topic", "") or ""
        score = float(ans.get("final_score", 0) or 0)
        missing = ans.get("missing_concepts", []) or []
        comm = float(ans.get("communication_score", 0) or 0)

        if skill not in skill_data:
            skill_data[skill] = {"scores": [], "topics": set(), "missing": [], "comm": []}
        skill_data[skill]["scores"].append(score)
        skill_data[skill]["topics"].add(topic)
        skill_data[skill]["missing"].extend(missing)
        skill_data[skill]["comm"].append(comm)

    suggestions = []

    for skill, data in skill_data.items():
        avg_score = sum(data["scores"]) / len(data["scores"])
        avg_comm = sum(data["comm"]) / len(data["comm"]) if data["comm"] else 0.5

        # Only suggest improvements for below-average skills
        if avg_score >= 7.0:
            continue

        # Priority: high (<5), medium (5–6.5), low (6.5–7)
        if avg_score < 5.0:
            priority = "high"
            action_verb = "Focus on strengthening"
        elif avg_score < 6.5:
            priority = "medium"
            action_verb = "Work on improving"
        else:
            priority = "low"
            action_verb = "Polish your"

        # Build suggestion text
        missing_str = ""
        if data["missing"]:
            top_missing = list(dict.fromkeys(data["missing"]))[:2]  # deduplicate
            missing_str = f" Key concepts to review: {', '.join(top_missing)}."

        comm_note = ""
        if avg_comm < 0.5:
            comm_note = " Also work on structuring your answers more clearly using the STAR method."

        suggestion = (
            f"{action_verb} your understanding of {skill}."
            f"{missing_str}"
            f"{comm_note}"
        )

        # Find resources
        resources = _DEFAULT_RESOURCES
        for key in _SKILL_RESOURCES:
            if key.lower() in skill.lower() or skill.lower() in key.lower():
                resources = _SKILL_RESOURCES[key]
                break

        suggestions.append({
            "skill": skill,
            "topics": list(data["topics"])[:2],
            "priority": priority,
            "score": round(avg_score, 1),
            "suggestion": suggestion,
            "resources": resources[:3],
        })

    # Add a communication suggestion if overall comm is weak
    all_comm = [
        float(a.get("communication_score", 0) or 0)
        for a in answers
        if a.get("communication_score") is not None
    ]
    if all_comm:
        avg_overall_comm = sum(all_comm) / len(all_comm)
        if avg_overall_comm < 0.55:
            suggestions.append({
                "skill": "Communication",
                "topics": ["Answer Structure", "Clarity"],
                "priority": "medium" if avg_overall_comm >= 0.35 else "high",
                "score": round(avg_overall_comm * 10, 1),
                "suggestion": (
                    "Practice structuring your answers using the STAR method "
                    "(Situation, Task, Action, Result). Aim for clear, concise responses "
                    "that directly address the question before elaborating."
                ),
                "resources": _SKILL_RESOURCES["Communication"],
            })

    # Sort by priority (high → medium → low), then by score ascending
    priority_order = {"high": 0, "medium": 1, "low": 2}
    suggestions.sort(key=lambda s: (priority_order.get(s["priority"], 3), s["score"]))

    return suggestions[:5]

