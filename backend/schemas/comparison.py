"""Comparison schemas for comparing multiple resumes"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ComparisonScore(BaseModel):
    """Individual resume score in comparison"""
    resume_id: str
    file_name: str
    candidate_name: str
    overall_score: float = Field(ge=0, le=100)
    skills_match: float = Field(ge=0, le=100)
    experience_match: float = Field(ge=0, le=100)
    education_match: float = Field(ge=0, le=100)
    key_strengths: List[str]
    gaps: List[str]
    ranking_position: int


class ComparisonRequest(BaseModel):
    """Request to compare multiple resumes"""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    resume_ids: List[str] = Field(min_items=2, max_items=20)
    job_description_id: Optional[str] = None
    custom_criteria: Optional[Dict[str, Any]] = None
    
    class Config:
        example = {
            "title": "Software Engineer candidates - Q1 2024",
            "description": "Top candidates for Senior Engineer role",
            "resume_ids": ["res_123", "res_456", "res_789"],
            "job_description_id": "jd_001",
            "custom_criteria": {
                "min_years_experience": 5,
                "required_skills": ["Python", "FastAPI", "React"]
            }
        }


class ComparisonResult(BaseModel):
    """Comparison result with ranked resumes"""
    id: str
    title: str
    description: Optional[str] = None
    scores: List[ComparisonScore]
    top_candidate: ComparisonScore
    created_at: datetime
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class ComparisonListResponse(BaseModel):
    """Paginated comparison list"""
    comparisons: List[ComparisonResult]
    total: int
    page: int
    limit: int
    has_more: bool


class ComparisonUpdateRequest(BaseModel):
    """Update comparison notes and status"""
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|archived|completed)$")
    
    class Config:
        example = {
            "notes": "Decided to move forward with candidate #1",
            "status": "completed"
        }


class RankingBreakdown(BaseModel):
    """Detailed ranking breakdown for a candidate"""
    resume_id: str
    candidate_name: str
    overall_score: float
    skills: Dict[str, float]
    experience_assessment: Dict[str, Any]
    education_assessment: Dict[str, Any]
    recommendation: str
    reasoning: str


class BulkRankRequest(BaseModel):
    """Request to rank multiple resumes against a JD"""
    job_description_id: str
    resume_ids: List[str] = Field(min_items=1, max_items=100)
    use_advanced_scoring: bool = False
    return_detailed_breakdown: bool = False


class BulkRankResponse(BaseModel):
    """Response with ranked resumes"""
    job_description_id: str
    total_resumes: int
    rankings: List[RankingBreakdown]
    processing_time_ms: float
    created_at: datetime
