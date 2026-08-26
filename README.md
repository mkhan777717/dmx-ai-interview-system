# 🎯 AI-Based Interview Evaluation System (InterviewIQ.AI)

<div align="center">
  <img src="client/public/logo.png" alt="AI-Based Interview Evaluation System Logo" width="130" height="130" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(78, 156, 110, 0.25);" />
  <br /><br />
  
  **Project Title: AI-Based Interview Evaluation System**

  <p>The AI-Based Interview Evaluation System is an intelligent platform designed to automate the interview assessment process. The system evaluates candidate responses, assigns scores, identifies strengths and weaknesses, and generates personalized feedback using trained open-source NLP models without relying on external AI APIs. The goal is to provide consistent, scalable, and objective interview assessments for students, freshers, and job seekers.</p>

  [![React 19](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev)
  [![Vite 7](https://img.shields.io/badge/Vite-7-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org)
  [![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-FF4F00.svg?style=flat-square&logo=webrtc)](https://livekit.io)
  [![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4-06B6D4.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
</div>

---

## 🌟 Key Innovations & Capabilities

### 🧠 Multi-Stage Comprehensive Scoring Engine
- **LLM Multi-Criteria Rubric Evaluation**:
  - Technical Depth & Accuracy (0.0–10.0)
  - Core Concept Coverage & Completeness (0.0–10.0)
  - Communication Quality, Structure & Articulation (0.0–10.0)
  - Code Correctness & Algorithmic Complexity (DSA & Coding rounds)
- **Calibrated Semantic & Linguistic Fallback**:
  - Non-linear calibrated Sentence-Transformer (`all-MiniLM-L6-v2`) similarity matching.
  - Sentence-level localized concept verification.
  - Communication quality telemetry: Type-Token Ratio vocabulary richness, structural signposts, filler words rate, and length adequacy.
- **75/25 Blended Composite**: Synthesizes deep AI evaluation with deterministic signals for maximum objectivity and reliability.

### ⚡ Live In-Session Performance Tracker
- **Real-Time Scorecard Gauge**: Displays candidate's cumulative rating (`✦ Strong Hire`, `✦ Hire Track`, `✦ Borderline`, `✦ Developing`) updating live after every answer.
- **Dynamic Competency Bars**: Tracks Technical Depth, Concept Coverage, and Communication Quality in real time.
- **Timeline Question Badges**: Live score pills rendered alongside completed questions in the interactive session timeline.
- **AI Instant Evaluation Card**: Displays granular feedback, quoted justifications, covered concept tags (`✓`), and gap tags (`⚠`).

### 🎭 Real-Time AI Video Avatars (TruGen.AI & LiveKit)
- **Interactive 3D Video Avatar**: Real-time video stream powered by TruGen.AI and LiveKit Agents.
- **Dynamic Interviewer Personas**:
  - **Alex Vance** (`Technical & System Design` — Crisp male persona)
  - **Sophia Chen** (`Behavioral & Culture Fit` — Empathetic female persona)
  - **Marcus Brody** (`Executive & Leadership` — Authoritative male persona)
- **Layered Fallback Resilience**: `TruGen LiveKit WebRTC ➔ Neural Avatar with micro-expressions & TTS ➔ High-definition video loop`.

### 🎙️ Sub-Second Voice & Audio Pipeline
- **Speech-to-Text (STT)**: Ultra-fast transcription via Groq Whisper (`whisper-large-v3-turbo`).
- **Natural Text-to-Speech (TTS)**: High-quality WAV synthesis with OpenAI TTS (`tts-1`) and macOS native speech fallback.
- **Echo Cancellation & Auto-Gain**: Browser WebRTC audio capture with noise suppression.

### 🏢 Multi-Role Access Control (RBAC) & Unified Clean Interface
- **Candidate Hub**: Voice/coding interview rooms, real-time hints, multi-language Monaco IDE, detailed scorecard reports, and personalized improvement roadmaps.
- **Recruiter Screening Hub**: Organization candidate pipeline, JD parsing, rubric customization, score distribution analytics, and candidate interview report access.
- **SuperAdmin Studio**: Global platform analytics, organization management, recruiter provisioning, user impersonation, and immutable audit logs.
- **Unified Modern Theme**: Consistent `#4E9C6E` (`var(--accent)`) green palette and Plus Jakarta Sans typography across candidate, recruiter, and admin portals with clean light/dark modes.
- **Seamless Navigation & UX**: Responsive navbar with precision anchor scrolling (`#stages`, `#faq`), automatic top-of-page scroll restoration on reload, high-priority z-index layering for menus, and immediate landing page redirection on logout.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, React Router v7, Redux Toolkit, TailwindCSS v4, Motion (Framer), Monaco Code Editor, Recharts, Lucide / React Icons |
| **Backend API** | FastAPI (Python 3.13, async/await), Uvicorn, Pydantic v2 |
| **Database & ORM** | PostgreSQL, SQLAlchemy 2.0 (`asyncpg` async driver), Alembic migrations |
| **WebRTC & Video** | LiveKit API & Client, `@aiteammate/agent-widget`, TruGen.AI SDK |
| **AI / Machine Learning** | OpenRouter (GPT-4o-mini / GPT-4o), Groq SDK (Whisper), Sentence-Transformers, Scikit-Learn, PyMuPDF |
| **Security & Auth** | OAuth 2.0 (Google Auth), JWT cookies, Role-Based Access Control (RBAC), Anti-Cheat Telemetry |

---

## 📁 Project Architecture & Clean File Structure

```
ai-based-interview-system/
├── package.json                # Root proxy scripts (build, dev, preview, server)
├── .gitignore                  # Root ignore configuration
│
├── client/                     # Frontend Application (React 19 + Vite 7)
│   ├── public/                 # Static assets (logo.png, favicon.png)
│   ├── src/
│   │   ├── components/         # Reusable UI & Core Components
│   │   │   ├── ui/             # Design system tokens (buttons, badges, inputs)
│   │   │   ├── HumanAvatar.jsx # Neural animated avatar with micro-expressions
│   │   │   ├── TrugenWidget.jsx# TruGen WebRTC widget with ErrorBoundary & fallback
│   │   │   ├── V2InterviewRoom.jsx # Live interview room with IDE & dynamic scoreboard
│   │   │   ├── V2Layout.jsx    # Unified studio sidebar layout
│   │   │   └── V2Report.jsx    # Detailed performance scorecard & analytics
│   │   ├── pages/              # Route views (Home, Auth, Dashboard, Recruiter, SuperAdmin, Report)
│   │   ├── redux/              # Redux Toolkit state slices
│   │   ├── App.jsx             # Main router & RBAC route guards
│   │   └── index.css           # Universal dark-theme design tokens & typography
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API Application (FastAPI + PostgreSQL)
│   ├── app/
│   │   ├── config/             # App settings, database connection, JWT handler
│   │   ├── middleware/         # RBAC role authentication middleware
│   │   ├── models/             # SQLAlchemy ORM models (User, V2Interview, V2Answer, AuditLog)
│   │   ├── routes/             # REST & WebRTC routes (v2_interview, admin, recruiter, superadmin, auth)
│   │   └── services/           # Business logic (evaluator, question_selector, resume_parser, jd_parser)
│   ├── data/
│   │   └── question_bank.csv   # Calibrated technical & behavioral question repository
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── seed_superadmin.py      # SuperAdmin initial seeding utility
│   └── .env.example
│
└── avatar-service/             # Optional Wav2Lip containerized video generation service
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18+` (npm v9+)
- **Python**: `3.12` or `3.13`
- **PostgreSQL**: `14+` running locally or cloud-hosted

---

### 1. Unified Setup (Recommended)

From the project root:

```bash
# Install frontend dependencies
npm --prefix client install

# Setup backend environment
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Configure your keys in server/.env (DATABASE_URL, OPENROUTER_API_KEY, GROQ_API_KEY, etc.)

# Seed database with initial superadmin
python seed_superadmin.py
cd ..
```

---

### 2. Running Locally

```bash
# Start backend server (FastAPI on http://localhost:8000)
cd server && ./venv/bin/python main.py

# Start frontend server (Vite on http://localhost:5173)
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 3. Production Build

```bash
# Build frontend for production
npm run build
```

---

## 🔒 API Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status and RBAC diagnostics |
| `GET` | `/api/v2/stats` | Public | Real-time platform statistics for landing page |
| `POST` | `/api/auth/google` | Public | Google OAuth login & JWT cookie issuance |
| `POST` | `/api/v2/resume/parse` | Candidate | PDF resume semantic parsing & role extraction |
| `POST` | `/api/v2/jd/parse` | Candidate / Recruiter | Job description skill & requirement extraction |
| `POST` | `/api/v2/interview/start` | Candidate | Initialize adaptive AI mock interview session |
| `POST` | `/api/v2/interview/submit` | Candidate | Submit answer for multi-stage LLM/embedding scoring |
| `POST` | `/api/v2/interview/hint` | Candidate | Request contextual hint & guidance |
| `POST` | `/api/v2/interview/finish` | Candidate | Force-complete or conclude interview and generate report |
| `GET` | `/api/v2/interview/history` | Candidate / Auth | Retrieve user's completed and in-progress reports |
| `GET` | `/api/v2/interview/report/{id}` | Candidate / Recruiter | Retrieve full scorecard with question-by-question breakdown |
| `GET` | `/api/admin/analytics` | Recruiter / Admin | Aggregated organization interview metrics & score distribution |
| `GET` | `/api/recruiter/candidates` | Recruiter | Candidate screening list with report links |
| `GET` | `/api/superadmin/audit-logs` | SuperAdmin | Immutable security and session audit logs |

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
