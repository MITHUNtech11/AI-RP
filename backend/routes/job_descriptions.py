"""Job Description management routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..config.dependencies import get_current_user
from ..models.user import User
from ..schemas.job_description import (
    JobDescriptionCreate, JobDescriptionUpdate, JobDescriptionResponse,
    JobDescriptionListResponse, JobDescriptionsListResponse,
    SetActiveJDRequest, JobDescriptionDeleteResponse
)
from ..services.resume_service import JobDescriptionService

router = APIRouter(
    prefix="/job-descriptions",
    tags=["job-descriptions"],
    responses={401: {"description": "Unauthorized"}}
)


@router.post("", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_jd(
    request: JobDescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job description"""
    jd, error = JobDescriptionService.create_jd(
        db, current_user.id, request.title, request.description
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return jd


@router.get("", response_model=JobDescriptionsListResponse)
async def list_jds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all job descriptions for user"""
    jds = JobDescriptionService.list_jds(db, current_user.id)
    
    items = [
        JobDescriptionListResponse(
            id=jd.id,
            title=jd.title,
            is_active=jd.is_active,
            created_at=jd.created_at,
            updated_at=jd.updated_at
        )
        for jd in jds
    ]
    
    return JobDescriptionsListResponse(
        items=items,
        total=len(items)
    )


@router.get("/{jd_id}", response_model=JobDescriptionResponse)
async def get_jd(
    jd_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job description by ID"""
    jd = JobDescriptionService.get_jd(db, current_user.id, jd_id)
    
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found")
    
    return jd


@router.put("/{jd_id}", response_model=JobDescriptionResponse)
async def update_jd(
    jd_id: str,
    request: JobDescriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update job description"""
    jd, error = JobDescriptionService.update_jd(
        db, current_user.id, jd_id,
        title=request.title,
        description=request.description,
        is_active=request.is_active
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return jd


@router.put("/{jd_id}/set-active", response_model=JobDescriptionResponse)
async def set_active_jd(
    jd_id: str,
    request: SetActiveJDRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set job description as active/inactive"""
    jd, error = JobDescriptionService.update_jd(
        db, current_user.id, jd_id, is_active=request.is_active
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return jd


@router.delete("/{jd_id}", response_model=JobDescriptionDeleteResponse)
async def delete_jd(
    jd_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete job description"""
    error = JobDescriptionService.delete_jd(db, current_user.id, jd_id)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return JobDescriptionDeleteResponse(
        status="success",
        message="Job description deleted successfully"
    )


@router.get("/{jd_id}/active", response_model=JobDescriptionResponse)
async def get_active_jd(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get currently active job description"""
    jd = JobDescriptionService.get_active_jd(db, current_user.id)
    
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active job description set")
    
    return jd
