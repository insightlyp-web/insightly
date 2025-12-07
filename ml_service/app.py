"""
CampusAI ML Service - FastAPI Application
Main entry point for all AI/ML endpoints
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from typing import List, Optional
from pydantic import BaseModel

from services.resume import ResumeParser
from services.skills import SkillGapAnalyzer
from services.recommend import PlacementRecommender
from services.attendance import AttendanceAnomalyDetector
from services.risk import RiskPredictor

app = FastAPI(title="CampusAI ML Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
resume_parser = ResumeParser()
skill_gap_analyzer = SkillGapAnalyzer()
placement_recommender = PlacementRecommender()
attendance_detector = AttendanceAnomalyDetector()
risk_predictor = RiskPredictor()


# ==================== RESUME PARSING ====================

@app.post("/ai/resume/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse PDF resume and extract structured information
    """
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        contents = await file.read()
        result = await resume_parser.parse_pdf(contents)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")


# ==================== SKILL GAP ANALYSIS ====================

class SkillGapRequest(BaseModel):
    student_skills: List[str]
    required_skills: List[str]

@app.post("/ai/skills/gap")
async def analyze_skill_gap(request: SkillGapRequest):
    """
    Analyze skill gap between student skills and required skills
    """
    try:
        result = skill_gap_analyzer.analyze(
            student_skills=request.student_skills,
            required_skills=request.required_skills
        )
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing skill gap: {str(e)}")


# ==================== PLACEMENT RECOMMENDATIONS ====================

class PostInfo(BaseModel):
    id: str
    required_skills: List[str]
    company: str
    title: Optional[str] = None

class RecommendationRequest(BaseModel):
    skills: List[str]
    posts: List[PostInfo]

@app.post("/ai/recommend/placements")
async def recommend_placements(request: RecommendationRequest):
    """
    Recommend placement posts based on student skills
    """
    try:
        # Convert Pydantic models to dictionaries
        posts_dict = [post.dict() for post in request.posts]
        result = placement_recommender.recommend(
            skills=request.skills,
            posts=posts_dict
        )
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


# ==================== ATTENDANCE ANOMALY DETECTION ====================

class AttendanceRecord(BaseModel):
    date: str
    status: int  # 1 for present, 0 for absent

class AttendanceAnomalyRequest(BaseModel):
    records: List[AttendanceRecord]

@app.post("/ai/attendance/anomaly")
async def detect_attendance_anomaly(request: AttendanceAnomalyRequest):
    """
    Detect anomalies in attendance patterns
    """
    try:
        # Convert Pydantic models to dictionaries
        records_dict = [record.dict() for record in request.records]
        result = attendance_detector.detect_anomalies(
            records=records_dict
        )
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies: {str(e)}")


# ==================== AT-RISK STUDENT PREDICTION ====================

class RiskPredictionRequest(BaseModel):
    attendance: float  # 0-100 percentage
    internal_marks: List[float]
    skills_count: int
    applications_count: int
    semester: int

@app.post("/ai/risk/predict")
async def predict_risk(request: RiskPredictionRequest):
    """
    Predict if a student is at-risk
    """
    try:
        result = risk_predictor.predict(
            attendance=request.attendance,
            internal_marks=request.internal_marks,
            skills_count=request.skills_count,
            applications_count=request.applications_count,
            semester=request.semester
        )
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting risk: {str(e)}")


# ==================== ROOT & HEALTH CHECK ====================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "CampusAI ML Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "resume_parse": "POST /ai/resume/parse",
            "skill_gap": "POST /ai/skills/gap",
            "recommendations": "POST /ai/recommend/placements",
            "attendance_anomaly": "POST /ai/attendance/anomaly",
            "risk_prediction": "POST /ai/risk/predict"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "CampusAI ML Service"}


if __name__ == "__main__":
    # Use PORT environment variable (Railway provides this) or default to 8000 for local dev
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

