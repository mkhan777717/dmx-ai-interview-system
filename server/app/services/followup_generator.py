import httpx
from typing import List
from app.config.settings import settings


async def generate_follow_up(
    question: str,
    candidate_answer: str,
    missing_concepts: List[str],
) -> str:
    """
    Call GPT-4o-mini via OpenRouter to generate one targeted follow-up question.
    Falls back to a template if the API call fails.
    Costs ~150 tokens per call — essentially free.
    """
    missing_text = ", ".join(missing_concepts) if missing_concepts else "key concepts"

    messages = [
        {
            "role": "system",
            "content": (
                "You are a technical interviewer. Generate exactly ONE short follow-up question "
                "to probe the candidate's weak area. Maximum 20 words. "
                "No explanation. Question text only. "
                "CRITICAL: Do NOT repeat or slightly rephrase the original question. "
                "Instead, drill down into a specific missing concept or ask for an example."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Original question: {question}\n"
                f"Candidate answered: {candidate_answer}\n"
                f"Concepts the candidate missed: {missing_text}"
            ),
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
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
            follow_up = data["choices"][0]["message"]["content"].strip()
            # Strip quotes if present
            return follow_up.strip('"').strip("'")

    except Exception as e:
        print(f"Follow-up generation error: {e}")
        # Template-based fallback — always works
        if missing_concepts:
            return f"Can you explain {missing_concepts[0]} in more detail?"
        return "Can you elaborate on your answer with a specific example?"
