"""Comparison and ranking routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from ..config.database import get_db
from ..config.dependencies import get_current_user
from ..models.user import User
from ..schemas.comparison import (
    ComparisonRequest, ComparisonResult, ComparisonListResponse,
    ComparisonUpdateRequest, BulkRankRequest, BulkRankResponse,
    RankingBreakdown
)
from ..services.comparison_service import ComparisonService, RankingService

router = APIRouter(
    prefix="/comparisons",
    tags=["comparisons"],
    responses={401: {"description": "Unauthorized"}}
)


@router.post("", response_model=ComparisonResult, status_code=201)
async def create_comparison(
    request: ComparisonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new comparison between resumes"""
    try:
        # Rank resumes against JD if provided
        ranking_result = {}
        if request.job_description_id:
            ranking_result = RankingService.rank_resumes(
                db,
                current_user.id,
                request.job_description_id,
                request.resume_ids,
                use_advanced_scoring=False
            )
        
        comparison = ComparisonService.create_comparison(
            db,
            current_user.id,
            request.title,
            request.description,
            request.resume_ids,
            request.job_description_id,
            ranking_result,
            request.custom_criteria
        )
        
        return comparison
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create comparison")


@router.get("", response_model=ComparisonListResponse)
async def list_comparisons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """List all comparisons for current user"""
    comparisons, total = ComparisonService.list_comparisons(db, current_user.id, page, limit)
    
    has_more = (page * limit) < total
    
    return ComparisonListResponse(
        comparisons=comparisons,
        total=total,
        page=page,
        limit=limit,
        has_more=has_more
    )


@router.get("/{comparison_id}", response_model=ComparisonResult)
async def get_comparison(
    comparison_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single comparison details"""
    comparison = ComparisonService.get_comparison(db, current_user.id, comparison_id)
    
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comparison not found"
        )
    
    return comparison


@router.put("/{comparison_id}", response_model=ComparisonResult)
async def update_comparison(
    comparison_id: str,
    request: ComparisonUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update comparison notes and status"""
    comparison = ComparisonService.update_comparison(
        db,
        current_user.id,
        comparison_id,
        request.notes,
        request.status
    )
    
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comparison not found"
        )
    
    return comparison


@router.delete("/{comparison_id}", status_code=204)
async def delete_comparison(
    comparison_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete comparison"""
    success = ComparisonService.delete_comparison(db, current_user.id, comparison_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comparison not found"
        )
    
    return None


@router.post("/rank/bulk", response_model=BulkRankResponse)
async def bulk_rank_resumes(
    request: BulkRankRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rank multiple resumes against a job description"""
    try:
        result = RankingService.rank_resumes(
            db,
            current_user.id,
            request.job_description_id,
            request.resume_ids,
            request.use_advanced_scoring
        )
        
        return BulkRankResponse(
            job_description_id=request.job_description_id,
            total_resumes=result['total_resumes'],
            rankings=result['rankings'],
            processing_time_ms=1.5,  # Placeholder
            created_at=result['created_at']
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to rank resumes")

