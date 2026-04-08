"""User profile and preferences routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..config.dependencies import get_current_user
from ..schemas.user import UserProfileUpdate, UserPreferencesUpdate, UserFullResponse, UserAnalyticsResponse
from ..models.user import User, UserPreferences
import uuid

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={401: {"description": "Unauthorized"}}
)


@router.get("/me/full", response_model=UserFullResponse)
async def get_full_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete user profile with preferences"""
    preferences = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    return UserFullResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        preferences=preferences,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )


@router.put("/me/profile", response_model=dict)
async def update_profile(
    request: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    if request.full_name:
        current_user.full_name = request.full_name
    
    if request.email and request.email != current_user.email:
        # Check if email is already taken
        existing = db.query(User).filter(User.email == request.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = request.email
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "status": "success",
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name
        }
    }


@router.get("/me/preferences")
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user preferences"""
    preferences = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not preferences:
        return {
            "theme": "system",
            "notifications_enabled": True,
            "language": "en"
        }
    
    return {
        "theme": preferences.theme,
        "notifications_enabled": preferences.notifications_enabled,
        "language": preferences.language
    }


@router.put("/me/preferences", response_model=dict)
async def update_preferences(
    request: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    preferences = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not preferences:
        # Create new preferences if doesn't exist
        preferences = UserPreferences(
            id=str(uuid.uuid4()),
            user_id=current_user.id
        )
        db.add(preferences)
    
    if request.theme:
        preferences.theme = request.theme
    if request.notifications_enabled is not None:
        preferences.notifications_enabled = request.notifications_enabled
    if request.language:
        preferences.language = request.language
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Preferences updated successfully",
        "preferences": {
            "theme": preferences.theme,
            "notifications_enabled": preferences.notifications_enabled,
            "language": preferences.language
        }
    }


@router.get("/me/analytics", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user analytics and statistics"""
    # Import here to avoid circular imports
    from models.resume import Resume
    from models.activity import Activity
    
    total_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    total_shortlisted = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.recommendation.in_(["Strong Hire", "Hire"])
    ).count()
    
    last_activity = db.query(Activity).filter(
        Activity.user_id == current_user.id
    ).order_by(Activity.created_at.desc()).first()
    
    return UserAnalyticsResponse(
        total_resumes_scanned=total_resumes,
        total_resumes_shortlisted=total_shortlisted,
        total_comparisons=0,  # Phase 3
        last_activity=last_activity.created_at if last_activity else None
    )
