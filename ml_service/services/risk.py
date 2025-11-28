"""
At-Risk Student Prediction Service
Predicts if a student is at-risk based on multiple factors
"""
from typing import List, Dict, Any


class RiskPredictor:
    def __init__(self):
        # Risk thresholds
        self.ATTENDANCE_THRESHOLD_HIGH_RISK = 65  # Below 65% = high risk
        self.ATTENDANCE_THRESHOLD_MEDIUM_RISK = 60  # 60-65% = medium risk
        self.ATTENDANCE_THRESHOLD_LOW = 50  # Very low attendance
        self.ATTENDANCE_THRESHOLD_MEDIUM = 70  # Low attendance
        self.MARKS_THRESHOLD_LOW = 40  # Changed from 50
        self.MARKS_THRESHOLD_MEDIUM = 55  # Changed from 65
        self.SKILLS_THRESHOLD_LOW = 2  # Changed from 3 (less strict for students without resumes)
        self.APPLICATIONS_THRESHOLD_LOW = 1
    
    def predict(self, attendance: float, internal_marks: List[float], 
                skills_count: int, applications_count: int, semester: int) -> Dict[str, Any]:
        """
        Predict if a student is at-risk
        
        Args:
            attendance: Attendance percentage (0-100)
            internal_marks: List of internal assessment marks
            skills_count: Number of skills the student has
            applications_count: Number of placement applications
            semester: Current semester number
            
        Returns:
            Dictionary with risk_level and recommendations
        """
        risk_factors = []
        risk_score = 0
        
        # Factor 1: Attendance
        # Below 65% = high risk, 60-65% = medium risk
        # If attendance is 100%, it means no data was available, so don't penalize
        if attendance < self.ATTENDANCE_THRESHOLD_HIGH_RISK and attendance < 100:
            if attendance < self.ATTENDANCE_THRESHOLD_MEDIUM_RISK:
                # Below 60% = high risk
                risk_factors.append("Very low attendance (below 60%)")
                risk_score += 5.0  # High risk - enough to trigger high risk level
            else:
                # 60-65% = medium risk
                risk_factors.append("Low attendance (60-65%)")
                risk_score += 3.0  # Medium risk - enough to trigger medium risk level
        elif attendance < self.ATTENDANCE_THRESHOLD_MEDIUM and attendance < 100:
            risk_factors.append("Low attendance")
            risk_score += 1.5  # Low-medium risk
        
        # Factor 2: Internal Marks
        if internal_marks:
            avg_marks = sum(internal_marks) / len(internal_marks)
            if avg_marks < self.MARKS_THRESHOLD_LOW:
                risk_factors.append("Very low academic performance")
                risk_score += 2.5  # Balanced value
            elif avg_marks < self.MARKS_THRESHOLD_MEDIUM:
                risk_factors.append("Below average academic performance")
                risk_score += 1.5  # Balanced value
            
            # Check for declining trend (only if significant drop)
            if len(internal_marks) >= 3:
                recent_avg = sum(internal_marks[-2:]) / 2
                earlier_avg = sum(internal_marks[:-2]) / len(internal_marks[:-2])
                if recent_avg < earlier_avg - 12:  # Balanced: 12 point drop
                    risk_factors.append("Declining academic performance")
                    risk_score += 1
        else:
            # No assessment data - don't penalize at all for early semesters
            if semester <= 2:
                # Don't add any risk factors or score for early semesters
                pass
            else:
                risk_factors.append("No assessment data available")
                risk_score += 0.5
        
        # Factor 3: Skills (only penalize if student has uploaded resume but still has few skills)
        if skills_count > 0 and skills_count < self.SKILLS_THRESHOLD_LOW:
            risk_factors.append("Limited technical skills")
            risk_score += 1
        elif skills_count == 0:
            # No resume uploaded - don't penalize at all (not a risk factor)
            pass
        
        # Factor 4: Placement Applications (only penalize if student is in final year)
        if semester >= 3 and applications_count < self.APPLICATIONS_THRESHOLD_LOW:
            risk_factors.append("No placement applications")
            risk_score += 0.5  # Only for final year students
        
        # Factor 5: Semester (higher semester with low performance is more concerning)
        # Add bonus risk if already showing risk signs
        if semester >= 3 and risk_score >= 3:
            risk_score += 0.5
        
        # Determine risk level (balanced thresholds)
        # Round risk_score to handle decimal values
        risk_score_rounded = round(risk_score)
        if risk_score_rounded >= 5:  # High risk: multiple serious issues (e.g., very low attendance + very low marks)
            risk_level = "high"
        elif risk_score_rounded >= 3:  # Medium risk: at least one serious issue or multiple minor issues
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            risk_level, risk_factors, attendance, internal_marks, 
            skills_count, applications_count
        )
        
        return {
            "risk_level": risk_level,
            "risk_score": round(risk_score, 1),  # Round to 1 decimal place
            "risk_factors": risk_factors,
            "recommendations": recommendations
        }
    
    def _generate_recommendations(self, risk_level: str, risk_factors: List[str],
                                  attendance: float, internal_marks: List[float],
                                  skills_count: int, applications_count: int) -> List[str]:
        """Generate personalized recommendations based on risk factors"""
        recommendations = []
        
        if attendance < self.ATTENDANCE_THRESHOLD_MEDIUM_RISK:
            recommendations.append("URGENT: Attendance is critically low (below 60%). Immediate action required")
            recommendations.append("Contact faculty or HOD immediately to discuss attendance issues")
            recommendations.append("Attend all remaining classes to improve attendance percentage")
        elif attendance < self.ATTENDANCE_THRESHOLD_HIGH_RISK:
            recommendations.append("WARNING: Attendance is low (60-65%). Action needed")
            recommendations.append("Contact faculty or HOD to discuss attendance improvement")
            recommendations.append("Attend all remaining classes to improve attendance percentage")
        elif attendance < 75:
            recommendations.append("Improve attendance by attending all classes regularly")
            recommendations.append("Contact faculty or HOD if facing attendance issues")
        
        if internal_marks and sum(internal_marks) / len(internal_marks) < 60:
            recommendations.append("Focus on improving academic performance")
            recommendations.append("Seek help from faculty or tutoring services")
            recommendations.append("Review and practice course materials regularly")
        
        if skills_count < 5:
            recommendations.append("Develop technical skills through online courses or projects")
            recommendations.append("Participate in coding competitions or hackathons")
            recommendations.append("Build portfolio projects to showcase skills")
        
        if applications_count < 2:
            recommendations.append("Start applying to placement opportunities")
            recommendations.append("Prepare resume and cover letters")
            recommendations.append("Attend placement preparation workshops")
        
        if risk_level == "high":
            recommendations.append("Schedule a meeting with academic advisor or HOD")
            recommendations.append("Consider additional support services or counseling")
        
        if not recommendations:
            recommendations.append("Continue maintaining good academic performance")
            recommendations.append("Keep building skills and applying to opportunities")
        
        return recommendations

