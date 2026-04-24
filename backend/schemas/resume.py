"""Resume request/response schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ResumeCreate(BaseModel):
    """Create resume with parsed data"""
    resume_json: Dict[str, Any] = Field(..., description="Parsed resume JSON from Gemini")
    file_name: str = Field(..., min_length=1, max_length=255)
    
    class Config:
        example = {
            "file_name": "john_doe_resume.pdf",
            "resume_json": {
                "personalInfo": {"fullName": "John Doe", "email": "john@example.com"},
                "skills": ["Python", "React"],
                "experience": []
            }
        }


class ResumeUpdate(BaseModel):
    """Update resume metadata"""
    hr_notes: Optional[str] = None
    match_score: Optional[int] = Field(None, ge=0, le=100)
    recommendation: Optional[str] = Field(None, pattern="^(Strong Hire|Hire|Hold|Reject)$")
    
    class Config:
        example = {
            "hr_notes": "Good candidate, follow up next week",
            "match_score": 85,
            "recommendation": "Strong Hire"
        }


class ResumeResponse(BaseModel):
    """Resume response with all data"""
    id: str
    user_id: str
    file_name: str
    resume_json: Dict[str, Any]
    hr_notes: Optional[str]
    match_score: Optional[int]
    recommendation: Optional[str]
    upload_date: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    """Resume list item (lighter payload)"""
    id: str
    file_name: str
    personal_info: Optional[Dict[str, str]] = None  # extracted from resume_json
    match_score: Optional[int]
    recommendation: Optional[str]
    upload_date: datetime
    
    class Config:
        from_attributes = True


class ResumesListPaginatedResponse(BaseModel):
    """Paginated list response"""
    items: List[ResumeListResponse]
    total: int
    page: int
    limit: int
    has_more: bool


class ResumeDeleteResponse(BaseModel):
    """Delete response"""
    status: str = "success"
    message: str
    deleted_count: int


class BulkDeleteRequest(BaseModel):
    """Bulk delete request"""
    resume_ids: List[str] = Field(..., min_items=1, max_items=100)
