# 🎓 Insightly - AI-Powered Attendance & Student Analytics

Complete platform for managing student attendance, analytics, and placement with AI-powered insights.

## 🚀 Quick Start (Local Development)

### Option 1: Start All Services at Once (Recommended)

```bash
./start-local.sh
```

This will automatically:
- ✅ Start ML Service on port 8000
- ✅ Start Backend on port 3001
- ✅ Start Frontend on port 3000
- ✅ Create `.env` files if missing
- ✅ Install dependencies if needed

### Option 2: Start Services Individually

See [README_LOCAL.md](./README_LOCAL.md) for detailed instructions.

## 📁 Project Structure

```
Insightly/
├── frontend/          # Next.js frontend (port 3000)
├── backend/           # Node.js/Express backend (port 3001)
├── ml_service/        # Python FastAPI ML service (port 8000)
└── start-local.sh     # Script to start all services
```

## 🌐 Service URLs (Local)

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **ML Service**: http://localhost:8000
- **ML Service Docs**: http://localhost:8000/docs

## 📝 Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `GROQ_API_KEY` - Groq API key for Nixi AI
- `ML_SERVICE_URL` - ML service URL (http://localhost:8000 for local)

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` - Backend URL (http://localhost:3001 for local)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## 🛠️ Prerequisites

- Node.js 18+
- Python 3.11+
- npm
- PostgreSQL (Supabase)

## 📚 Documentation

- [Local Development Guide](./README_LOCAL.md) - Detailed local setup
- [Backend Environment Check](./BACKEND_ENV_CHECK.md) - Backend configuration
- [Frontend Deployment](./FRONTEND_DEPLOYMENT.md) - Frontend deployment guide
- [Railway Deployment](./RAILWAY_DEPLOYMENT.md) - ML service deployment

## 🎯 Features

- ✅ Role-based access (Student, Faculty, HOD, Admin)
- ✅ AI-powered attendance analytics
- ✅ Location-based attendance
- ✅ Placement management
- ✅ Nixi AI Chatbot
- ✅ Risk prediction
- ✅ Skill gap analysis

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:8000 | xargs kill -9  # ML Service
```

### Services Not Starting
1. Check if dependencies are installed
2. Verify environment variables are set
3. Check logs: `tail -f backend.log` or `tail -f frontend.log`

---

**For detailed setup instructions, see [README_LOCAL.md](./README_LOCAL.md)**

