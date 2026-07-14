#!/bin/bash

# InterviewIQ Server Startup Script

echo "🚀 Starting InterviewIQ Backend..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python3.12 -m venv venv"
    exit 1
fi

# Activate venv
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

# Check Python version
PYTHON_VERSION=$(python -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "🐍 Python version: $PYTHON_VERSION"

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=postgresql" .env 2>/dev/null; then
    echo ""
    echo "⚠️  WARNING: DATABASE_URL not configured in .env"
    echo "Please set: DATABASE_URL=postgresql+asyncpg://postgres:@localhost:5432/interviewiq"
    echo ""
fi

# Start server
echo ""
echo "✅ Starting FastAPI server..."
echo "📚 API Docs: http://localhost:8000/docs"
echo ""

python main.py
