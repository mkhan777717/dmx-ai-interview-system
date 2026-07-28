"""
JD Parser Service — extracts required skills and role from a job description
using the same LLM call pattern as resume_parser.py.
"""

import httpx
import json
from app.config.settings import settings


async def parse_jd(jd_text: str) -> dict:
    """
    Parse a job description text and return structured data.

    Args:
        jd_text: Raw job description text (plain text or HTML stripped)

    Returns:
        dict with role, skills, seniority, key_requirements
    """
    # Truncate if very long
    jd_text = jd_text[:8000]

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert technical recruiter. "
                "Extract structured information from the job description below into a strict JSON object. "
                "Output ONLY the JSON object, no markdown blocks or other text. "
                "Required JSON schema:\n"
                "{\n"
                '  "role": "Predicted job title (string, e.g., Frontend Developer, Backend Developer, Data Scientist)",\n'
                '  "seniority": "Seniority level: Junior | Mid | Senior | Lead | Manager (string)",\n'
                '  "skills": ["skill1", "skill2"] (List of required technical skills. Extract as many tech stack keywords as possible),\n'
                '  "key_requirements": ["req1", "req2"] (List of 3-6 short strings summarizing the most important non-skill requirements)\n'
                "}"
            ),
        },
        {
            "role": "user",
            "content": f"Job Description:\n{jd_text}",
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                },
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()
            result_str = data["choices"][0]["message"]["content"].strip()
            parsed = json.loads(result_str)

            return {
                "role": parsed.get("role", "Software Engineer"),
                "seniority": parsed.get("seniority", "Mid"),
                "skills": parsed.get("skills", []),
                "key_requirements": parsed.get("key_requirements", []),
            }

    except Exception as e:
        print(f"JD parsing error: {e}")
        # Simple fallback — extract capitalized words as skills
        words = jd_text.split()
        # Heuristic: capitalized multi-char words that look like tech terms
        likely_skills = [
            w.strip(".,()[]") for w in words
            if len(w) > 2 and (w[0].isupper() or w.isupper()) and w.isalpha()
        ]
        return {
            "role": "Software Engineer",
            "seniority": "Mid",
            "skills": list(set(likely_skills[:15])),
            "key_requirements": [],
        }
