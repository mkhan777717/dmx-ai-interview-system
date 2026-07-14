import httpx
from app.config.settings import settings
from typing import List, Dict


async def ask_ai(messages: List[Dict[str, str]]) -> str:
    """Call OpenRouter AI API"""
    try:
        if not messages or len(messages) == 0:
            raise ValueError("Messages array is empty")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": messages
                },
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                }
            )
            
            response.raise_for_status()
            data = response.json()
            
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            if not content or not content.strip():
                raise ValueError("AI returned empty response")
            
            return content.strip()
            
    except httpx.HTTPError as e:
        print(f"OpenRouter HTTP Error: {e}")
        raise Exception("OpenRouter API Error")
    except Exception as e:
        print(f"OpenRouter Error: {e}")
        raise Exception("OpenRouter API Error")
