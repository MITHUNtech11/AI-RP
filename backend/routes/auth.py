"""Authentication routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..config.database import get_db
from ..config.dependencies import get_current_user
from ..schemas.auth import (
    SignupRequest, LoginRequest, TokenResponse, UserResponse,
    RefreshTokenRequest, TokenValidationResponse, ChangePasswordRequest
)
from ..services.auth_service import AuthService, PasswordService, TokenService
from ..models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={401: {"description": "Unauthorized"}, 422: {"description": "Validation error"}}
)




@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user
    
    Returns access and refresh tokens if successful
    """
    user, error = AuthService.signup(db, request.email, request.full_name, request.password)
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Auto-login after signup
    token_response, error = AuthService.login(db, request.email, request.password)
    if error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate tokens"
        )
    
    return token_response


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login user and return JWT tokens
    """
    token_response, error = AuthService.login(db, request.email, request.password)
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error
        )
    
    return token_response


@router.post("/refresh", response_model=dict)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token
    """
    new_access_token, error = AuthService.refresh_access_token(db, request.refresh_token)
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error
        )
    
    expires_in = 3600  # 1 hour in seconds
    return {
        "status": "success",
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": expires_in
    }


@router.post("/validate", response_model=TokenValidationResponse)
async def validate_token(token: str, db: Session = Depends(get_db)):
    """
    Validate JWT token and return user info
    """
    user, error = AuthService.get_current_user(db, token)
    
    if error:
        return TokenValidationResponse(valid=False, message=error)
    
    return TokenValidationResponse(
        valid=True,
        user_id=user.id,
        message="Token is valid"
    )


@router.get("/me", response_model=UserResponse)
async def get_current_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )


@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Verify current password
    if not PasswordService.verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.password_hash = PasswordService.hash_password(request.new_password)
    db.commit()
    
    return {
        "status": "success",
        "message": "Password changed successfully"
    }


@router.post("/logout")
async def logout():
    """
    Logout user (client-side token deletion)
    This is a convenience endpoint; actual logout is handled client-side
    """
    return {
        "status": "success",
        "message": "Logged out successfully"
    }
