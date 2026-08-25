from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    PORT: int = 8000
    DATABASE_URL: str
    JWT_SECRET: str
    OPENROUTER_API_KEY: str
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    # Client & CORS
    CLIENT_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = ""
    # TruGen avatar service
    TRUGEN_API_KEY: str = ""
    # LiveKit real-time video room
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""
    LIVEKIT_URL: str = "wss://ai-based-interview-system-wms62ikb.livekit.cloud"

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        v = v.strip()
        if v.startswith("postgres://"):
            return "postgresql+asyncpg://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            return "postgresql+asyncpg://" + v[len("postgresql://"):]
        if v.startswith("postgresql+asyncpg://"):
            return v
        raise ValueError(f"Unsupported DATABASE_URL scheme: {v.split('://')[0]}://")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
