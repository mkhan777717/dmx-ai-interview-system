# 🎯 InterviewIQ v2.0 - AI-Powered Interview Preparation Platform

InterviewIQ is an end-to-end, enterprise-grade AI interview candidate assessment and preparation platform. Built with **FastAPI (Python 3.13)**, **PostgreSQL (SQLAlchemy 2.0 AsyncPG)**, and **React 19 (Vite)**, it provides dynamic question selection, real-time candidate evaluation, adaptive difficulty scaling, automated follow-up question generation, peer percentile benchmarking, and role-based access control (RBAC).

---

## 🌟 Key Features

### 🏢 Multi-Role Access Control (RBAC)
- **Candidate**: Personal interview practice, real-time feedback, detailed performance scorecards, and AI coaching plans.
- **Recruiter**: Job description parsing, rubric configuration, interview invite distribution, and candidate evaluation reports.
- **SuperAdmin**: System-wide platform metrics, user management, recruiter provisioning, impersonation audit trail, and global configuration.

### 🤖 Adaptive AI Assessment Engine
- **Sentence Transformers Semantic Scoring**: Evaluates candidate responses against rubric-weighted reference answers, covering semantic relevance, key concepts, and domain keywords.
- **Adaptive Difficulty Adjustment**: Automatically monitors candidate performance (`consecutive_good` count) to swap technical questions to higher or lower difficulty tiers dynamically.
- **Automated Follow-up Generation**: Triggers tailored follow-up questions when candidate answers reveal missing core concepts.
- **AI Answer & Fraud Heuristics**: Heuristic analysis detecting copy-pasted or LLM-generated responses based on response length, completion time, and structural patterns.
- **Peer Percentile Benchmarking**: Dynamically ranks candidate final scores against peers interviewing for identical roles.

### 📄 Resume & JD Intelligence
- **PDF Resume Parsing**: Powered by PyMuPDF (`fitz`) for skill extraction, candidate contact detection, and target role prediction.
- **Job Description Parsing**: Extracts key required technical skills, experience requirements, and maps them to tailored interview rubrics.

### 🎙️ Audio & Voice Support
- **Speech-to-Text**: Voice transcription routes powered by Groq Whisper (`groq`).
- **Text-to-Speech**: Speech synthesis endpoints for voice-driven interview simulation.

---

## 🛠️ Technology Stack

### Backend (FastAPI)
- **Framework**: FastAPI (Python 3.13) with full async/await architecture
- **Database**: PostgreSQL with SQLAlchemy 2.0 (`asyncpg` engine) & Alembic migrations
- **Authentication**: JWT token-based authentication with HTTP-only cookies and Google OAuth support
- **NLP / ML**: `sentence-transformers`, `spacy`, `scikit-learn`, `numpy`, `pandas`, `PyMuPDF`, `groq`
- **Validation & OpenAPI**: Pydantic v2 with auto-generated Swagger UI (`/docs`)

### Frontend (React SPA)
- **Core**: React 19, React Router v7, JavaScript (ES modules)
- **Build System**: Vite 7
- **State Management**: Redux Toolkit & React-Redux
- **Styling & UI**: Vanilla CSS & TailwindCSS v4 with Motion animations, React Icons, Circular Progressbar, Monaco Code Editor, and Recharts.

---

## 📁 Repository Structure

```
.
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/         # Navigation, banners, modal components
│   │   ├── pages/              # AdminDashboard, CandidateDashboard, Analytics, Interview Room
│   │   ├── redux/              # Redux Toolkit slices & store definition
│   │   └── App.jsx             # Main routing and auth wrappers
│   ├── package.json            # Frontend scripts and dependencies
│   └── vite.config.js          # Vite build configuration
│
└── server/                     # Backend Application (FastAPI + PostgreSQL)
    ├── app/
    │   ├── config/             # Database connection, JWT handler, environment settings
    │   ├── middleware/         # Auth & RBAC role-verification middleware
    │   ├── models/             # SQLAlchemy ORM models (V2Interview, V2Answer, AuditLog, etc.)
    │   ├── routes/             # API Router endpoints (auth, interview, admin, superadmin, etc.)
    │   └── services/           # AI services (resume_parser, jd_parser, evaluator, rubric_service)
    ├── main.py                 # Application entry point & FastAPI setup
    ├── requirements.txt        # Python package dependencies
    ├── seed_superadmin.py      # Seed script for initial SuperAdmin user
    ├── start.sh                # Server launch script
    └── venv/                   # Active Python 3.13 virtual environment
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: Version `3.12` or `3.13`
- **Node.js**: Version `18+` (npm v9+)
- **PostgreSQL**: Version `14+` running locally or accessible via remote URL

---

### 1. Backend Setup

```bash
# Navigate to the server directory
cd server

# Activate the virtual environment
source venv/bin/activate

# Install dependencies (if setting up fresh environment)
pip install -r requirements.txt

# Configure environment variables in server/.env
# Example .env configuration:
# PORT=8000
# DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/interviewiq
# JWT_SECRET=your_super_secret_jwt_key
# GROQ_API_KEY=your_groq_api_key

# Run database seed (creates default admin accounts if needed)
python seed_superadmin.py

# Start the FastAPI backend server
python main.py
```

- **Backend API Base URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **API Health Check**: `http://localhost:8000/api/health`

---

### 2. Frontend Setup

```bash
# Navigate to the client directory
cd client

# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev
```

- **Frontend Application URL**: `http://localhost:5173` (or `http://localhost:5174` if 5173 is occupied)

---

## 🔒 API Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Backend health and RBAC status check |
| `POST` | `/api/auth/google` | Public | Authenticate user via Google OAuth |
| `POST` | `/api/v2/resume/parse` | Candidate / Recruiter | Upload PDF resume for parsing and skill extraction |
| `POST` | `/api/v2/jd/parse` | Candidate / Recruiter | Parse Job Description text for key skills |
| `POST` | `/api/v2/interview/start` | Candidate | Initialize personalized interview session |
| `POST` | `/api/v2/interview/submit` | Candidate | Submit main or follow-up answer for AI evaluation |
| `POST` | `/api/v2/interview/finish` | Candidate | Complete session, generate report & peer percentile |
| `GET` | `/api/v2/interview/report/{id}` | Candidate / Recruiter | Fetch complete candidate report |
| `GET` | `/api/v2/rubrics` | Candidate / Recruiter | List available assessment rubrics |
| `GET` | `/api/admin/metrics` | Recruiter / Admin | View candidate performance & platform metrics |
| `GET` | `/api/superadmin/users` | SuperAdmin | Manage system users and recruiter privileges |

---

## 🧪 Testing & Code Quality

To verify backend type safety using Pyright:

```bash
cd server
venv/bin/pyright app/routes/v2_interview.py
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
