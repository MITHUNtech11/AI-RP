"""Resume management routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from ..config.database import get_db
from ..config.dependencies import get_current_user
from ..models.user import User
from ..schemas.resume import (
    ResumeCreate, ResumeUpdate, ResumeResponse, ResumeListResponse,
    ResumesListPaginatedResponse, ResumeDeleteResponse, BulkDeleteRequest
)
from ..services.resume_service import ResumeService

router = APIRouter(
    prefix="/resumes",
    tags=["resumes"],
    responses={401: {"description": "Unauthorized"}}
)


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_resume(
    request: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create and store a new resume"""
    resume, error = ResumeService.create_resume(
        db, current_user.id, request.file_name, request.resume_json
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return resume


@router.get("", response_model=ResumesListPaginatedResponse)
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    min_score: int = Query(0, ge=0, le=100),
    recommendation: str = Query(""),
    sort_by: str = Query("newest")
):
    """List user's resumes with filtering"""
    resumes, total = ResumeService.list_resumes(
        db, current_user.id, page, limit, search, min_score, recommendation, sort_by
    )
    
    # Convert to lighter payload
    items = [
        ResumeListResponse(
            id=r.id,
            file_name=r.file_name,
            personal_info=r.resume_json.get("personalInfo", {}),
            match_score=r.match_score,
            recommendation=r.recommendation,
            upload_date=r.upload_date
        )
        for r in resumes
    ]
    
    has_more = (page * limit) < total
    
    return ResumesListPaginatedResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_more=has_more
    )


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single resume by ID"""
    resume = ResumeService.get_resume(db, current_user.id, resume_id)
    
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    
    return resume


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: str,
    request: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update resume metadata (notes, score, recommendation)"""
    resume, error = ResumeService.update_resume(
        db, current_user.id, resume_id,
        hr_notes=request.hr_notes,
        match_score=request.match_score,
        recommendation=request.recommendation
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return resume


@router.delete("/{resume_id}", response_model=ResumeDeleteResponse)
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete resume by ID"""
    error = ResumeService.delete_resume(db, current_user.id, resume_id)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return ResumeDeleteResponse(
        status="success",
        message="Resume deleted successfully",
        deleted_count=1
    )


@router.post("/bulk-delete", response_model=ResumeDeleteResponse)
async def bulk_delete_resumes(
    request: BulkDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete multiple resumes at once"""
    deleted_count, error = ResumeService.bulk_delete_resumes(
        db, current_user.id, request.resume_ids
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return ResumeDeleteResponse(
        status="success",
        message=f"Deleted {deleted_count} resumes",
        deleted_count=deleted_count
    )
