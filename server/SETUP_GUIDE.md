# FastAPI Backend Setup Guide

## 🎯 Quick Start

### Step 1: Install Python
Make sure you have Python 3.8 or higher:
```bash
python --version
# or
python3 --version
```

### Step 2: Create Virtual Environment
```bash
cd /Users/arvindkumar/Downloads/3.interviewIQ/server

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure MongoDB
Edit `.env` file and add your MongoDB connection:
```env
MONGODB_URL=mongodb://localhost:27017/interviewiq
# OR for MongoDB Atlas:
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/interviewiq
```

### Step 5: Run the Server
```bash
# Method 1: Using the run script
./run.sh

# Method 2: Direct Python
python main.py

# Method 3: Using uvicorn directly
uvicorn main:app --reload --port 8000
```

## 🌐 Access the API

- **API Base URL**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

## 📦 Project Structure

```
server/
├── app/
│   ├── config/
│   │   ├── database.py         # MongoDB connection
│   │   ├── jwt_handler.py      # JWT token handling
│   │   └── settings.py         # Environment settings
│   ├── middleware/
│   │   └── auth.py             # Authentication middleware
│   ├── models/
│   │   ├── user.py             # User models
│   │   └── interview.py        # Interview models
│   ├── routes/
│   │   ├── auth.py             # Auth endpoints
│   │   ├── user.py             # User endpoints
│   │   └── interview.py        # Interview endpoints
│   └── services/
│       ├── openrouter_service.py   # AI integration
│       └── pdf_service.py          # PDF processing
├── public/                     # Uploaded files
├── venv/                       # Virtual environment
├── main.py                     # Application entry
├── requirements.txt            # Dependencies
├── .env                        # Environment variables
└── README.md                   # Documentation
```

## 🔧 Environment Variables

Required in `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017/interviewiq` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `OPENROUTER_API_KEY` | OpenRouter AI API key | `sk-or-v1-...` |

## 🚀 Testing the API

### 1. Test Root Endpoint
```bash
curl http://localhost:8000/
```

### 2. Test Google Auth
```bash
curl -X POST http://localhost:8000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### 3. Visit Swagger UI
Open http://localhost:8000/docs in your browser for interactive API testing.

## ⚠️ Common Issues

### Issue: "Module not found"
**Solution**: Make sure virtual environment is activated and dependencies are installed
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: "Cannot connect to MongoDB"
**Solution**: Check if MongoDB is running and URL is correct in `.env`
```bash
# For local MongoDB:
mongod

# Or use MongoDB Atlas cloud database
```

### Issue: "Port already in use"
**Solution**: Change the port in `.env` or kill the process using port 8000
```bash
# Find process
lsof -ti:8000

# Kill process
kill -9 $(lsof -ti:8000)
```

## 📝 What Changed from Node.js?

### ✅ Migrated
- ✅ User authentication (Google OAuth)
- ✅ JWT token handling
- ✅ Resume PDF analysis
- ✅ AI interview question generation
- ✅ Answer submission and evaluation
- ✅ Interview history and reports
- ✅ User credit system

### ❌ Removed
- ❌ Payment integration (Razorpay)
- ❌ Payment routes and controllers
- ❌ Payment model

### 🎨 Improvements
- Modern async Python patterns
- Type safety with Pydantic
- Auto-generated API documentation
- Better error handling
- Cleaner project structure
- Motor async MongoDB driver

## 🔄 Updating Dependencies

To update packages:
```bash
pip install --upgrade package-name
pip freeze > requirements.txt
```

## 🛑 Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

## 📚 Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Motor](https://motor.readthedocs.io/)
- [Pydantic](https://docs.pydantic.dev/)
- [PyJWT](https://pyjwt.readthedocs.io/)
