# 🎉 Final Setup - You're Almost There!

## ✅ All Dependencies Now Installed!

All Python packages are installed and working:
- ✅ FastAPI, SQLAlchemy, AsyncPG
- ✅ email-validator
- ✅ greenlet (SQLAlchemy async support)
- ✅ All 40+ dependencies

---

## 🐘 Last Step: PostgreSQL Setup

### **Option 1: Local PostgreSQL (Recommended for Development)**

```bash
# 1. Install PostgreSQL
brew install postgresql@16

# 2. Start PostgreSQL service
brew services start postgresql@16

# 3. Create database
createdb interviewiq

# 4. Test connection (optional)
psql -l | grep interviewiq
```

**Update `.env`:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:@localhost:5432/interviewiq
```

---

### **Option 2: Docker PostgreSQL (Fast & Clean)**

```bash
# Run PostgreSQL in Docker
docker run --name interviewiq-postgres \
  -e POSTGRES_DB=interviewiq \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16

# Verify it's running
docker ps | grep postgres
```

**Update `.env`:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/interviewiq
```

---

### **Option 3: Cloud PostgreSQL - Supabase (Free Forever)**

**Best for:** No local setup, always accessible

1. **Sign Up**: Go to [supabase.com](https://supabase.com)
2. **Create Project**: Click "New Project"
   - Choose organization
   - Enter project name: `interviewiq`
   - Database password: (save this!)
   - Region: Choose closest to you
   - Wait 2 minutes for setup

3. **Get Connection String**:
   - Go to: Project Settings → Database
   - Scroll to "Connection string"
   - Select "Session Mode" (not Transaction)
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your password

4. **Modify Connection String**:
   ```
   # Original (from Supabase)
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   
   # Change to (for asyncpg)
   postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

**Update `.env`:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
```

---

### **Option 4: Neon (Serverless PostgreSQL)**

1. Go to [neon.tech](https://neon.tech)
2. Sign up / Create project
3. Copy connection string
4. Replace `postgresql://` with `postgresql+asyncpg://`

---

## 🚀 Run The Server

After setting up PostgreSQL:

```bash
# Activate virtual environment
source venv/bin/activate

# Run server
python main.py
```

**Expected Output:**
```
✅ Database Connected
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 🌐 Access Your API

Once running:

- **Server**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

---

## 🔍 Verify Everything Works

### 1. Check API Root
```bash
curl http://localhost:8000/
# Should return: {"message":"InterviewIQ API is running"}
```

### 2. Check Database Tables
The server automatically creates tables on first run!

**For local PostgreSQL:**
```bash
psql interviewiq
\dt
# Should see: users, interviews, questions
\q
```

**For Docker:**
```bash
docker exec -it interviewiq-postgres psql -U postgres -d interviewiq
\dt
\q
```

**For Supabase:**
- Go to Table Editor in Supabase dashboard
- Should see: users, interviews, questions tables

### 3. Test API in Browser
Open http://localhost:8000/docs and try:
- Expand any endpoint
- Click "Try it out"
- Fill in parameters
- Click "Execute"

---

## 🐛 Troubleshooting

### Error: "could not connect to server"

**For local PostgreSQL:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start if not running
brew services start postgresql@16

# Check process
ps aux | grep postgres
```

**For Docker:**
```bash
# Check container status
docker ps -a | grep postgres

# Start if stopped
docker start interviewiq-postgres
```

### Error: "database does not exist"

**For local:**
```bash
createdb interviewiq
```

**For Docker:**
```bash
docker exec -it interviewiq-postgres createdb -U postgres interviewiq
```

### Error: "password authentication failed"

- Check DATABASE_URL in `.env`
- Verify username and password are correct
- For Docker, default is `postgres:postgres`
- For Supabase, use password from project creation

### Error: "port 5432 already in use"

Another PostgreSQL instance is running:
```bash
# Find process
lsof -i :5432

# Stop brew PostgreSQL
brew services stop postgresql@16

# Or use different port in Docker
docker run -p 5433:5432 ...
# Then use :5433 in DATABASE_URL
```

---

## 📋 Complete .env Configuration

Your final `.env` should look like:

```env
PORT=8000
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/interviewiq
JWT_SECRET=DSY29QURD12R23TFNO1FFFTY13
OPENROUTER_API_KEY=your_openrouter_api_key
```

Replace:
- `password` with your actual PostgreSQL password (or remove `:password` for local no-password setup)
- `localhost` with your database host (or keep for local)
- `interviewiq` with your database name (or keep)

---

## ✅ Success Checklist

Before moving forward, verify:

- [ ] PostgreSQL is installed and running
- [ ] Database `interviewiq` exists
- [ ] `DATABASE_URL` configured in `.env`
- [ ] Virtual environment activated (`source venv/bin/activate`)
- [ ] Server starts without errors (`python main.py`)
- [ ] Can access http://localhost:8000/docs
- [ ] Database tables created (users, interviews, questions)

---

## 🎯 Next: Test the API

### Test Authentication
```bash
curl -X POST http://localhost:8000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

### Or use Swagger UI
1. Go to http://localhost:8000/docs
2. Find `POST /api/auth/google`
3. Click "Try it out"
4. Enter name and email
5. Click "Execute"

---

## 📚 Additional Resources

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Supabase Guide**: https://supabase.com/docs/guides/database
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/

---

## 🎉 You're Done!

Once the server is running:
1. Start the frontend: `cd ../client && npm install && npm run dev`
2. Open http://localhost:5173
3. Test the complete application!

**Congratulations! Your backend is fully migrated to FastAPI + PostgreSQL! 🚀**
