"""
Candidate Matching Algorithm

Scores and ranks candidates (parsed resumes) against a Job Description
based on skill match, experience match, job title relevance, and education fit.
"""

import logging
from typing import Dict, List, Any, Optional
from .gemini import generate_text

logger = logging.getLogger(__name__)


class CandidateRanker:
    """Score and rank candidates against a JD"""
    
    # Scoring weights
    SKILL_WEIGHT = 0.40
    EXPERIENCE_WEIGHT = 0.30
    JOB_TITLE_WEIGHT = 0.20
    EDUCATION_WEIGHT = 0.10
    
    # Education hierarchy for matching
    EDUCATION_LEVELS = {
        "phd": 5,
        "doctorate": 5,
        "master's": 4,
        "masters": 4,
        "bachelor's": 3,
        "bachelors": 3,
        "associate": 2,
        "diploma": 1,
        "high school": 0,
        "secondary": 0,
        "any": -1,  # Accept any level
    }
    
    @staticmethod
    def extract_experience_years(resume_data: Dict[str, Any]) -> float:
        """
        Extract total years of experience from parsed resume
        
        Args:
            resume_data: Parsed resume JSON
            
        Returns:
            Total years of experience (float)
        """
        try:
            experience = resume_data.get("experience", [])
            if not experience:
                return 0.0
            
            total_months = 0
            for exp in experience:
                if isinstance(exp, dict):
                    start_date = exp.get("startDate", "")
                    end_date = exp.get("endDate", "")
                    
                    # Simple year extraction (YYYY-MM format)
                    if start_date and end_date:
                        try:
                            start_year = float(start_date[:4])
                            # Handle "Present" or current date
                            if end_date.lower() in ["present", "current", "now"]:
                                from datetime import datetime
                                end_year = float(datetime.now().year)
                            else:
                                end_year = float(end_date[:4])
                            
                            total_months += (end_year - start_year) * 12
                        except (ValueError, IndexError):
                            continue
            
            years = total_months / 12
            return round(years, 1)
        except Exception as e:
            logger.warning(f"Error extracting experience years: {e}")
            return 0.0

    @staticmethod
    def extract_resume_skills(resume_data: Dict[str, Any]) -> List[str]:
        """
        Extract all skills from parsed resume
        
        Args:
            resume_data: Parsed resume JSON
            
        Returns:
            List of skills (lowercase)
        """
        skills = resume_data.get("skills", [])
        if isinstance(skills, list):
            return [s.lower().strip() for s in skills if isinstance(s, str)]
        return []

    @staticmethod
    def extract_resume_education(resume_data: Dict[str, Any]) -> str:
        """
        Extract highest education level from resume
        
        Args:
            resume_data: Parsed resume JSON
            
        Returns:
            Education level string
        """
        education_list = resume_data.get("education", [])
        if not education_list:
            return "Unknown"
        
        # Get the first/most recent education
        if isinstance(education_list, list) and len(education_list) > 0:
            edu = education_list[0]
            if isinstance(edu, dict):
                degree = edu.get("degree", "").lower()
                return degree if degree else "Unknown"
        
        return "Unknown"

    @staticmethod
    def extract_job_titles(resume_data: Dict[str, Any]) -> List[str]:
        """
        Extract all job titles from resume experience
        
        Args:
            resume_data: Parsed resume JSON
            
        Returns:
            List of job titles
        """
        titles = []
        experience = resume_data.get("experience", [])
        
        for exp in experience:
            if isinstance(exp, dict):
                title = exp.get("title", "").lower().strip()
                if title:
                    titles.append(title)
        
        return titles

    @staticmethod
    def calculate_skill_score(resume_skills: List[str], jd_required_skills: List[str]) -> float:
        """
        Calculate skill match score
        
        Matched skills / Total required skills
        
        Args:
            resume_skills: Candidate's skills
            jd_required_skills: JD required skills
            
        Returns:
            Score 0-1
        """
        if not jd_required_skills:
            return 1.0  # No required skills = perfect match
        
        # Fuzzy matching for skill names
        matched_count = 0
        for required_skill in jd_required_skills:
            # Exact match
            if required_skill in resume_skills:
                matched_count += 1
            else:
                # Fuzzy match: check if any resume skill contains the required skill
                for resume_skill in resume_skills:
                    if required_skill in resume_skill or (
                        len(required_skill) > 3 and required_skill in resume_skill
                    ):
                        matched_count += 1
                        break
        
        score = matched_count / len(jd_required_skills)
        return min(score, 1.0)

    @staticmethod
    def calculate_experience_score(resume_years: float, jd_min_years: int, jd_pref_years: int = 0) -> float:
        """
        Calculate experience match score
        
        Policy:
        - Below minimum: score = resume_years / jd_min_years
        - At minimum or above: score = 1.0
        - Above preferred (if set): bonus consideration (still 1.0)
        
        Args:
            resume_years: Candidate's years of experience
            jd_min_years: JD minimum years required
            jd_pref_years: JD preferred years
            
        Returns:
            Score 0-1
        """
        if jd_min_years == 0:
            return 1.0  # No experience requirement
        
        if resume_years >= jd_min_years:
            return 1.0  # Meets minimum
        
        # Below minimum - partial credit
        score = resume_years / jd_min_years
        return min(score, 1.0)

    @staticmethod
    def calculate_job_title_score(
        resume_job_titles: List[str],
        jd_job_title: str,
        jd_seniority: str
    ) -> float:
        """
        Calculate job title relevance score using semantic matching
        
        Args:
            resume_job_titles: Candidate's job titles
            jd_job_title: JD job title
            jd_seniority: JD seniority level
            
        Returns:
            Score 0-1
        """
        if not resume_job_titles or not jd_job_title:
            return 0.5  # Unknown = partial credit
        
        jd_title_lower = jd_job_title.lower()
        
        # Direct match
        for title in resume_job_titles:
            if title == jd_title_lower:
                return 1.0
            # Partial match (e.g., "python developer" matches "senior python developer")
            if (
                # Title contains key words from JD title
                any(word in title for word in jd_title_lower.split() if len(word) > 3) or
                # JD title contains key words from title
                any(word in jd_title_lower for word in title.split() if len(word) > 3)
            ):
                return 0.85
        
        # Check seniority alignment
        seniority_keywords = {
            "entry-level": ["junior", "associate", "coordinator", "assistant"],
            "mid-level": ["senior", "mid-level", "lead"],
            "senior": ["senior", "lead", "principal", "manager", "director"],
            "lead": ["lead", "principal", "manager", "director", "head"],
            "executive": ["director", "VP", "chief", "executive", "president"],
        }
        
        jd_seniority_lower = jd_seniority.lower()
        for title in resume_job_titles:
            if jd_seniority_lower in seniority_keywords:
                seniority_words = seniority_keywords[jd_seniority_lower]
                if any(word in title for word in seniority_words):
                    return 0.7
        
        # No match found
        return 0.3

    @staticmethod
    def calculate_education_score(resume_education: str, jd_required_education: str) -> float:
        """
        Calculate education match score
        
        Policy:
        - Exact match: 1.0
        - Higher degree: 0.95
        - Lower degree: 0.5
        - Unknown: 0.6
        - Any accepted: 1.0
        
        Args:
            resume_education: Candidate's education
            jd_required_education: JD required education
            
        Returns:
            Score 0-1
        """
        resume_edu_lower = resume_education.lower()
        jd_edu_lower = jd_required_education.lower()
        
        # Allow "any" education level
        if "any" in jd_edu_lower:
            return 1.0
        
        # Exact match
        if resume_edu_lower == jd_edu_lower or resume_education == jd_required_education:
            return 1.0
        
        # Get numeric levels for comparison
        resume_level = CandidateRanker.EDUCATION_LEVELS.get(resume_edu_lower, 0)
        jd_level = CandidateRanker.EDUCATION_LEVELS.get(jd_edu_lower, 3)  # Default to bachelor's
        
        # Higher or equal education is good
        if resume_level >= jd_level:
            return 1.0 if resume_level == jd_level else 0.95
        
        # Lower education is partial credit
        return 0.5

    @staticmethod
    def generate_ranking_reasoning(
        candidate_name: str,
        skill_score: float,
        experience_score: float,
        job_title_score: float,
        education_score: float,
        resume_years: float,
        jd_min_years: int,
        matched_skills: List[str],
        missing_skills: List[str],
        candidate_education: str,
        jd_education: str,
        overall_score: float
    ) -> str:
        """
        Generate AI-powered reasoning for the ranking using Gemini
        
        Args:
            All score and data parameters
            
        Returns:
            Human-readable explanation
        """
        prompt = """Given this candidate evaluation, provide a brief (2-3 sentences) explanation of their fit for the role.

Candidate: {name}
Overall Score: {overall}%
- Skill Match: {skill_score}% (Matched {matched} of {total_matched_plus_missing})
- Experience: {exp_score}% ({resume_years} years, {jd_min} years required)
- Job Title Relevance: {title_score}%
- Education Fit: {edu_score}% (Has: {candidate_edu}, Needs: {jd_edu})

Provide: 1) Key strength, 2) Area for growth, 3) Overall recommendation (Strong/Good/Moderate/Consider/Not Recommended)
Keep it concise and professional.""".format(
            name=candidate_name,
            overall=int(overall_score * 100),
            skill_score=int(skill_score * 100),
            matched=len(matched_skills),
            total_matched_plus_missing=len(matched_skills) + len(missing_skills),
            exp_score=int(experience_score * 100),
            resume_years=resume_years,
            jd_min=jd_min_years,
            title_score=int(job_title_score * 100),
            edu_score=int(education_score * 100),
            candidate_edu=candidate_education,
            jd_edu=jd_education
        )
        
        try:
            reasoning = generate_text(prompt, temperature=0.5, max_tokens=300)
            return reasoning.strip()
        except Exception as e:
            logger.warning(f"Failed to generate AI reasoning: {e}")
            return f"Fit score: {int(overall_score * 100)}%. Strong technical alignment with the role requirements."

    @staticmethod
    def rank_candidate(
        resume_data: Dict[str, Any],
        jd_data: Dict[str, Any],
        resume_index: int = 0,
        generate_reasoning: bool = True
    ) -> Dict[str, Any]:
        """
        Rank a single candidate against the JD
        
        Args:
            resume_data: Parsed resume JSON
            jd_data: Parsed JD JSON
            resume_index: Index of resume in batch
            generate_reasoning: Whether to generate AI reasoning
            
        Returns:
            Ranking result with scores and breakdown
        """
        ranker = CandidateRanker()
        
        # Extract data from resume
        resume_skills = ranker.extract_resume_skills(resume_data)
        resume_years = ranker.extract_experience_years(resume_data)
        resume_education = ranker.extract_resume_education(resume_data)
        resume_job_titles = ranker.extract_job_titles(resume_data)
        candidate_name = resume_data.get("personalInfo", {}).get("fullName", "Unknown")
        
        # Extract JD requirements
        jd_required_skills = jd_data.get("required_skills", [])
        jd_min_years = jd_data.get("minimum_experience_years", 0)
        jd_pref_years = jd_data.get("preferred_experience_years", 0)
        jd_job_title = jd_data.get("job_title", "")
        jd_seniority = jd_data.get("seniority_level", "")
        jd_education = jd_data.get("required_education", "")
        
        # Calculate individual scores
        skill_score = ranker.calculate_skill_score(resume_skills, jd_required_skills)
        experience_score = ranker.calculate_experience_score(resume_years, jd_min_years, jd_pref_years)
        job_title_score = ranker.calculate_job_title_score(resume_job_titles, jd_job_title, jd_seniority)
        education_score = ranker.calculate_education_score(resume_education, jd_education)
        
        # Calculate matched and missing skills
        matched_skills = []
        missing_skills = list(jd_required_skills)
        
        for required_skill in jd_required_skills:
            for resume_skill in resume_skills:
                if required_skill in resume_skill or required_skill == resume_skill:
                    matched_skills.append(required_skill)
                    missing_skills.remove(required_skill)
                    break
        
        # Calculate weighted overall score
        overall_score = (
            skill_score * ranker.SKILL_WEIGHT +
            experience_score * ranker.EXPERIENCE_WEIGHT +
            job_title_score * ranker.JOB_TITLE_WEIGHT +
            education_score * ranker.EDUCATION_WEIGHT
        )
        
        # Generate reasoning if requested
        reasoning = ""
        if generate_reasoning:
            reasoning = ranker.generate_ranking_reasoning(
                candidate_name,
                skill_score,
                experience_score,
                job_title_score,
                education_score,
                resume_years,
                jd_min_years,
                matched_skills,
                missing_skills,
                resume_education,
                jd_education,
                overall_score
            )
        
        result = {
            "resume_index": resume_index,
            "candidate_name": candidate_name,
            "overall_score": round(overall_score, 3),
            "score_percentage": int(overall_score * 100),
            "scores": {
                "skills": round(skill_score, 3),
                "experience": round(experience_score, 3),
                "job_title": round(job_title_score, 3),
                "education": round(education_score, 3),
            },
            "details": {
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "candidate_experience_years": resume_years,
                "jd_required_experience_years": jd_min_years,
                "candidate_education": resume_education,
                "jd_required_education": jd_education,
                "candidate_job_titles": resume_job_titles[:3],  # Most recent 3
            },
            "reasoning": reasoning,
        }
        
        logger.info(f"✓ Ranked {candidate_name}: {result['score_percentage']}%")
        
        return result


