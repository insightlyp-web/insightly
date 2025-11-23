"""
Skill Gap Analysis Service
Analyzes the gap between student skills and required skills
"""
from typing import List, Dict, Any


class SkillGapAnalyzer:
    def __init__(self):
        pass
    
    def analyze(self, student_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
        """
        Analyze skill gap between student skills and required skills
        
        Args:
            student_skills: List of student's skills
            required_skills: List of required skills for a position
            
        Returns:
            Dictionary with missing skills, strengths, and match percentage
        """
        # Normalize skills (lowercase, strip)
        student_skills_normalized = [s.lower().strip() for s in student_skills]
        required_skills_normalized = [s.lower().strip() for s in required_skills]
        
        # Find missing skills
        missing = []
        for req_skill in required_skills_normalized:
            # Check for exact match or partial match
            found = False
            for student_skill in student_skills_normalized:
                if req_skill in student_skill or student_skill in req_skill:
                    found = True
                    break
            if not found:
                missing.append(req_skill.title())
        
        # Find strengths (student has but not required)
        strengths = []
        for student_skill in student_skills_normalized:
            found = False
            for req_skill in required_skills_normalized:
                if req_skill in student_skill or student_skill in req_skill:
                    found = True
                    break
            if not found:
                strengths.append(student_skill.title())
        
        # Calculate match percentage
        if not required_skills_normalized:
            match_percentage = 100.0
        else:
            matched_count = len(required_skills_normalized) - len(missing)
            match_percentage = (matched_count / len(required_skills_normalized)) * 100
        
        return {
            "missing": missing,
            "strengths": strengths,
            "match_percentage": round(match_percentage, 2)
        }

