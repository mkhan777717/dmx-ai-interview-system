# 🎯 InterviewIQ v2.0 — AI-Powered Real-Time Interview Platform

InterviewIQ is an enterprise-grade AI technical & behavioral interview platform. Built with **FastAPI (Python 3.13)**, **PostgreSQL (SQLAlchemy 2.0 AsyncPG)**, **LiveKit Real-Time WebRTC**, **TruGen.AI Video Avatars**, and **React 19 (Vite 7)**.

---

## 🌟 Key Features

### 🎭 Real-Time AI Video Avatar (TruGen.AI & LiveKit)
- **Real-Time Lip-Sync Video**: Live interactive video avatar powered by TruGen.AI and LiveKit Agents.
- **Dynamic Interviewer Personas**:
  - **Alex Vance** (`Technical & System Design`)
  - **Sophia Chen** (`Behavioral & Culture Fit`)
  - **Marcus Brody** (`Executive & Leadership`)
- **Seamless Degradation**: Layered fallback ensuring uninterrupted interview flow (LiveKit WebRTC Video Track ➔ High-Definition Video Loop ➔ Audio Speech Synthesis).

### 🎙️ Voice & Audio Pipeline
- **Speech-to-Text (STT)**: Sub-second audio transcription via Groq Whisper (`whisper-large-v3-turbo`).
- **Natural Text-to-Speech (TTS)**: High-quality WAV audio synthesized with OpenAI TTS / Groq Orpheus.
- **Audio-Driven Viseme Lip-Sync**: Real-time waveform visualizers and speech gating for natural conversational turns.

### 🏢 Multi-Role Access Control (RBAC)
- **Candidate**: Interactive voice/coding interview rooms, real-time feedback, detailed performance scorecards, and tailored coaching insights.
- **Recruiter**: Job description parsing, rubric configuration, candidate evaluation metrics, and score overrides.
- **SuperAdmin**: Platform analytics, organization management, recruiter provisioning, and audit logs.

### 🤖 Adaptive Assessment Engine
- **Sentence Transformers Semantic Scoring**: Real-time answer evaluation across relevance, technical depth, and communication clarity.
- **Adaptive Difficulty Adjustment**: Automatically adapts question difficulty based on consecutive candidate responses.
- **Automated Follow-ups**: Generates targeted follow-up questions when responses miss core technical concepts.
- **Anti-Cheat Integrity Tracking**: Monitors and logs candidate tab switches and session anomalies.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.13, async/await)
- **Database & ORM**: PostgreSQL with SQLAlchemy 2.0 (`asyncpg` async engine) & Alembic
- **WebRTC & Avatars**: LiveKit (`livekit-api`, `livekit-agents`, `livekit-plugins-trugen`)
- **NLP & AI**: OpenRouter AI, Groq SDK, Sentence-Transformers, PyMuPDF, Scikit-Learn
- **Cache**: Redis / In-Memory fallback cache

### Frontend
- **Framework**: React 19, Vite 7, React Router v7
- **State Management**: Redux Toolkit & React-Redux
- **Styling & UI**: TailwindCSS v4, Motion animations, React Icons, Monaco Code Editor, Recharts
- **LiveKit Client**: `livekit-client`, `@livekit/components-react`

---

## 📁 Repository Structure

```
.
├── client/                     # Frontend Application (React 19 + Vite 7)
│   ├── src/
│   │   ├── components/         # TruGenVideoInterviewer, HumanAvatar, Monaco Editor, V2Room
│   │   ├── pages/              # V2Interview, Dashboard, Recruiter, SuperAdmin, MeetingRoom
│   │   ├── redux/              # Redux Toolkit slices & store
│   │   └── App.jsx             # Main routing and auth wrappers
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite build & COOP headers configuration
│
├── server/                     # Backend Application (FastAPI + PostgreSQL)
│   ├── app/
│   │   ├── config/             # Settings, database connection, JWT handler
│   │   ├── middleware/         # RBAC role authentication middleware
│   │   ├── models/             # SQLAlchemy ORM models (User, V2Interview, Organization)
│   │   ├── routes/             # API routes (v2_interview, tts, transcribe, livekit, etc.)
│   │   └── services/           # AI services (evaluator, question_selector, avatar_service)
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python package dependencies
│   └── seed_superadmin.py      # Database seed script for SuperAdmin account
│
└── avatar-service/             # Optional Wav2Lip containerized video generation service
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: `3.12` or `3.13`
- **Node.js**: `18+` (npm v9+)
- **PostgreSQL**: `14+` running locally or via cloud connection

---

### 1. Backend Setup

```bash
# Navigate to the server directory
cd server

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create server/.env file and configure your API keys:
# PORT=8000
# DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/interviewiq
# JWT_SECRET=your_super_secret_jwt_key
# OPENROUTER_API_KEY=your_openrouter_api_key
# GROQ_API_KEY=your_groq_api_key
# TRUGEN_API_KEY=your_trugen_api_key
# LIVEKIT_API_KEY=your_livekit_api_key
# LIVEKIT_API_SECRET=your_livekit_api_secret
# LIVEKIT_URL=wss://your-project.livekit.cloud

# Run migrations and seed SuperAdmin user
python seed_superadmin.py

# Start the FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

### 2. Frontend Setup

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

- **Frontend App**: `http://localhost:5173`

---

## 🔒 API Routes Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System health check and RBAC status |
| `POST` | `/api/auth/google` | Public | Google OAuth login & JWT issuance |
| `GET` | `/api/livekit/token/{room}` | Candidate / Auth | Issue LiveKit token & trigger TruGen cloud avatar |
| `POST` | `/api/v2/speak` | Public / Auth | Text-to-Speech audio synthesis (WAV) |
| `POST` | `/api/v2/transcribe` | Public / Auth | Groq Whisper speech-to-text transcription |
| `POST` | `/api/v2/interview/start` | Candidate | Start dynamic AI interview session |
| `POST` | `/api/v2/interview/submit` | Candidate | Submit candidate answer for real-time scoring |
| `POST` | `/api/v2/interview/hint` | Candidate | Request contextual guidance & hint |
| `POST` | `/api/v2/interview/finish` | Candidate | Complete interview and generate scorecard |
| `GET` | `/api/recruiter/candidates` | Recruiter | View candidate submissions and reports |
| `GET` | `/api/superadmin/users` | SuperAdmin | Platform administration & user management |

---

## 🧪 Testing & Verification

```bash
# Run client linter and production build
cd client
npm run lint
npm run build

# Verify backend routes and imports
cd server
python -c "import main; print('Backend modules OK')"
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
