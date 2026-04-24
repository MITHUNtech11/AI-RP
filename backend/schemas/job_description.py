"""Job Description request/response schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class JobDescriptionCreate(BaseModel):
    """Create job description"""
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    
    class Config:
        example = {
            "title": "Senior Frontend Engineer",
            "description": "We are looking for a Senior Frontend Engineer with 5+ years of experience..."
        }


class JobDescriptionUpdate(BaseModel):
    """Update job description"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    is_active: Optional[bool] = None
    
    class Config:
        example = {
            "title": "Senior Frontend Engineer (Updated)",
            "is_active": True
        }


class JobDescriptionResponse(BaseModel):
    """Job description response"""
    id: str
    user_id: str
    title: str
    description: str
    jd_json: Optional[Dict[str, Any]]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobDescriptionListResponse(BaseModel):
    """Job description list item"""
    id: str
    title: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobDescriptionsListResponse(BaseModel):
    """List of job descriptions"""
    items: List[JobDescriptionListResponse]
    total: int


class SetActiveJDRequest(BaseModel):
    """Set job description as active"""
    is_active: bool


class ParseJDRequest(BaseModel):
    """Request to parse JD via backend"""
    jd_text: str = Field(..., min_length=10)


class JobDescriptionDeleteResponse(BaseModel):
    """Delete response"""
    status: str = "success"
    message: str
