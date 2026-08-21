# 🎯 InterviewIQ v2.0 — AI-Powered Real-Time Interview Platform

InterviewIQ is an enterprise-grade AI technical and behavioral interview platform. Built with **FastAPI (Python 3.13)**, **PostgreSQL (SQLAlchemy 2.0 AsyncPG)**, **LiveKit Real-Time WebRTC**, **TruGen.AI Video Avatars**, and **React 19 (Vite 7)**.

---

## 🌟 Key Features

### 🎭 Real-Time AI Video Avatar (TruGen.AI & LiveKit)
- **Real-Time Lip-Sync Video**: Live interactive video avatar powered by TruGen.AI and LiveKit Agents.
- **Dynamic Interviewer Personas**:
  - **Alex Vance** (`Technical & System Design` — Crisp male persona)
  - **Sophia Chen** (`Behavioral & Culture Fit` — Empathetic female persona)
  - **Marcus Brody** (`Executive & Leadership` — Authoritative male persona)
- **Persona-Accurate Voice Mapping**: TTS synthesizes gender- and persona-matched audio (OpenAI TTS with macOS system fallback).
- **Seamless Degradation**: Layered fallback ensuring uninterrupted interview flow (LiveKit WebRTC Video Track ➔ High-Definition Video Loop ➔ Audio Speech Synthesis).

### 🎙️ Voice & Audio Pipeline
- **Speech-to-Text (STT)**: Sub-second audio transcription via Groq Whisper (`whisper-large-v3-turbo`).
- **Natural Text-to-Speech (TTS)**: High-quality WAV audio synthesized with OpenAI TTS (`tts-1`) / macOS native fallback.
- **Continuous STT & Gating**: Real-time microphone capture and speech gating for natural conversational turns.

### 🏢 Multi-Role Access Control (RBAC)
- **Candidate**: Interactive voice/coding interview rooms, real-time hints, detailed performance scorecards, and tailored coaching insights.
- **Recruiter**: Job description parsing, rubric configuration, candidate evaluation metrics, and score overrides.
- **SuperAdmin**: Platform analytics, organization management, recruiter provisioning, impersonation mode, and audit logs.

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
- **WebRTC & Avatars**: LiveKit (`livekit-api`, `livekit-agents`), TruGen.AI
- **NLP & AI**: OpenRouter AI, Groq SDK, Sentence-Transformers, PyMuPDF, Scikit-Learn
- **Authentication**: JWT & OAuth RBAC middleware

### Frontend
- **Framework**: React 19, Vite 7, React Router v7
- **State Management**: Redux Toolkit & React-Redux
- **Styling & UI**: TailwindCSS v4, Motion animations, React Icons, Monaco Code Editor, Recharts
- **LiveKit Client**: `livekit-client`, `@livekit/components-react`, `@aiteammate/agent-widget`

---

## 📁 Repository Structure

```
.
├── client/                     # Frontend Application (React 19 + Vite 7)
│   ├── src/
│   │   ├── components/         # TruGenVideoInterviewer, TrugenWidget, Monaco Editor, V2Room
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
│   │   └── services/           # AI services (evaluator, question_selector, avatar_service, tts)
│   ├── data/
│   │   └── question_bank.csv   # Comprehensive technical & behavioral interview questions
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python package dependencies
│   ├── seed_superadmin.py      # Database seed script for SuperAdmin account
│   └── .env.example            # Environment variables template
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

# Create server/.env file from template
cp .env.example .env

# Edit server/.env and configure your API keys (Database, OpenRouter, Groq, OpenAI, LiveKit)

# Run migrations and seed SuperAdmin user
python seed_superadmin.py

# Start the FastAPI server
python main.py
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
| `POST` | `/api/v2/speak` | Public / Auth | Text-to-Speech audio synthesis (WAV with persona voices) |
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
./venv/bin/python -m compileall app/ main.py
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
