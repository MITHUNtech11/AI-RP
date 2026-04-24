"""User profile schemas"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserProfileUpdate(BaseModel):
    """Update user profile"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    
    class Config:
        example = {
            "full_name": "John Doe",
            "email": "john@example.com"
        }


class UserPreferencesResponse(BaseModel):
    """User preferences response"""
    theme: str = "system"  # 'light', 'dark', 'system'
    notifications_enabled: bool = True
    language: str = "en"
    
    class Config:
        from_attributes = True


class UserPreferencesUpdate(BaseModel):
    """Update user preferences"""
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    language: Optional[str] = None
    
    class Config:
        example = {
            "theme": "dark",
            "notifications_enabled": True,
            "language": "en"
        }


class UserFullResponse(BaseModel):
    """Complete user profile with preferences"""
    id: str
    email: str
    full_name: str
    is_active: bool
    preferences: Optional[UserPreferencesResponse] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserAnalyticsResponse(BaseModel):
    """User analytics/stats"""
    total_resumes_scanned: int = 0
    total_resumes_shortlisted: int = 0
    total_comparisons: int = 0
    last_activity: Optional[datetime] = None
    
    class Config:
        example = {
            "total_resumes_scanned": 42,
            "total_resumes_shortlisted": 12,
            "total_comparisons": 5,
            "last_activity": "2024-01-15T10:30:00"
        }
