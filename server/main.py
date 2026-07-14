from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config.database import connect_db, close_db
from app.routes import auth, user, interview
from app.routes import v2_interview
from app.routes import transcribe, tts
# Import V2 models so SQLAlchemy registers them for table creation
import app.models.v2_interview  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="InterviewIQ API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs("public", exist_ok=True)
app.mount("/public", StaticFiles(directory="public"), name="public")

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(v2_interview.router, prefix="/api/v2", tags=["V2 Interview"])
app.include_router(transcribe.router,   prefix="/api/v2", tags=["Transcribe"])
app.include_router(tts.router,          prefix="/api/v2", tags=["TTS"])


@app.get("/")
async def root():
    return {"message": "InterviewIQ API is running"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
