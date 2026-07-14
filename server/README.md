# InterviewIQ FastAPI Backend

Backend API for InterviewIQ - AI-powered interview preparation platform.

## 🚀 Technology Stack

- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **PyJWT** - JSON Web Token authentication
- **PyPDF2** - PDF text extraction
- **OpenRouter AI** - AI question generation and evaluation

## 📋 Prerequisites

- Python 3.8+
- MongoDB (local or Atlas)
- pip or virtualenv

## 🔧 Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Edit the `.env` file and add your MongoDB connection string:

```env
PORT=8000
MONGODB_URL=mongodb://localhost:27017/interviewiq  # or your MongoDB Atlas URL
JWT_SECRET=DSY29QURD12R23TFNO1FFFTY13
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 4. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --port 8000
```

The server will be available at: **http://localhost:8000**

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/logout` - Logout user

### User
- `GET /api/user/current-user` - Get current user info (protected)

### Interview
- `POST /api/interview/resume` - Upload and analyze resume PDF (protected)
- `POST /api/interview/generate-questions` - Generate interview questions (protected)
- `POST /api/interview/submit-answer` - Submit answer for evaluation (protected)
- `POST /api/interview/finish` - Finish interview and get final scores (protected)
- `GET /api/interview/get-interview` - Get user's interview history (protected)
- `GET /api/interview/report/{id}` - Get detailed interview report (protected)

## 🔒 Authentication

The API uses JWT tokens stored in HTTP-only cookies. Protected routes require authentication via the `token` cookie.

## 🏗️ Project Structure

```
server/
├── app/
│   ├── config/          # Configuration (database, JWT, settings)
│   ├── middleware/      # Authentication middleware
│   ├── models/          # Pydantic models
│   ├── routes/          # API endpoints
│   └── services/        # Business logic (AI, PDF)
├── public/              # Uploaded files
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
└── .env                 # Environment variables
```

## ⚙️ Key Features

- **Async/Await** - Full async support for better performance
- **JWT Authentication** - Secure token-based auth
- **MongoDB Integration** - NoSQL database with async Motor driver
- **AI Integration** - OpenRouter AI for question generation and answer evaluation
- **PDF Processing** - Extract text from resume PDFs
- **Credit System** - User credits for interview generation

## 🔄 Migrated from Node.js

This backend was completely rewritten from Express.js to FastAPI with the following improvements:

- Modern Python async patterns
- Type safety with Pydantic models
- Auto-generated API documentation
- Better error handling
- Cleaner code structure
- Removed payment integration (Razorpay)

## 🛠️ Development

For development with auto-reload:

```bash
uvicorn main:app --reload --port 8000
```

## 📝 Notes

- Payment integration has been removed
- All routes are async for better performance
- JWT tokens are stored in HTTP-only cookies for security
- CORS is configured for `http://localhost:5173` (frontend)
