from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    PORT: int = 8000
    DATABASE_URL: str
    JWT_SECRET: str
    OPENROUTER_API_KEY: str
    GROQ_API_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    # TruGen avatar service
    TRUGEN_API_KEY: str = ""
    # LiveKit real-time video room
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""
    LIVEKIT_URL: str = "wss://ai-based-interview-system-wms62ikb.livekit.cloud"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
