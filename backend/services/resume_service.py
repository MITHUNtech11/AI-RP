"""Resume management service"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Tuple, Optional, Dict, Any
import uuid
import logging
from datetime import datetime

from ..models.resume import Resume
from ..models.activity import Activity

logger = logging.getLogger(__name__)


class ResumeService:
    """Service for resume CRUD operations"""
    
    @staticmethod
    def create_resume(
        db: Session,
        user_id: str,
        file_name: str,
        resume_json: Dict[str, Any]
    ) -> Tuple[Resume, str]:
        """
        Create and store a new resume
        Returns: (resume, error_message) - error_message empty if successful
        """
        try:
            resume = Resume(
                id=str(uuid.uuid4()),
                user_id=user_id,
                file_name=file_name,
                resume_json=resume_json,
                upload_date=datetime.utcnow(),
                match_score=resume_json.get("hrEvaluation", {}).get("matchScore"),
                recommendation=resume_json.get("hrEvaluation", {}).get("recommendation")
            )
            
            db.add(resume)
            db.commit()
            db.refresh(resume)
            
            # Log activity
            ActivityService.log_activity(db, user_id, "resume_uploaded", {
                "resume_id": resume.id,
                "file_name": file_name
            })
            
            logger.info(f"Resume created: {resume.id} for user {user_id}")
            return resume, ""
        except Exception as e:
            db.rollback()
            error_msg = f"Failed to create resume: {str(e)}"
            logger.error(error_msg)
            return None, error_msg
    
    @staticmethod
    def get_resume(db: Session, user_id: str, resume_id: str) -> Optional[Resume]:
        """Get single resume by ID"""
        return db.query(Resume).filter(
            and_(Resume.id == resume_id, Resume.user_id == user_id)
        ).first()
    
    @staticmethod
    def list_resumes(
        db: Session,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        search: str = "",
        min_score: int = 0,
        recommendation: str = "",
        sort_by: str = "newest"
    ) -> Tuple[List[Resume], int]:
        """
        List user's resumes with filtering and pagination
        Returns: (list of resumes, total count)
        """
        query = db.query(Resume).filter(Resume.user_id == user_id)
        
        # Search by file_name or candidate name
        if search:
            search_lower = search.lower()
            query = query.filter(
                or_(
                    Resume.file_name.ilike(f"%{search}%"),
                    Resume.resume_json["personalInfo"]["fullName"].astext.ilike(f"%{search}%")
                )
            )
        
        # Filter by match score
        if min_score > 0:
            query = query.filter(Resume.match_score >= min_score)
        
        # Filter by recommendation
        if recommendation:
            query = query.filter(Resume.recommendation == recommendation)
        
        # Get total count before pagination
        total = query.count()
        
        # Sort
        if sort_by == "newest":
            query = query.order_by(Resume.upload_date.desc())
        elif sort_by == "oldest":
            query = query.order_by(Resume.upload_date.asc())
        elif sort_by == "score_high":
            query = query.order_by(Resume.match_score.desc())
        elif sort_by == "score_low":
            query = query.order_by(Resume.match_score.asc())
        else:
            query = query.order_by(Resume.upload_date.desc())
        
        # Pagination
        offset = (page - 1) * limit
        resumes = query.offset(offset).limit(limit).all()
        
        return resumes, total
    
    @staticmethod
    def update_resume(
        db: Session,
        user_id: str,
        resume_id: str,
        hr_notes: Optional[str] = None,
        match_score: Optional[int] = None,
        recommendation: Optional[str] = None
    ) -> Tuple[Resume, str]:
        """Update resume metadata"""
        try:
            resume = ResumeService.get_resume(db, user_id, resume_id)
            
            if not resume:
                return None, "Resume not found"
            
            if hr_notes is not None:
                resume.hr_notes = hr_notes
            if match_score is not None:
                resume.match_score = match_score
            if recommendation is not None:
                resume.recommendation = recommendation
            
            db.commit()
            db.refresh(resume)
            
            logger.info(f"Resume updated: {resume_id}")
            return resume, ""
        except Exception as e:
            db.rollback()
            return None, f"Failed to update resume: {str(e)}"
    
    @staticmethod
    def delete_resume(db: Session, user_id: str, resume_id: str) -> str:
        """Delete resume by ID"""
        try:
            resume = ResumeService.get_resume(db, user_id, resume_id)
            
            if not resume:
                return "Resume not found"
            
            db.delete(resume)
            db.commit()
            
            # Log activity
            ActivityService.log_activity(db, user_id, "resume_deleted", {
                "resume_id": resume_id
            })
            
            logger.info(f"Resume deleted: {resume_id}")
            return ""
        except Exception as e:
            db.rollback()
            return f"Failed to delete resume: {str(e)}"
    
    @staticmethod
    def bulk_delete_resumes(db: Session, user_id: str, resume_ids: List[str]) -> Tuple[int, str]:
        """Delete multiple resumes"""
        try:
            deleted_count = db.query(Resume).filter(
                and_(Resume.user_id == user_id, Resume.id.in_(resume_ids))
            ).delete()
            
            db.commit()
            
            logger.info(f"Bulk deleted {deleted_count} resumes for user {user_id}")
            return deleted_count, ""
        except Exception as e:
            db.rollback()
            return 0, f"Failed to delete resumes: {str(e)}"


class JobDescriptionService:
    """Service for job description CRUD operations"""
    
    @staticmethod
    def create_jd(
        db: Session,
        user_id: str,
        title: str,
        description: str
    ) -> Tuple[Resume, str]:  # Using Resume model for JD
        """Create job description"""
        try:
            from models.job_description import JobDescription
            
            jd = JobDescription(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=title,
                description=description,
                is_active=False
            )
            
            db.add(jd)
            db.commit()
            db.refresh(jd)
            
            ActivityService.log_activity(db, user_id, "jd_created", {
                "jd_id": jd.id,
                "title": title
            })
            
            logger.info(f"Job description created: {jd.id}")
            return jd, ""
        except Exception as e:
            db.rollback()
            return None, f"Failed to create JD: {str(e)}"
    
    @staticmethod
    def get_jd(db: Session, user_id: str, jd_id: str):
        """Get job description"""
        from models.job_description import JobDescription
        
        return db.query(JobDescription).filter(
            and_(JobDescription.id == jd_id, JobDescription.user_id == user_id)
        ).first()
    
    @staticmethod
    def list_jds(db: Session, user_id: str):
        """List all job descriptions"""
        from models.job_description import JobDescription
        
        jds = db.query(JobDescription).filter(
            JobDescription.user_id == user_id
        ).order_by(JobDescription.created_at.desc()).all()
        
        return jds
    
    @staticmethod
    def update_jd(
        db: Session,
        user_id: str,
        jd_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[Any, str]:
        """Update job description"""
        try:
            jd = JobDescriptionService.get_jd(db, user_id, jd_id)
            
            if not jd:
                return None, "Job description not found"
            
            if title is not None:
                jd.title = title
            if description is not None:
                jd.description = description
            if is_active is not None:
                # If setting this JD as active, deactivate others
                if is_active:
                    from models.job_description import JobDescription
                    db.query(JobDescription).filter(
                        JobDescription.user_id == user_id
                    ).update({"is_active": False})
                jd.is_active = is_active
            
            db.commit()
            db.refresh(jd)
            
            logger.info(f"Job description updated: {jd_id}")
            return jd, ""
        except Exception as e:
            db.rollback()
            return None, f"Failed to update JD: {str(e)}"
    
    @staticmethod
    def delete_jd(db: Session, user_id: str, jd_id: str) -> str:
        """Delete job description"""
        try:
            jd = JobDescriptionService.get_jd(db, user_id, jd_id)
            
            if not jd:
                return "Job description not found"
            
            db.delete(jd)
            db.commit()
            
            ActivityService.log_activity(db, user_id, "jd_deleted", {
                "jd_id": jd_id
            })
            
            logger.info(f"Job description deleted: {jd_id}")
            return ""
        except Exception as e:
            db.rollback()
            return f"Failed to delete JD: {str(e)}"
    
    @staticmethod
    def get_active_jd(db: Session, user_id: str):
        """Get currently active job description"""
        from models.job_description import JobDescription
        
        return db.query(JobDescription).filter(
            and_(JobDescription.user_id == user_id, JobDescription.is_active == True)
        ).first()


class ActivityService:
    """Service for activity logging"""
    
    @staticmethod
    def log_activity(
        db: Session,
        user_id: str,
        event_type: str,
        event_data: Optional[Dict[str, Any]] = None
    ) -> Activity:
        """Log user activity"""
        try:
            activity = Activity(
                id=str(uuid.uuid4()),
                user_id=user_id,
                event_type=event_type,
                event_data=event_data or {}
            )
            
            db.add(activity)
            db.commit()
            
            return activity
        except Exception as e:
            logger.error(f"Failed to log activity: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def get_user_activities(
        db: Session,
        user_id: str,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Activity], int]:
        """Get user activity history"""
        query = db.query(Activity).filter(Activity.user_id == user_id)
        total = query.count()
        
        offset = (page - 1) * limit
        activities = query.order_by(Activity.created_at.desc()).offset(offset).limit(limit).all()
        
        return activities, total
    
    @staticmethod
    def get_activity_summary(db: Session, user_id: str) -> Dict[str, Any]:
        """Get activity summary stats"""
        from datetime import timedelta
        
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        query = db.query(Activity).filter(Activity.user_id == user_id)
        total_events = query.count()
        
        events_this_week = query.filter(Activity.created_at >= week_ago).count()
        events_this_month = query.filter(Activity.created_at >= month_ago).count()
        
        last_activity = query.order_by(Activity.created_at.desc()).first()
        
        # Event breakdown
        event_breakdown = db.query(
            Activity.event_type,
            func.count(Activity.id)
        ).filter(Activity.user_id == user_id).group_by(Activity.event_type).all()
        
        breakdown_dict = {event_type: count for event_type, count in event_breakdown}
        
        return {
            "total_events": total_events,
            "events_this_week": events_this_week,
            "events_this_month": events_this_month,
            "last_activity": last_activity.created_at if last_activity else None,
            "event_breakdown": breakdown_dict
        }
