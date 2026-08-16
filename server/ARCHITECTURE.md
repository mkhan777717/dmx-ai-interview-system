# FastAPI Backend Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                      │
│                    http://localhost:5173                      │
│          (Vite 7 · Redux Toolkit · TailwindCSS v4)           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP Requests (JSON / multipart)
                             │ Cookies (JWT Token)
                             │ WebSocket (LiveKit room)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI SERVER                            │
│                   http://localhost:8000                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MIDDLEWARE LAYER                         │    │
│  │  • CORS (localhost:5173 / 5174 / 5175)               │    │
│  │  • Cookie Parser                                      │    │
│  │  • RBAC Auth Middleware (JWT → UserContext)           │    │
│  │    Roles: CANDIDATE │ RECRUITER │ SUPER_ADMIN         │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              API ROUTES                               │    │
│  │                                                        │    │
│  │  /api/auth/*            → auth.py                    │    │
│  │  /api/user/*            → user.py                    │    │
│  │  /api/interview/*       → interview.py  (Legacy v1)  │    │
│  │  /api/v2/interview/*    → v2_interview.py  ◄── main  │    │
│  │  /api/v2/transcribe     → transcribe.py (Groq Whisp) │    │
│  │  /api/v2/speak          → tts.py (OpenAI TTS → WAV)  │    │
│  │  /api/avatar/speak      → avatar.py (Wav2Lip JSON)   │    │
│  │  /api/livekit/token/*   → livekit.py                 │    │
│  │  /api/admin/*           → admin.py                   │    │
│  │  /api/recruiter/*       → recruiter.py               │    │
│  │  /api/superadmin/*      → superadmin.py              │    │
│  │  /api/meeting/*         → meeting.py                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            SERVICE LAYER                              │    │
│  │                                                        │    │
│  │  • Request Validation (Pydantic v2)                  │    │
│  │  • interview_agent.py   — question flow orchestrator  │    │
│  │  • question_selector.py — semantic question ranking   │    │
│  │  • followup_generator.py — follow-up question gen     │    │
│  │  • evaluator.py         — rubric-based scoring        │    │
│  │  • rubric_service.py    — rubric templates            │    │
│  │  • transcriber.py       — Groq Whisper STT            │    │
│  │  • tts.py               — OpenAI TTS → WAV bytes      │    │
│  │  • avatar_cache.py      — Redis / in-memory cache     │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
            ┌───────────────┼──────────────────┐
            │               │                  │
            ▼               ▼                  ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
    │  PostgreSQL  │ │  OpenRouter  │ │  External APIs   │
    │  (asyncpg /  │ │   AI API     │ │  • Groq Whisper  │
    │  SQLAlchemy) │ │              │ │  • OpenAI TTS    │
    └──────────────┘ └──────────────┘ │  • LiveKit       │
                                       └──────────────────┘
```

---

## 📂 Request Flow

### Example: Submit Answer (V2 Interview)

```
1. CLIENT
   │
   └─► POST /api/v2/interview/submit
       Headers: Cookie: token=jwt_token
       Body: {interview_id, question_index, answer, is_follow_up,
              time_taken, integrity_flags}
       │
       ▼

2. FASTAPI MIDDLEWARE
   │
   ├─► CORS Check ✓
   ├─► Parse Cookie ✓
   ├─► Verify JWT Token → Extract userId ✓
   │   (get_current_user() dependency in auth.py)
   │
   ▼

3. ROUTE HANDLER (v2_interview.py)
   │
   ├─► Validate Request (Pydantic v2) ✓
   ├─► Load Interview from PostgreSQL ✓
   │
   ▼

4. SERVICE LAYER
   │
   ├─► evaluator.py  — score candidate answer via OpenRouter AI
   │   └─► rubric_service.py for rubric templates
   │
   ├─► followup_generator.py — decide if follow-up needed
   │
   ├─► SQLAlchemy 2.0 async session — persist scores to PostgreSQL
   │
   └─► Build response {feedback, final_score, next_action, …}
       │
       ▼

5. RESPONSE
   │
   └─► Return {feedback, final_score, next_action,
               spoken_feedback, follow_up_question}
```

---

## 🗂️ Database Schema (PostgreSQL / SQLAlchemy 2.0)

All models in `server/app/models/`.

### users table

| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| name | String | |
| email | String UNIQUE | |
| hashed_password | String | |
| role | Enum | CANDIDATE / RECRUITER / SUPER_ADMIN |
| org_id | Integer FK | null for candidates |
| credits | Integer | default 100 |
| is_active | Boolean | default true |
| created_at | DateTime | |

### v2_interviews table

| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| user_id | Integer FK → users | |
| org_id | Integer FK → organizations | nullable |
| role | String | target job role |
| experience | String | |
| mode | String | HR / Technical |
| status | Enum | in_progress / completed / abandoned |
| questions | JSONB | array of question objects |
| final_score | Float | 0–10 |
| created_at | DateTime | |
| completed_at | DateTime | nullable |

### organizations table

| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| name | String UNIQUE | |
| created_at | DateTime | |

---

## 🔐 Authentication & RBAC Flow

```
┌────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH LOGIN                        │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  POST /api/auth/google           │
        │  Body: {name, email, uid}        │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Upsert user in PostgreSQL       │
        │  Set role = CANDIDATE (default)  │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Generate JWT Token              │
        │  Payload: {userId, role, orgId}  │
        │  Algorithm: HS256                │
        │  Expires: 7 days                 │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Set HTTP-Only Cookie            │
        │  • Name: "token"                 │
        │  • HttpOnly: true                │
        │  • SameSite: lax                 │
        └──────────────────────────────────┘
```

### RBAC Enforcement (middleware/auth.py)

| Dependency | Usage | DB Hit? |
|------------|-------|---------|
| `get_current_user()` | Legacy routes — returns user_id str | No |
| `get_current_user_ctx()` | V2 routes — returns `UserContext` (id, role, org_id) | Yes |
| `require_roles(*roles)` | Fast-path role guard via JWT claim | No |
| `require_db_role(*roles)` | High-privilege guard (re-checks DB) | Yes |
| `assert_org_scope(ctx, org_id)` | Recruiter org isolation | N/A |

---

## 🛡️ Protected Route Flow

```
┌────────────────────────────────────────────────────────────┐
│              PROTECTED ENDPOINT REQUEST                     │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Extract Cookie "token"          │
        └──────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
           [No Token]             [Has Token]
                │                       │
                ▼                       ▼
        ┌─────────────┐      ┌─────────────────┐
        │ 401 Error   │      │ Verify JWT      │
        │ Unauthorized│      │ with Secret     │
        └─────────────┘      └─────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                    [Invalid]                  [Valid]
                         │                         │
                         ▼                         ▼
                ┌─────────────┐         ┌─────────────────┐
                │ 401 Error   │         │ Extract userId  │
                │ Invalid     │         │ from Payload    │
                └─────────────┘         └─────────────────┘
                                                │
                                                ▼
                                    ┌───────────────────┐
                                    │ Execute Route     │
                                    │ Handler           │
                                    └───────────────────┘
```

---

## 🤖 AI Integration Flow

```
QUESTION GENERATION
│
├─► interview_agent.py  — orchestrates the full interview session
│   └─► question_selector.py  — semantic matching + difficulty curve
│       └─► sentence-transformers (local embeddings)
│       └─► scikit-learn cosine similarity
│
└─► POST https://openrouter.ai/api/v1/chat/completions
    (model configured via OPENROUTER_API_KEY)
    │
    ▼
┌──────────────────────────────────┐
│  Returns: structured question    │
│  array with category, difficulty │
│  and estimated_time_seconds      │
└──────────────────────────────────┘

ANSWER EVALUATION
│
├─► evaluator.py  — rubric-based scoring
│   └─► rubric_service.py  — per-role rubric templates
│
└─► POST https://openrouter.ai/api/v1/chat/completions
    │
    ▼
┌──────────────────────────────────┐
│  Returns JSON:                   │
│  {                               │
│    final_score: 8.2,             │
│    confidence: 0.87,             │
│    feedback: "Clear answer…",    │
│    spoken_feedback: "Great…",    │
│    next_action: "follow_up"      │
│  }                               │
└──────────────────────────────────┘

SPEECH TRANSCRIPTION (Groq Whisper)
│
└─► POST /api/v2/transcribe  (multipart audio blob)
    └─► transcriber.py → Groq whisper-large-v3-turbo
        └─► returns plain text transcript

TEXT-TO-SPEECH (OpenAI)
│
└─► POST /api/v2/speak  {text: "..."}
    └─► tts.py → OpenAI tts-1, voice "nova" → audio/wav
        Fallback: macOS 'say' command → WAV
```

---

## 🎭 Avatar Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│              TRUGEN AVATAR PIPELINE                           │
└─────────────────────────────────────────────────────────────┘

1. Interview session starts
   │
   └─► TruGenVideoInterviewer.jsx fetchToken()
       └─► GET /api/livekit/token/{interview_id}
           └─► livekit.py issues JWT scoped to room=interview_id

2. Question ready to speak
   │
   └─► avatarRef.current.speak(text)  [TruGenVideoInterviewer.jsx]
       │
       ├─► POST /api/v2/speak {text}  → audio/wav blob
       │
       ├─► new Audio(blobUrl).play()  ← actual OpenAI audio
       │
       └─► LiveKit room: TruGen agent publishes lip-sync video track
           (requires TRUGEN_API_KEY + running livekit-agents worker)

3. Fallback (if LiveKit offline)
   │
   └─► _browserTTSFallback() → window.speechSynthesis (last resort)
       Fallback UI: idle video loop + static avatar image

AVATAR CACHE (avatar_cache.py)
   Redis (7-day TTL) → in-memory dict fallback (256 entries cap)
   Used by /api/avatar/speak (Wav2Lip JSON endpoint)
```

---

## 📄 PDF Processing Flow

```
┌────────────────────────────────────────────────────────────┐
│                  RESUME ANALYSIS                            │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Upload PDF File                 │
        │  POST /api/interview/resume      │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  PyPDF2: Extract Text            │
        │  • Read all pages                │
        │  • Concatenate text              │
        │  • Clean whitespace              │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Send to AI for Analysis         │
        │  System: Extract structured data │
        │  User: Resume text               │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  AI Returns JSON:                │
        │  {                               │
        │    role: "Software Engineer",    │
        │    experience: "3 years",        │
        │    projects: [...],              │
        │    skills: [...]                 │
        │  }                               │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Return to Client                │
        │  (Include original resumeText)   │
        └──────────────────────────────────┘
```

---

## 🔄 Interview Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERVIEW STAGES                          │
└─────────────────────────────────────────────────────────────┘

1. SETUP
   │
   ├─► Upload Resume (Optional)
   │   └─► Extract: role, experience, projects, skills
   │
   └─► Generate Questions (Costs 50 credits)
       └─► Status: "Incompleted"

2. ANSWERING
   │
   ├─► For each question (5 total):
   │   │
   │   ├─► User answers within timeLimit
   │   │
   │   ├─► Submit Answer
   │   │   │
   │   │   └─► AI evaluates:
   │   │       • Confidence (0-10)
   │   │       • Communication (0-10)
   │   │       • Correctness (0-10)
   │   │       • Final Score (average)
   │   │       • Feedback (10-15 words)
   │   │
   │   └─► Next Question

3. COMPLETION
   │
   └─► Finish Interview
       │
       ├─► Calculate Averages:
       │   • Final Score
       │   • Average Confidence
       │   • Average Communication
       │   • Average Correctness
       │
       ├─► Update Status: "completed"
       │
       └─► Return Full Report

4. HISTORY
   │
   └─► View Past Interviews
       └─► View Detailed Reports
```

---

## 📊 Data Flow Summary

```
┌───────────┐
│  Client   │
└─────┬─────┘
      │
      ├─► Authentication (JWT Cookie)
      │   └─► Stored in HTTP-only cookie
      │
      ├─► User Data
      │   ├─► Create/Retrieve user
      │   └─► Track credits
      │
      ├─► Resume Upload
      │   ├─► PDF → Text extraction
      │   └─► AI analysis → Structured data
      │
      ├─► Interview Creation
      │   ├─► Deduct 50 credits
      │   ├─► AI generates 5 questions
      │   └─► Store in PostgreSQL
      │
      ├─► Answer Submission
      │   ├─► AI evaluates answer
      │   └─► Update question scores
      │
      └─► Report Generation
          ├─► Calculate averages
          └─► Return detailed metrics
```

---

## 🎯 Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Web Framework** | FastAPI 0.115 | HTTP server & routing |
| **Database** | PostgreSQL + asyncpg | Async data persistence |
| **ORM** | SQLAlchemy 2.0 (async) | Schema + query layer |
| **Authentication** | python-jose (HS256 JWT) | Token generation/verification |
| **RBAC** | Custom middleware/auth.py | Role enforcement |
| **Validation** | Pydantic v2 | Request/response models |
| **AI — Questions** | OpenRouter | Question generation & evaluation |
| **AI — STT** | Groq Whisper (whisper-large-v3-turbo) | Audio transcription |
| **AI — TTS** | OpenAI tts-1 "nova" | Text-to-speech WAV synthesis |
| **Avatar** | TruGen + LiveKit Agents | Real-time lip-sync video avatar |
| **Avatar Cache** | Redis (aioredis) | TTS+viseme payload cache |
| **PDF** | PyPDF2 | Resume text extraction |
| **HTTP Client** | HTTPX | Async external API calls |
| **Embeddings** | sentence-transformers | Question semantic matching |
| **ASGI Server** | Uvicorn | Production server |

---

## 🚀 Performance Features

- **Async/Await** - Non-blocking I/O operations
- **Connection Pooling** - SQLAlchemy async engine pool
- **Type Validation** - Fast Pydantic validation
- **Auto Documentation** - Zero-overhead OpenAPI
- **CORS Optimization** - Specific origin whitelisting

---

## 🛡️ Security Features

- **JWT Tokens** - Secure authentication
- **HTTP-Only Cookies** - XSS prevention
- **SameSite Cookies** - CSRF prevention
- **Input Validation** - Pydantic models
- **Error Handling** - Safe error messages
- **File Upload Limits** - Size restrictions
- **CORS Configuration** - Origin whitelisting
