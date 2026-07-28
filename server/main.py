from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config.database import connect_db, close_db
from app.routes import auth, user, interview
from app.routes import v2_interview
from app.routes import transcribe, tts
from app.routes import admin
from app.routes import superadmin
from app.routes import recruiter

# ── Model imports — ensures SQLAlchemy registers all tables on startup ─────────
import app.models.v2_interview   # noqa: F401
import app.models.organization   # noqa: F401
import app.models.user           # noqa: F401
from app.models.v2_interview import AuditLog  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="InterviewIQ API",
    version="2.0.0",
    description="AI-Powered Interview Platform with RBAC",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ──────────────────────────────────────────────────────────────
os.makedirs("public", exist_ok=True)
app.mount("/public", StaticFiles(directory="public"), name="public")

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",        tags=["Authentication"])
app.include_router(user.router,        prefix="/api/user",        tags=["User"])
app.include_router(interview.router,   prefix="/api/interview",   tags=["Interview (Legacy)"])
app.include_router(v2_interview.router, prefix="/api/v2",         tags=["V2 Interview"])
app.include_router(transcribe.router,  prefix="/api/v2",          tags=["Transcribe"])
app.include_router(tts.router,         prefix="/api/v2",          tags=["TTS"])
app.include_router(admin.router,       prefix="/api/admin",       tags=["Admin (Recruiter + Super Admin)"])
app.include_router(superadmin.router,  prefix="/api/superadmin",  tags=["Super Admin"])
app.include_router(recruiter.router,   prefix="/api/recruiter",   tags=["Recruiter"])


@app.get("/")
async def root():
    return {"message": "InterviewIQ API v2.0 — RBAC enabled"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "rbac": True}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
