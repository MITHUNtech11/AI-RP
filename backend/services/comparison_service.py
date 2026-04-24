"""Comparison service for comparing and ranking resumes"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime
import uuid
import json
import logging

from ..models.comparison import Comparison
from ..models.resume import Resume
from ..models.job_description import JobDescription
from ..services.resume_service import ActivityService

logger = logging.getLogger(__name__)


class ComparisonService:
    """Service for comparing resumes and ranking candidates"""
    
    @staticmethod
    def create_comparison(
        db: Session,
        user_id: str,
        title: str,
        description: Optional[str],
        resume_ids: List[str],
        job_description_id: Optional[str],
        scores: Dict[str, Any],
        custom_criteria: Optional[Dict[str, Any]] = None
    ) -> Comparison:
        """Create new comparison record"""
        try:
            comparison = Comparison(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=title,
                description=description,
                resume_ids=resume_ids,  # Stored as JSON list
                job_description_id=job_description_id,
                scores=scores,  # Stores ranking results
                custom_criteria=custom_criteria,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(comparison)
            db.commit()
            db.refresh(comparison)
            
            # Log activity
            ActivityService.log_activity(
                db, user_id,
                "comparison_created",
                {
                    "comparison_id": comparison.id,
                    "title": title,
                    "resume_count": len(resume_ids)
                }
            )
            
            return comparison
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create comparison: {str(e)}")
            raise
    
    @staticmethod
    def get_comparison(db: Session, user_id: str, comparison_id: str) -> Optional[Comparison]:
        """Get single comparison by ID"""
        return db.query(Comparison).filter(
            and_(
                Comparison.id == comparison_id,
                Comparison.user_id == user_id
            )
        ).first()
    
    @staticmethod
    def list_comparisons(
        db: Session,
        user_id: str,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Comparison], int]:
        """List all comparisons for user with pagination"""
        query = db.query(Comparison).filter(Comparison.user_id == user_id)
        
        total = query.count()
        offset = (page - 1) * limit
        
        comparisons = query.order_by(Comparison.created_at.desc()).offset(offset).limit(limit).all()
        
        return comparisons, total
    
    @staticmethod
    def update_comparison(
        db: Session,
        user_id: str,
        comparison_id: str,
        notes: Optional[str] = None,
        status: Optional[str] = None
    ) -> Optional[Comparison]:
        """Update comparison notes and status"""
        try:
            comparison = ComparisonService.get_comparison(db, user_id, comparison_id)
            if not comparison:
                return None
            
            if notes is not None:
                comparison.notes = notes
            if status is not None:
                comparison.status = status
            
            comparison.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(comparison)
            
            return comparison
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update comparison: {str(e)}")
            raise
    
    @staticmethod
    def delete_comparison(db: Session, user_id: str, comparison_id: str) -> bool:
        """Delete comparison"""
        try:
            comparison = ComparisonService.get_comparison(db, user_id, comparison_id)
            if not comparison:
                return False
            
            db.delete(comparison)
            db.commit()
            
            # Log activity
            ActivityService.log_activity(
                db, user_id,
                "comparison_deleted",
                {"comparison_id": comparison_id}
            )
            
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete comparison: {str(e)}")
            raise


class RankingService:
    """Service for ranking resumes using AI"""
    
    @staticmethod
    def rank_resumes(
        db: Session,
        user_id: str,
        job_description_id: str,
        resume_ids: List[str],
        use_advanced_scoring: bool = False
    ) -> Dict[str, Any]:
        """
        Rank resumes against job description
        Returns scores and ranking breakdown
        """
        from ..resume_parser.gemini import generate_text
        
        try:
            # Fetch JD
            jd = db.query(JobDescription).filter(
                and_(
                    JobDescription.id == job_description_id,
                    JobDescription.user_id == user_id
                )
            ).first()
            
            if not jd:
                raise ValueError("Job description not found")
            
            # Fetch resumes
            resumes = db.query(Resume).filter(
                and_(
                    Resume.id.in_(resume_ids),
                    Resume.user_id == user_id
                )
            ).all()
            
            if not resumes:
                raise ValueError("No resumes found")
            
            # Score each resume
            rankings = []
            for resume in resumes:
                score = RankingService._score_resume(
                    resume, jd, use_advanced_scoring
                )
                rankings.append(score)
            
            # Sort by overall score descending
            rankings.sort(key=lambda x: x['overall_score'], reverse=True)
            
            # Add ranking position
            for idx, ranking in enumerate(rankings, 1):
                ranking['ranking_position'] = idx
            
            # Log activity
            ActivityService.log_activity(
                db, user_id,
                "resumes_ranked",
                {
                    "resume_count": len(resumes),
                    "jd_id": job_description_id,
                    "top_score": rankings[0]['overall_score'] if rankings else 0
                }
            )
            
            return {
                "job_description_id": job_description_id,
                "total_resumes": len(resumes),
                "rankings": rankings,
                "created_at": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"Failed to rank resumes: {str(e)}")
            raise
    
    @staticmethod
    def _score_resume(resume: Resume, jd: JobDescription, advanced: bool = False) -> Dict[str, Any]:
        """
        Score a single resume against JD
        Uses simple heuristics if advanced=False, calls Gemini if advanced=True
        """
        resume_data = json.loads(resume.resume_json) if isinstance(resume.resume_json, str) else resume.resume_json
        jd_data = json.loads(jd.jd_json) if isinstance(jd.jd_json, str) else jd.jd_json
        
        if advanced:
            # Use Gemini for detailed scoring (would call API)
            return RankingService._score_with_gemini(resume_data, jd_data, resume.id)
        else:
            # Use simple heuristic scoring
            return RankingService._score_with_heuristics(resume_data, jd_data, resume.id)
    
    @staticmethod
    def _score_with_heuristics(
        resume: Dict[str, Any],
        jd: Dict[str, Any],
        resume_id: str
    ) -> Dict[str, Any]:
        """Simple heuristic-based scoring"""
        resume_skills = set(s.lower() for s in resume.get('skills', []))
        jd_skills = set(s.lower() for s in jd.get('required_skills', jd.get('skills', [])))
        
        # Skills match percentage
        skills_match = 0
        if jd_skills:
            matched = len(resume_skills & jd_skills)
            skills_match = (matched / len(jd_skills)) * 100
        
        # Experience match (basic)
        resume_exp = resume.get('total_experience_years', 0)
        jd_exp = jd.get('required_experience_years', 0)
        experience_match = min(100, (resume_exp / max(jd_exp, 1)) * 100)
        
        # Education match
        resume_education = resume.get('education', [{}])[0].get('degree', '').lower()
        jd_education = jd.get('required_education', '').lower()
        education_match = 100 if any(edu in resume_education for edu in ['bachelor', 'master', 'phd']) else 50
        
        # Overall score (weighted average)
        overall = (skills_match * 0.5 + experience_match * 0.3 + education_match * 0.2)
        
        candidate_name = resume.get('personalInfo', {}).get('fullName', 'Unknown')
        
        return {
            "resume_id": resume_id,
            "candidate_name": candidate_name,
            "overall_score": round(overall, 2),
            "skills_match": round(skills_match, 2),
            "experience_match": round(experience_match, 2),
            "education_match": round(education_match, 2),
            "key_strengths": list(resume_skills & jd_skills)[:5],
            "gaps": list(jd_skills - resume_skills)[:5],
            "ranking_position": 0  # Will be set after sorting
        }
    
    @staticmethod
    def _score_with_gemini(
        resume: Dict[str, Any],
        jd: Dict[str, Any],
        resume_id: str
    ) -> Dict[str, Any]:
        """
        Advanced scoring using Gemini API
        (Would call Gemini for detailed analysis)
        """
        # For now, use heuristics as fallback
        # In production, this would call Gemini with a detailed prompt
        return RankingService._score_with_heuristics(resume, jd, resume_id)
