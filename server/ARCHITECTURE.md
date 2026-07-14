# FastAPI Backend Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│                    http://localhost:5173                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP Requests (JSON)
                             │ Cookies (JWT Token)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI SERVER                           │
│                   http://localhost:8000                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MIDDLEWARE LAYER                        │   │
│  │  • CORS (localhost:5173)                            │   │
│  │  • Cookie Parser                                     │   │
│  │  • Auth Middleware (JWT Validation)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API ROUTES                              │   │
│  │                                                       │   │
│  │  /api/auth/*        → auth.py                       │   │
│  │  /api/user/*        → user.py                       │   │
│  │  /api/interview/*   → interview.py                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            BUSINESS LOGIC                            │   │
│  │                                                       │   │
│  │  • Request Validation (Pydantic)                    │   │
│  │  • Data Processing                                   │   │
│  │  • Service Calls                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   MongoDB    │ │  OpenRouter  │ │  File System │
    │   Database   │ │   AI API     │ │    (PDF)     │
    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 📂 Request Flow

### Example: Generate Interview Questions

```
1. CLIENT
   │
   └─► POST /api/interview/generate-questions
       Headers: Cookie: token=jwt_token
       Body: {role, experience, mode, resumeText, projects, skills}
       │
       ▼

2. FASTAPI MIDDLEWARE
   │
   ├─► CORS Check ✓
   ├─► Parse Cookie ✓
   ├─► Verify JWT Token → Extract userId ✓
   │
   ▼

3. ROUTE HANDLER (interview.py)
   │
   ├─► Validate Request (Pydantic) ✓
   ├─► Check User Credits ✓
   │
   ▼

4. SERVICE LAYER
   │
   ├─► Call OpenRouter AI Service
   │   └─► Generate 5 Questions
   │
   ├─► Save to MongoDB
   │   └─► Create Interview Document
   │
   └─► Deduct User Credits
       │
       ▼

5. RESPONSE
   │
   └─► Return {interviewId, questions, creditsLeft}
```

---

## 🗂️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  credits: Number (default: 100),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Interviews Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  role: String,
  experience: String,
  mode: String (enum: "HR" | "Technical"),
  resumeText: String,
  questions: [
    {
      question: String,
      difficulty: String (enum: "easy" | "medium" | "hard"),
      timeLimit: Number,
      answer: String,
      feedback: String,
      score: Number (0-10),
      confidence: Number (0-10),
      communication: Number (0-10),
      correctness: Number (0-10)
    }
  ],
  finalScore: Number (0-10),
  status: String (enum: "Incompleted" | "completed"),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## 🔐 Authentication Flow

```
┌────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH LOGIN                       │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  POST /api/auth/google           │
        │  Body: {name, email}             │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Check if user exists in DB      │
        │  • Yes → Get existing user       │
        │  • No  → Create new user         │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Generate JWT Token              │
        │  Payload: {userId, exp}          │
        │  Algorithm: HS256                │
        │  Expires: 7 days                 │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Set HTTP-Only Cookie            │
        │  • Name: "token"                 │
        │  • Value: JWT                    │
        │  • HttpOnly: true                │
        │  • SameSite: strict              │
        │  • MaxAge: 7 days                │
        └──────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │  Return User Data                │
        │  {id, name, email, credits}      │
        └──────────────────────────────────┘
```

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
┌────────────────────────────────────────────────────────────┐
│               AI SERVICE (OpenRouter)                       │
└────────────────────────────────────────────────────────────┘

1. QUESTION GENERATION
   │
   ├─► Prepare System Prompt (Interview Question Rules)
   ├─► Prepare User Prompt (Role, Experience, Resume)
   │
   └─► POST https://openrouter.ai/api/v1/chat/completions
       Model: openai/gpt-4o-mini
       Messages: [system, user]
       │
       ▼
   ┌──────────────────────────────────┐
   │  AI Response: 5 Questions        │
   │  • Question 1 (easy, 60s)        │
   │  • Question 2 (easy, 60s)        │
   │  • Question 3 (medium, 90s)      │
   │  • Question 4 (medium, 90s)      │
   │  • Question 5 (hard, 120s)       │
   └──────────────────────────────────┘

2. ANSWER EVALUATION
   │
   ├─► Prepare System Prompt (Evaluation Criteria)
   ├─► Prepare User Prompt (Question + Answer)
   │
   └─► POST https://openrouter.ai/api/v1/chat/completions
       Model: openai/gpt-4o-mini
       │
       ▼
   ┌──────────────────────────────────┐
   │  AI Response (JSON):             │
   │  {                               │
   │    confidence: 8,                │
   │    communication: 7,             │
   │    correctness: 9,               │
   │    finalScore: 8,                │
   │    feedback: "Great answer..."   │
   │  }                               │
   └──────────────────────────────────┘
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
      │   └─► Store in MongoDB
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
| **Web Framework** | FastAPI | HTTP server & routing |
| **Database** | MongoDB + Motor | Async data persistence |
| **Authentication** | PyJWT | Token generation/verification |
| **Validation** | Pydantic | Request/response validation |
| **AI Service** | OpenRouter | Question generation & evaluation |
| **PDF Processing** | PyPDF2 | Resume text extraction |
| **HTTP Client** | HTTPX | Async API calls |
| **ASGI Server** | Uvicorn | Production server |

---

## 🚀 Performance Features

- **Async/Await** - Non-blocking I/O operations
- **Connection Pooling** - MongoDB connection reuse
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
