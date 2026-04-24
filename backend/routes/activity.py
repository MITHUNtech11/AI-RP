"""Activity tracking routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..config.dependencies import get_current_user
from ..models.user import User
from ..schemas.activity import (
    ActivityResponse, ActivityListResponse, ActivitySummaryResponse
)
from ..services.resume_service import ActivityService

router = APIRouter(
    prefix="/activities",
    tags=["activities"],
    responses={401: {"description": "Unauthorized"}}
)


@router.get("", response_model=ActivityListResponse)
async def get_activities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get user activity history"""
    activities, total = ActivityService.get_user_activities(db, current_user.id, page, limit)
    
    items = [ActivityResponse.from_orm(act) for act in activities]
    has_more = (page * limit) < total
    
    return ActivityListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/summary", response_model=ActivitySummaryResponse)
async def get_activity_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity summary stats"""
    summary = ActivityService.get_activity_summary(db, current_user.id)
    
    return ActivitySummaryResponse(**summary)
