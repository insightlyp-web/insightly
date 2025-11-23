# CampusAI - Complete Setup & Run Guide

This guide will help you set up and run the entire CampusAI project with all services and credentials.

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.8 or higher)
- **PostgreSQL** (v12 or higher)
- **Supabase Account** (for authentication)
- **npm** or **yarn**

## 🔧 Environment Setup

### 1. Clone and Navigate
```bash
cd CampusAI
```

### 2. Backend Environment Variables

Create `backend/.env` file:
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ML Service
ML_SERVICE_URL=http://localhost:8000

# Server
PORT=5000
NODE_ENV=development
```

### 3. Frontend Environment Variables

Create `frontend/.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. ML Service Environment

The ML service doesn't require environment variables by default, but you can create `ml_service/.env` if needed.

## 🗄️ Database Setup

### 1. Create Database Schema

```bash
cd backend
psql $DATABASE_URL -f sql/001_schema.sql
psql $DATABASE_URL -f sql/002_add_student_fields.sql
psql $DATABASE_URL -f sql/003_add_ai_fields.sql
```

Or use the migration script:
```bash
npm run migrate:ai
```

## 🚀 Running the Project

### Step 1: Start ML Service (Python FastAPI)

```bash
cd ml_service

# Install dependencies (first time only)
pip install -r requirements.txt

# Download spaCy model (first time only)
python -m spacy download en_core_web_sm

# Start the service
uvicorn app:app --reload --port 8000
```

The ML service will run on: `http://localhost:8000`

### Step 2: Start Backend (Node.js/Express)

```bash
cd backend

# Install dependencies (first time only)
npm install

# Start the server
npm run dev
```

The backend will run on: `http://localhost:5000`

### Step 3: Start Frontend (Next.js)

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The frontend will run on: `http://localhost:3000`

## 👥 User Credentials

### Option 1: Use Existing Seeded Users

If you've run the seed scripts, you can use these credentials:

#### Student Accounts

| Email | Password | Department | Year |
|-------|----------|------------|------|
| `student1@campusai.com` | `student123` | CS | I |
| `student2@campusai.com` | `student123` | CS | I |
| `student3@campusai.com` | `student123` | CS | II |
| `student4@campusai.com` | `student123` | CS | II |
| `student5@campusai.com` | `student123` | CS | III |
| `student6@campusai.com` | `student123` | CS | III |
| `student7@campusai.com` | `student123` | CS | IV |
| `student8@campusai.com` | `student123` | CS | IV |

#### Faculty Accounts

| Email | Password | Department |
|-------|----------|------------|
| `faculty1@campusai.com` | `faculty123` | CS |
| `faculty2@campusai.com` | `faculty123` | CS |
| `faculty3@campusai.com` | `faculty123` | CS |
| `faculty4@campusai.com` | `faculty123` | CS |

#### HOD Account

| Email | Password | Department |
|-------|----------|------------|
| `hod@campusai.com` | `HOD123!@#` | CS |

#### Admin Account

| Email | Password |
|-------|----------|
| `admin@campusai.com` | `admin123` |

### Option 2: Create New Users via Signup

1. Go to `http://localhost:3000/signup`
2. Fill in the form with:
   - **Email**: Your email
   - **Password**: Your password
   - **Full Name**: Your name
   - **Role**: Select Student/Faculty/HOD/Admin
   - **Department**: Select department (not required for Admin)
   - **Phone**: Your phone number

### Option 3: Create Users via Scripts

#### Create Admin User
```bash
cd backend
node create_admin_user.js admin@campusai.com admin123 "Admin User"
```

#### Create HOD User
```bash
cd backend
node create_hod_user.js hod@campusai.com "HOD123!@#" CS
```

#### Seed Student/Faculty Data
```bash
cd backend
node src/seed/seedStudentFacultyData.js
```

Then create Supabase Auth users:
```bash
node create_seeded_users.js
```

## 🔐 Important Notes

1. **Supabase Users**: The seed scripts create database profiles, but you need to create Supabase Auth users separately. Use the signup page or Supabase Dashboard.

2. **Password Reset**: If you need to reset a password:
   - Go to Supabase Dashboard → Authentication → Users
   - Find the user and click "Reset Password" or "Update User"

3. **Profile Creation**: After creating a Supabase Auth user, the profile is created automatically on first login via the signup endpoint.

## 📱 Accessing the Application

1. **Login Page**: `http://localhost:3000/login`
2. **Signup Page**: `http://localhost:3000/signup`

After login, users are redirected to their respective dashboards:
- **Students**: `/student/dashboard`
- **Faculty**: `/faculty/dashboard`
- **HOD**: `/hod/dashboard`
- **Admin**: `/admin/dashboard`

## 🧪 Testing the Setup

### 1. Check ML Service
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy", "service": "CampusAI ML Service"}
```

### 2. Check Backend
```bash
curl http://localhost:5000/health
```

### 3. Check Frontend
Open `http://localhost:3000` in your browser.

## 🐛 Troubleshooting

### ML Service Issues
- **Port 8000 already in use**: Change port in `uvicorn` command
- **spaCy model not found**: Run `python -m spacy download en_core_web_sm`
- **Python version**: Ensure Python 3.8+ is installed

### Backend Issues
- **Database connection error**: Check `DATABASE_URL` in `.env`
- **Port 5000 already in use**: Change `PORT` in `.env`
- **Supabase errors**: Verify Supabase credentials in `.env`

### Frontend Issues
- **Port 3000 already in use**: Next.js will automatically use 3001
- **API connection error**: Ensure backend is running on port 5000
- **Supabase errors**: Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Login Issues
- **"Invalid email or password"**: User exists in database but not in Supabase Auth
  - Solution: Create user in Supabase Dashboard or use signup page
- **"Profile not found"**: User exists in Supabase Auth but not in database
  - Solution: Run signup endpoint or create profile manually

## 📚 Project Structure

```
CampusAI/
├── backend/          # Node.js/Express API
├── frontend/         # Next.js React App
├── ml_service/      # Python FastAPI ML Service
└── sql/             # Database migrations
```

## 🔄 Quick Start (All Services)

Create a `start-all.sh` script:

```bash
#!/bin/bash

# Start ML Service
cd ml_service
uvicorn app:app --reload --port 8000 &
ML_PID=$!

# Start Backend
cd ../backend
npm run dev &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "All services started!"
echo "ML Service: http://localhost:8000"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $ML_PID $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

Make it executable:
```bash
chmod +x start-all.sh
./start-all.sh
```

## 📝 Default Credentials Summary

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Student** | `student1@campusai.com` | `student123` | Multiple students available |
| **Faculty** | `faculty1@campusai.com` | `faculty123` | Multiple faculty available |
| **HOD** | `hod@campusai.com` | `HOD123!@#` | Department: CS |
| **Admin** | `admin@campusai.com` | `admin123` | Full access |

## 🎯 Next Steps

1. **Seed Data**: Run seed scripts to populate database with sample data
2. **Upload Resumes**: Students can upload resumes for AI analysis
3. **Create Courses**: Faculty/HOD can create courses and timetables
4. **Post Placements**: Admin can create placement posts
5. **View Analytics**: All roles have access to AI-powered analytics

---

**Need Help?** Check the `ARCHITECTURE.md` file for system architecture details.

