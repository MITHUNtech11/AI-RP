"""Authentication request/response schemas"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
    
    class Config:
        example = {
            "email": "user@example.com",
            "full_name": "John Doe",
            "password": "SecurePassword123!"
        }


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str
    
    class Config:
        example = {
            "email": "user@example.com",
            "password": "SecurePassword123!"
        }


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: "UserResponse"


class UserResponse(BaseModel):
    """User profile response"""
    id: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """Update user profile"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    
    class Config:
        example = {
            "full_name": "Jane Doe",
            "email": "jane@example.com"
        }


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    class Config:
        example = {
            "current_password": "OldPassword123!",
            "new_password": "NewPassword456!"
        }


class RefreshTokenRequest(BaseModel):
    """Refresh JWT token"""
    refresh_token: str


class TokenValidationResponse(BaseModel):
    """Token validation response"""
    valid: bool
    user_id: Optional[str] = None
    message: str


class AuthErrorResponse(BaseModel):
    """Authentication error response"""
    detail: str
    error_code: str
    
    class Config:
        example = {
            "detail": "Invalid credentials",
            "error_code": "INVALID_CREDENTIALS"
        }
