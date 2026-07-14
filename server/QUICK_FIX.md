# ⚡ Quick Fix - Python Version Issue

## Problem
Python 3.14 is too new - `pydantic-core` doesn't have pre-built wheels yet.

## Solution
Use **Python 3.12** (or 3.11) instead.

---

## ✅ Fixed! Steps Taken:

```bash
# 1. Remove old venv
rm -rf venv

# 2. Create new venv with Python 3.12
python3.12 -m venv venv

# 3. Activate
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
```

---

## 🚀 Next Steps

### 1. Setup PostgreSQL

```bash
# Install PostgreSQL
brew install postgresql@16

# Start service
brew services start postgresql@16

# Create database
createdb interviewiq
```

### 2. Update .env

Edit `server/.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:@localhost:5432/interviewiq
```

### 3. Run Server

```bash
# Make sure venv is activated
source venv/bin/activate

# Run
python main.py
```

Server will start on: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

---

## 📝 Why This Happened

- You used `python3.14` which is cutting edge
- Some Python packages don't have pre-built binaries for newest versions yet
- `pydantic-core` needs to compile from source (requires Rust compiler)
- **Solution**: Use Python 3.12 (stable, fully supported)

---

## 💡 Recommended Python Versions

For this project:
- ✅ **Python 3.12** - Best choice (latest stable)
- ✅ **Python 3.11** - Also works great
- ✅ **Python 3.10** - Older but stable
- ⚠️ **Python 3.14** - Too new, avoid for production

---

## 🔍 Check Your Python Version

```bash
# Active in venv
python --version
# Should show: Python 3.12.x

# System versions
python3.12 --version
python3.11 --version
python3.14 --version
```

---

**All fixed! Ready to continue. 🎉**
