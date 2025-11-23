"""
Placement Recommendation Engine
Recommends placement posts based on student skills
"""
from typing import List, Dict, Any
from collections import Counter


class PlacementRecommender:
    def __init__(self):
        pass
    
    def recommend(self, skills: List[str], posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Recommend placement posts based on student skills
        
        Args:
            skills: List of student skills
            posts: List of post dictionaries with id, required_skills, company, title
            
        Returns:
            List of recommendations sorted by score (highest first)
        """
        recommendations = []
        
        # Normalize student skills
        student_skills_normalized = [s.lower().strip() for s in skills]
        
        for post in posts:
            # Posts are now always dictionaries (converted from Pydantic in the endpoint)
            post_id = post.get("id", "")
            required_skills = post.get("required_skills", [])
            company = post.get("company", "")
            title = post.get("title", "")
            
            if not required_skills:
                # If no required skills, give a low score
                score = 0.1
            else:
                # Normalize required skills
                required_skills_normalized = [s.lower().strip() for s in required_skills]
                
                # Calculate skill overlap
                matched_skills = []
                for req_skill in required_skills_normalized:
                    for student_skill in student_skills_normalized:
                        # Check for exact or partial match
                        if req_skill in student_skill or student_skill in req_skill:
                            matched_skills.append(req_skill)
                            break
                
                # Score = (matched skills / required skills) * 100
                score = len(matched_skills) / len(required_skills_normalized)
            
            recommendations.append({
                "post_id": post_id,
                "score": round(score, 3),
                "company": company,
                "title": title,
                "matched_skills_count": len(matched_skills) if required_skills else 0,
                "total_required_skills": len(required_skills)
            })
        
        # Sort by score (highest first)
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return recommendations

