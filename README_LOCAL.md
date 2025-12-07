# 🚀 Running Insightly Locally

This guide will help you run all three services (Frontend, Backend, ML Service) locally on your machine.

## 📋 Prerequisites

- Node.js 18+ installed
- Python 3.11+ installed
- npm installed
- PostgreSQL database access (Supabase)

## 🔧 Setup Steps

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (if not exists)
cat > .env << EOF
DATABASE_URL=postgresql://postgres.wekemzpplaowqdxyjgmt:WZLsZW6nwM2N3ylv@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://wekemzpplaowqdxyjgmt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTc3MDYsImV4cCI6MjA3NzI5MzcwNn0.3LBnE7J7eUJFAKZYwjMAKteQCnTd8k19C8W1YiSUFu0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcxNzcwNiwiZXhwIjoyMDc3MjkzNzA2fQ.O7zW2XF6jwv3gYFLsrPyQyRyzo98AYKSg8zQiq3QswA
GROQ_API_KEY=your_groq_api_key_here
ML_SERVICE_URL=http://localhost:8000
EOF

# Start backend
npm run dev
```

Backend will run on: **http://localhost:3001**

### 2. ML Service Setup

```bash
cd ml_service

# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start ML service
uvicorn app:app --reload --port 8000
```

ML Service will run on: **http://localhost:8000**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file (if not exists)
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://wekemzpplaowqdxyjgmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTc3MDYsImV4cCI6MjA3NzI5MzcwNn0.3LBnE7J7eUJFAKZYwjMAKteQCnTd8k19C8W1YiSUFu0
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
EOF

# Start frontend
npm run dev
```

Frontend will run on: **http://localhost:3000**

## 🚀 Quick Start (All Services at Once)

Use the provided script to start all services:

```bash
# Make script executable
chmod +x start-all.sh

# Run all services
./start-all.sh
```

This will start:
- ML Service on port 8000
- Backend on port 3001
- Frontend on port 3000

**Press Ctrl+C to stop all services**

## 📝 Individual Service Commands

### Backend Only
```bash
cd backend
npm run dev
```

### ML Service Only
```bash
cd ml_service
source venv/bin/activate
uvicorn app:app --reload --port 8000
```

### Frontend Only
```bash
cd frontend
npm run dev
```

## 🔍 Verify Services Are Running

- **ML Service**: http://localhost:8000/docs (FastAPI docs)
- **Backend**: http://localhost:3001/_health (Health check)
- **Frontend**: http://localhost:3000 (Main app)

## 📊 View Logs

If using `start-all.sh`, logs are saved to:
- `ml_service.log` - ML Service logs
- `backend.log` - Backend logs
- `frontend.log` - Frontend logs

View logs with:
```bash
tail -f ml_service.log
tail -f backend.log
tail -f frontend.log
```

## ⚠️ Troubleshooting

### Port Already in Use
If a port is already in use:
```bash
# Kill process on port 3001 (Backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 8000 (ML Service)
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000 (Frontend)
lsof -ti:3000 | xargs kill -9
```

### ML Service Dependencies
If ML service fails to start:
```bash
cd ml_service
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Frontend Not Connecting to Backend
Make sure:
1. Backend is running on port 3001
2. `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001`
3. Restart frontend after changing `.env.local`

### Backend Database Connection
Make sure `DATABASE_URL` in `backend/.env` is correct and points to your Supabase database.

---

**Happy coding! 🎉**

