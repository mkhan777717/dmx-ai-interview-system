import httpx
from app.config.settings import settings
from typing import List, Dict, Any


# ── Text-only queries (gpt-4o-mini) ──────────────────────────────────────────

async def ask_ai(messages: List[Dict[str, Any]]) -> str:
    """Call OpenRouter with text-only messages (gpt-4o-mini)."""
    return await _call_openrouter("openai/gpt-4o-mini", messages)


# ── Vision queries (gpt-4o — accepts image content parts) ────────────────────

async def ask_ai_vision(messages: List[Dict[str, Any]]) -> str:
    """
    Call OpenRouter with messages that may contain image_url content parts.
    Uses gpt-4o which supports vision input.

    Example image content part:
    {
        "type": "image_url",
        "image_url": {"url": "data:image/jpeg;base64,<b64>"}
    }
    """
    return await _call_openrouter("openai/gpt-4o", messages)


# ── Meeting-aware reply ───────────────────────────────────────────────────────

async def meeting_reply(
    query: str,
    context_prompt: str,
    avatar_name: str = "Alex",
    image_b64: str | None = None,
    image_mime: str = "image/jpeg",
) -> str:
    """
    Generate a contextually-aware meeting response.
    Injects conversation history into system prompt.
    Optionally attaches a screenshot or webcam frame.
    """
    system_content = (
        f"You are {avatar_name}, an intelligent AI meeting co-pilot embedded in an interview platform. "
        f"You are a helpful, concise, professional assistant. "
        f"Keep responses under 3 sentences unless asked for detail.\n\n"
        f"MEETING CONVERSATION SO FAR:\n{context_prompt}"
    )

    user_parts: List[Dict[str, Any]] = [{"type": "text", "text": query}]

    if image_b64:
        user_parts.append({
            "type": "image_url",
            "image_url": {"url": f"data:{image_mime};base64,{image_b64}"},
        })

    messages: List[Dict[str, Any]] = [
        {"role": "system",  "content": system_content},
        {"role": "user",    "content": user_parts},
    ]

    # Use vision model when an image is attached, text model otherwise
    model = "openai/gpt-4o" if image_b64 else "openai/gpt-4o-mini"
    return await _call_openrouter(model, messages)


# ── Shared HTTP helper ────────────────────────────────────────────────────────

async def _call_openrouter(model: str, messages: List[Dict[str, Any]]) -> str:
    """Low-level OpenRouter API call."""
    if not messages:
        raise ValueError("Messages array is empty")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json={"model": model, "messages": messages},
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type":  "application/json",
                },
            )
            response.raise_for_status()
            data    = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not content or not content.strip():
                raise ValueError("AI returned empty response")
            return content.strip()

    except httpx.HTTPError as e:
        print(f"OpenRouter HTTP Error: {e}")
        raise Exception(f"OpenRouter API Error: {e}")
    except Exception as e:
        print(f"OpenRouter Error: {e}")
        raise Exception(f"OpenRouter Error: {e}")