def rank_candidates(
    resume_list: List[Dict[str, Any]],
    jd_data: Dict[str, Any],
    generate_reasoning: bool = True
) -> List[Dict[str, Any]]:
    """
    Rank multiple candidates against a JD and return sorted by score
    
    Args:
        resume_list: List of parsed resume JSONs
        jd_data: Parsed JD JSON
        generate_reasoning: Whether to generate AI reasoning for each candidate
        
    Returns:
        List of ranking results sorted by overall_score descending
    """
    ranker = CandidateRanker()
    
    results = []
    for i, resume in enumerate(resume_list):
        try:
            ranking = ranker.rank_candidate(resume, jd_data, resume_index=i, generate_reasoning=generate_reasoning)
            results.append(ranking)
        except Exception as e:
            logger.error(f"Error ranking resume {i}: {e}")
            # Add error ranking
            results.append({
                "resume_index": i,
                "candidate_name": f"Resume {i+1}",
                "overall_score": 0.0,
                "score_percentage": 0,
                "error": str(e),
                "scores": {"skills": 0, "experience": 0, "job_title": 0, "education": 0},
                "details": {},
                "reasoning": "Failed to process resume"
            })
    
    # Sort by overall score descending
    results.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    
    logger.info(f"✓ Ranked {len(results)} candidates")
    return results
