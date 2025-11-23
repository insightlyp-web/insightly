# CampusAI Phase 2 - AI Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Student    │  │   Faculty    │  │  HOD/Admin   │          │
│  │   Dashboard  │  │   Dashboard  │  │  Dashboard   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTP/REST API
┌──────────────────────────┼───────────────────────────────────────┐
│                    BACKEND (Express.js)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AI Routes (/student/ai, /faculty/ai, etc.)   │  │
│  │  - Resume Analysis                                        │  │
│  │  - Skill Gap Analysis                                     │  │
│  │  - Placement Recommendations                              │  │
│  │  - Attendance Anomaly Detection                          │  │
│  │  - At-Risk Student Prediction                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│         ┌─────────────────┴─────────────────┐                  │
│         │                                     │                  │
└─────────┼─────────────────────────────────────┼──────────────────┘
          │                                     │
          │ HTTP/REST API                       │ SQL Queries
          │                                     │
┌─────────┼─────────────────────────────────────┼──────────────────┐
│         │                                     │                  │
│  ┌──────▼──────┐                    ┌────────▼────────┐        │
│  │  ML Service │                    │   PostgreSQL    │        │
│  │  (FastAPI)  │                    │   (Supabase)   │        │
│  │             │                    │                │        │
│  │  Port: 8000 │                    │  - Profiles    │        │
│  │             │                    │  - Courses     │        │
│  │  Services:  │                    │  - Attendance │        │
│  │  - Resume   │                    │  - Placements  │        │
│  │  - Skills   │                    │  - Assessments │        │
│  │  - Recommend│                    │                │        │
│  │  - Anomaly  │                    │                │        │
│  │  - Risk     │                    │                │        │
│  └─────────────┘                    └────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Resume Analysis Flow
```
Student Uploads PDF
    ↓
Frontend → POST /student/ai/resume/analyze
    ↓
Backend → POST /ai/resume/parse (ML Service)
    ↓
ML Service: Extract text → Parse → Extract skills/info
    ↓
Backend: Store resume_json in profiles table
    ↓
Frontend: Display parsed data
```

### 2. Skill Gap Analysis Flow
```
Student views Placement Post
    ↓
Frontend → GET /student/ai/skills/gap?post_id=UUID
    ↓
Backend: Fetch student skills (resume_json) + post required_skills
    ↓
Backend → POST /ai/skills/gap (ML Service)
    ↓
ML Service: Compare skills → Calculate match percentage
    ↓
Frontend: Display missing skills, strengths, match score
```

### 3. Placement Recommendation Flow
```
Student Dashboard loads
    ↓
Frontend → GET /student/ai/placement/recommended
    ↓
Backend: Fetch student skills + all active posts
    ↓
Backend → POST /ai/recommend/placements (ML Service)
    ↓
ML Service: Score each post based on skill overlap
    ↓
Backend: Return top 10 recommendations
    ↓
Frontend: Display recommended placements
```

### 4. Attendance Anomaly Detection Flow
```
Student/Faculty views attendance
    ↓
Frontend → GET /student/ai/attendance/anomaly
    ↓
Backend: Fetch attendance records (last 90 days)
    ↓
Backend → POST /ai/attendance/anomaly (ML Service)
    ↓
ML Service: Analyze patterns → Detect anomalies
    ↓
Frontend: Display pattern, anomaly days, recommendations
```

### 5. At-Risk Student Prediction Flow
```
HOD/Faculty views analytics
    ↓
Frontend → GET /hod/ai/risk or /faculty/ai/students/at-risk
    ↓
Backend: Fetch all students + their data (attendance, marks, skills, apps)
    ↓
Backend → POST /ai/risk/predict (ML Service) for each student
    ↓
ML Service: Calculate risk score → Generate recommendations
    ↓
Backend: Return sorted list (high → medium → low risk)
    ↓
Frontend: Display at-risk students table
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)
- **Database**: PostgreSQL (via Supabase)
- **File Upload**: Multer
- **HTTP Client**: Axios (for ML service calls)

### ML Service
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **Libraries**:
  - pdfplumber: PDF text extraction
  - spaCy: Named Entity Recognition (NER)
  - scikit-learn: ML algorithms
  - numpy/pandas: Data processing

### Database
- **Provider**: Supabase (PostgreSQL)
- **Schema**: campus360_dev
- **Key Tables**:
  - `profiles` (with `resume_json` field)
  - `placement_posts`
  - `attendance_records`
  - `assessment_marks`

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
ML_SERVICE_URL=http://localhost:8000
PORT=3001
```

### ML Service (.env)
```
ML_SERVICE_PORT=8000
```

## API Endpoints

### ML Service (FastAPI)
- `POST /ai/resume/parse` - Parse PDF resume
- `POST /ai/skills/gap` - Analyze skill gap
- `POST /ai/recommend/placements` - Get placement recommendations
- `POST /ai/attendance/anomaly` - Detect attendance anomalies
- `POST /ai/risk/predict` - Predict at-risk students
- `GET /health` - Health check

### Backend (Express)
- `POST /student/ai/resume/analyze` - Analyze resume
- `GET /student/ai/skills/gap?post_id=UUID` - Skill gap analysis
- `GET /student/ai/placement/recommended` - Recommended placements
- `GET /student/ai/attendance/anomaly` - Attendance insights
- `GET /faculty/ai/attendance/anomaly?course_id=UUID` - Course attendance anomalies
- `GET /faculty/ai/students/at-risk?course_id=UUID` - At-risk students
- `GET /hod/ai/risk` - All at-risk students
- `GET /hod/ai/skills/gap` - Skill gap distribution
- `GET /admin/ai/placement/success` - Placement success predictions
- `GET /admin/ai/skills/demand` - Skill demand analysis
- `GET /admin/ai/company/skills` - Company-skill heatmap

## Deployment

### ML Service
```bash
cd ml_service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Security Considerations

1. **Authentication**: All backend routes require authentication (JWT tokens)
2. **Authorization**: Role-based access control (RBAC) for each route
3. **File Upload**: PDF files only, size limits enforced
4. **ML Service**: Internal network only (not exposed publicly)
5. **Data Privacy**: Resume data stored securely, not shared

## Performance Optimizations

1. **Caching**: Resume parsing results cached in database
2. **Batch Processing**: At-risk predictions can be batched
3. **Async Processing**: Heavy ML tasks can be queued
4. **Database Indexing**: Indexes on frequently queried fields

## Future Enhancements

1. **Redis Caching**: Cache ML service responses
2. **Worker Queue**: Background job processing (Bull/BullMQ)
3. **Real-time Updates**: WebSocket for live analytics
4. **Advanced ML**: Deep learning models for better predictions
5. **Multi-language Support**: Resume parsing in multiple languages

