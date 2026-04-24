"""Activity tracking schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class ActivityCreate(BaseModel):
    """Create activity log"""
    event_type: str = Field(..., min_length=3, max_length=100)
    event_data: Optional[Dict[str, Any]] = None


class ActivityResponse(BaseModel):
    """Activity response"""
    id: str
    user_id: str
    event_type: str
    event_data: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ActivityListResponse(BaseModel):
    """Activity list response"""
    items: List[ActivityResponse]
    total: int
    page: int
    limit: int


class ActivitySummaryResponse(BaseModel):
    """Activity summary stats"""
    total_events: int
    events_this_week: int
    events_this_month: int
    last_activity: Optional[datetime]
    event_breakdown: Dict[str, int]  # event_type -> count
