"""
Resume Parser Service
Extracts structured information from PDF resumes
"""
import pdfplumber
import re
import spacy
from typing import Dict, List, Any
import io

# Load spaCy model (will download on first run if not present)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: spaCy model 'en_core_web_sm' not found. Install with: python -m spacy download en_core_web_sm")
    nlp = None

# Common tech skills dictionary
TECH_SKILLS = [
    "python", "java", "javascript", "typescript", "react", "node.js", "express",
    "django", "flask", "fastapi", "sql", "postgresql", "mongodb", "redis",
    "docker", "kubernetes", "aws", "azure", "gcp", "git", "github", "gitlab",
    "html", "css", "bootstrap", "tailwind", "vue", "angular", "next.js",
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "data science", "pandas", "numpy", "matplotlib", "seaborn",
    "c++", "c#", ".net", "spring", "hibernate", "jpa",
    "rest api", "graphql", "microservices", "ci/cd", "jenkins",
    "linux", "bash", "shell scripting", "agile", "scrum"
]


class ResumeParser:
    def __init__(self):
        self.nlp = nlp
    
    async def parse_pdf(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Parse PDF resume and extract structured information
        """
        try:
            # Extract text from PDF
            pdf_file = io.BytesIO(pdf_bytes)
            text = ""
            
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            
            if not text:
                return {
                    "name": "",
                    "email": "",
                    "phone": "",
                    "skills": [],
                    "projects": [],
                    "education": [],
                    "experience": [],
                    "summary": ""
                }
            
            # Extract information
            name = self._extract_name(text)
            email = self._extract_email(text)
            phone = self._extract_phone(text)
            skills = self._extract_skills(text)
            projects = self._extract_projects(text)
            education = self._extract_education(text)
            experience = self._extract_experience(text)
            summary = self._extract_summary(text)
            
            return {
                "name": name,
                "email": email,
                "phone": phone,
                "skills": skills,
                "projects": projects,
                "education": education,
                "experience": experience,
                "summary": summary
            }
        except Exception as e:
            raise Exception(f"Error parsing PDF: {str(e)}")
    
    def _extract_name(self, text: str) -> str:
        """Extract name (usually first line or from NER)"""
        lines = text.split('\n')[:5]
        if self.nlp:
            doc = self.nlp(lines[0])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    return ent.text.strip()
        return lines[0].strip() if lines else ""
    
    def _extract_email(self, text: str) -> str:
        """Extract email using regex"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        matches = re.findall(email_pattern, text)
        return matches[0] if matches else ""
    
    def _extract_phone(self, text: str) -> str:
        """Extract phone number using regex"""
        phone_patterns = [
            r'\b\d{10}\b',
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\b\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
        ]
        for pattern in phone_patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0]
        return ""
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills"""
        text_lower = text.lower()
        found_skills = []
        
        # Check against skills dictionary
        for skill in TECH_SKILLS:
            if skill.lower() in text_lower:
                found_skills.append(skill.title())
        
        # Look for skills section
        skills_section_pattern = r'(?:skills?|technical skills?|technologies?)[:]\s*(.+?)(?:\n\n|\n[A-Z]|$)'
        match = re.search(skills_section_pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            skills_text = match.group(1)
            # Extract comma/separated skills
            skills_list = re.split(r'[,;•\n]', skills_text)
            for skill in skills_list:
                skill = skill.strip()
                if skill and len(skill) > 2:
                    found_skills.append(skill)
        
        # Remove duplicates and return
        return list(set(found_skills))
    
    def _extract_projects(self, text: str) -> List[str]:
        """Extract project descriptions"""
        projects = []
        project_pattern = r'(?:project|projects?)[:]\s*(.+?)(?:\n\n|\n(?:Education|Experience|Skills)|$)'
        matches = re.finditer(project_pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            project_text = match.group(1).strip()
            if project_text:
                projects.append(project_text[:200])  # Limit length
        return projects[:5]  # Return top 5
    
    def _extract_education(self, text: str) -> List[str]:
        """Extract education information"""
        education = []
        edu_pattern = r'(?:education|degree|university|college)[:]\s*(.+?)(?:\n\n|\n(?:Experience|Skills|Projects)|$)'
        matches = re.finditer(edu_pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            edu_text = match.group(1).strip()
            if edu_text:
                education.append(edu_text[:200])
        return education[:3]  # Return top 3
    
    def _extract_experience(self, text: str) -> List[str]:
        """Extract work experience"""
        experience = []
        exp_pattern = r'(?:experience|work|employment)[:]\s*(.+?)(?:\n\n|\n(?:Education|Skills|Projects)|$)'
        matches = re.finditer(exp_pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            exp_text = match.group(1).strip()
            if exp_text:
                experience.append(exp_text[:200])
        return experience[:5]  # Return top 5
    
    def _extract_summary(self, text: str) -> str:
        """Extract summary/objective"""
        summary_patterns = [
            r'(?:summary|objective|about)[:]\s*(.+?)(?:\n\n|\n(?:Education|Experience|Skills)|$)',
            r'^(.{0,300})(?:\n\n|\n(?:Education|Experience|Skills))'
        ]
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL | re.MULTILINE)
            if match:
                summary = match.group(1).strip()
                if len(summary) > 50:
                    return summary[:300]
        return ""

