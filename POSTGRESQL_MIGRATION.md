# 🐘 PostgreSQL Migration Complete!

## ✅ Database Changed: MongoDB → PostgreSQL

The backend database has been successfully migrated from **MongoDB** to **PostgreSQL**.

---

## 🎯 What Changed

### Database Layer
- ❌ **Removed**: MongoDB + Motor (async driver)
- ✅ **Added**: PostgreSQL + SQLAlchemy + AsyncPG

### Data Model
- ❌ **Removed**: Document-based (JSON documents)
- ✅ **Added**: Relational (SQL tables with foreign keys)

### ORM/Driver
- ❌ **Removed**: Mongoose-style operations
- ✅ **Added**: SQLAlchemy ORM with async support

---

## 📊 Database Schema

### Before (MongoDB Collections)

**users** collection:
```json
{
  "_id": ObjectId,
  "name": "string",
  "email": "string",
  "credits": 100,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**interviews** collection:
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "role": "string",
  "experience": "string",
  "mode": "HR|Technical",
  "resumeText": "string",
  "questions": [
    {
      "question": "string",
      "difficulty": "easy|medium|hard",
      "timeLimit": 60,
      "answer": "string",
      "feedback": "string",
      "score": 8.5,
      "confidence": 8,
      "communication": 7,
      "correctness": 9
    }
  ],
  "finalScore": 8.0,
  "status": "Incompleted|completed"
}
```

### After (PostgreSQL Tables)

**users** table:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    credits INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**interviews** table:
```sql
CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR NOT NULL,
    experience VARCHAR NOT NULL,
    mode VARCHAR NOT NULL,
    resume_text TEXT,
    final_score FLOAT DEFAULT 0,
    status VARCHAR DEFAULT 'Incompleted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**questions** table:
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    difficulty VARCHAR NOT NULL,
    time_limit INTEGER NOT NULL,
    answer TEXT DEFAULT '',
    feedback TEXT DEFAULT '',
    score FLOAT DEFAULT 0,
    confidence FLOAT DEFAULT 0,
    communication FLOAT DEFAULT 0,
    correctness FLOAT DEFAULT 0
);
```

---

## 🔧 Setup PostgreSQL

### Quick Start

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb interviewiq

# Update .env
DATABASE_URL=postgresql+asyncpg://postgres:@localhost:5432/interviewiq

# Run application (tables created automatically)
python main.py
```

For detailed setup, see **`server/POSTGRESQL_SETUP.md`**

---

## 📝 Environment Variable Change

### Before (.env)
```env
MONGODB_URL=mongodb://localhost:27017/interviewiq
```

### After (.env)
```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/interviewiq
```

---

## 🔄 Code Changes Summary

### Dependencies (requirements.txt)
```diff
- motor==3.6.0
- pymongo==4.10.1
+ sqlalchemy==2.0.36
+ asyncpg==0.30.0
+ alembic==1.14.0
```

### Models
- Changed from Pydantic-only to **SQLAlchemy models** + Pydantic schemas
- Added proper relationships (ForeignKey)
- Replaced ObjectId with Integer IDs

### Database Operations
```python
# Before (MongoDB)
user = await users_collection.find_one({"email": email})
await users_collection.insert_one({"name": "John"})

# After (PostgreSQL)
result = await db.execute(select(User).where(User.email == email))
user = result.scalar_one_or_none()
db.add(User(name="John"))
await db.commit()
```

---

## ✨ Benefits of PostgreSQL

### 1. **Data Integrity**
- Foreign key constraints
- ACID transactions
- Referential integrity

### 2. **Better Querying**
- Complex JOINs
- Aggregations
- Full SQL power

### 3. **Type Safety**
- Schema enforcement
- Column type validation
- Not null constraints

### 4. **Relationships**
- One-to-many (User → Interviews)
- One-to-many (Interview → Questions)
- Cascade deletes

### 5. **Indexing**
- Primary keys (id)
- Foreign keys (user_id, interview_id)
- Unique constraints (email)

---

## 🚀 Quick Setup Commands

```bash
# 1. Setup PostgreSQL
brew install postgresql@16
brew services start postgresql@16
createdb interviewiq

# 2. Update environment
cd server
# Edit .env: DATABASE_URL=postgresql+asyncpg://postgres:@localhost:5432/interviewiq

# 3. Install dependencies
source venv/bin/activate
pip install -r requirements.txt

# 4. Run (tables created automatically)
python main.py
```

---

## 🐛 Common Issues

### "could not connect to server"
```bash
brew services start postgresql@16
```

### "database does not exist"
```bash
createdb interviewiq
```

### "asyncpg not found"
```bash
pip install asyncpg sqlalchemy
```

---

## 📚 Additional Resources

- **Setup Guide**: `server/POSTGRESQL_SETUP.md`
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **AsyncPG Docs**: https://magicstack.github.io/asyncpg/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## ✅ Verification

After running `python main.py`, verify:

```sql
# Connect to database
psql interviewiq

# List tables
\dt

# Should see:
# - users
# - interviews
# - questions

# View schema
\d users
\d interviews
\d questions
```

---

## 🎯 Next Steps

1. ✅ Read `server/POSTGRESQL_SETUP.md` for detailed setup
2. ✅ Install and start PostgreSQL
3. ✅ Create `interviewiq` database
4. ✅ Update `DATABASE_URL` in `.env`
5. ✅ Run `python main.py` (tables auto-created)
6. ✅ Test at http://localhost:8000/docs

---

**Migration complete! PostgreSQL is ready to use. 🎉**
