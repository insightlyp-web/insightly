# Phase 2 AI Setup Guide

## Prerequisites

1. Python 3.9+ installed
2. Node.js 18+ installed
3. PostgreSQL database (Supabase)
4. All Phase 1 components working

## Step 1: Database Migration

Run the migration to add AI-related fields:

```bash
cd backend
npm run migrate:ai
```

Or directly:
```bash
cd backend
node migrate-ai-fields.js
```

This adds the `resume_json` field to the `profiles` table and creates the necessary indexes.

## Step 2: Install ML Service Dependencies

```bash
cd ml_service
pip install -r requirements.txt
```

**Note**: If `python -m spacy download en_core_web_sm` doesn't work, install the model directly:
```bash
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl
```

**Python Version**: The requirements are compatible with Python 3.8+. If you encounter version conflicts, ensure you're using Python 3.8 or higher.

## Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install the new `form-data` package needed for file uploads.

## Step 4: Configure Environment Variables

### Backend (.env)
Add the ML service URL:
```env
ML_SERVICE_URL=http://localhost:8000
```

### ML Service (.env)
```env
ML_SERVICE_PORT=8000
```

## Step 5: Start Services

### Terminal 1: ML Service
```bash
cd ml_service
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
```

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```

## Step 6: Verify Setup

1. **ML Service Health Check**:
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"healthy","service":"CampusAI ML Service"}`

2. **Backend Health Check**:
   ```bash
   curl http://localhost:3001/_health
   ```
   Should return: `{"status":"ok"}`

3. **Test Resume Upload**:
   - Login as a student
   - Navigate to `/student/resume`
   - Upload a PDF resume
   - Verify it parses correctly

## Features Overview

### Student Features
- **Resume Analysis** (`/student/resume`): Upload PDF resume, extract skills and information
- **AI Recommended Placements**: Dashboard shows personalized job recommendations
- **Skill Gap Analysis**: View placement posts to see skill gaps
- **Attendance Insights**: AI analyzes attendance patterns and detects anomalies

### Faculty Features
- **Attendance Anomalies** (`/faculty/courses/[id]`): View students with abnormal attendance
- **At-Risk Students** (`/faculty/courses/[id]`): Identify students who may need support

### HOD Features
- **At-Risk Students Dashboard**: View all at-risk students in the department
- **Skill Gap Distribution**: Analyze skill gaps across the department

### Admin Features
- **Placement Success Predictions**: Predict which students are likely to succeed
- **Skill Demand Analysis**: Analyze skill demand vs supply
- **Company-Skill Heatmap**: Visualize which companies need which skills

## Troubleshooting

### ML Service Not Starting
- Check Python version: `python --version` (should be 3.9+)
- Verify spaCy model: `python -m spacy download en_core_web_sm`
- Check port 8000 is available: `lsof -i :8000`

### Backend Can't Connect to ML Service
- Verify ML service is running: `curl http://localhost:8000/health`
- Check `ML_SERVICE_URL` in backend `.env`
- Check firewall/network settings

### Resume Upload Fails
- Verify file is PDF format
- Check file size (should be < 10MB)
- Check backend logs for errors
- Verify `form-data` package is installed

### No AI Recommendations
- Ensure student has uploaded a resume
- Check `resume_json` field in database has skills
- Verify ML service is responding

## Next Steps

1. **Add AI components to existing pages**:
   - Add `AIAtRiskStudents` to faculty course pages
   - Add `AIAtRiskStudents` to HOD dashboard
   - Add `AIPlacementSuccess` to admin analytics

2. **Customize AI algorithms**:
   - Adjust risk prediction thresholds in `ml_service/services/risk.py`
   - Tune skill matching in `ml_service/services/recommend.py`
   - Improve resume parsing in `ml_service/services/resume.py`

3. **Add caching** (optional):
   - Install Redis
   - Cache ML service responses
   - Reduce database queries

4. **Add background jobs** (optional):
   - Install Bull/BullMQ
   - Queue heavy ML tasks
   - Process in background

## Support

For issues or questions:
1. Check logs in each service
2. Verify all services are running
3. Check database connection
4. Review ARCHITECTURE.md for system design

