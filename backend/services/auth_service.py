"""Authentication services - password hashing, JWT generation, token validation"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
import uuid
import logging

from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..config.settings import (
    JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, 
    JWT_REFRESH_EXPIRATION_DAYS
)
from ..models.user import User, UserPreferences
from ..schemas.auth import TokenResponse, UserResponse

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordService:
    """Handle password hashing and verification"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)


class TokenService:
    """Handle JWT token generation and validation"""
    
    @staticmethod
    def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> Tuple[str, int]:
        """
        Create JWT access token
        Returns: (token, expiration_seconds)
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        expires_in = int((expire - datetime.utcnow()).total_seconds())
        
        return encoded_jwt, expires_in
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create JWT refresh token"""
        expire = datetime.utcnow() + timedelta(days=JWT_REFRESH_EXPIRATION_DAYS)
        
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict]:
        """
        Verify JWT token and return payload
        Returns None if invalid/expired
        """
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return payload
        except JWTError as e:
            logger.warning(f"Invalid token: {str(e)}")
            return None
    
    @staticmethod
    def get_user_id_from_token(token: str) -> Optional[str]:
        """Extract user_id from valid token"""
        payload = TokenService.verify_token(token)
        if payload:
            return payload.get("sub")
        return None


class AuthService:
    """High-level authentication service"""
    
    @staticmethod
    def signup(db: Session, email: str, full_name: str, password: str) -> Tuple[User, str]:
        """
        Register new user
        Returns: (user, error_message) - empty string if successful
        """
        # Check if user exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            return None, "Email already registered"
        
        # Create new user
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=email,
            full_name=full_name,
            password_hash=PasswordService.hash_password(password),
            is_active=True
        )
        
        # Create default preferences
        pref_id = str(uuid.uuid4())
        preferences = UserPreferences(
            id=pref_id,
            user_id=user_id,
            theme="system",
            notifications_enabled=True
        )
        
        # Commit to database
        db.add(user)
        db.add(preferences)
        db.commit()
        db.refresh(user)
        
        logger.info(f"New user registered: {email}")
        return user, ""
    
    @staticmethod
    def login(db: Session, email: str, password: str) -> Tuple[Optional[TokenResponse], str]:
        """
        Login user
        Returns: (TokenResponse, error_message) - error_message is empty if successful
        """
        # Find user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return None, "Invalid email or password"
        
        if not user.is_active:
            return None, "Account is inactive"
        
        # Verify password
        if not PasswordService.verify_password(password, user.password_hash):
            return None, "Invalid email or password"
        
        # Generate tokens
        access_token, expires_in = TokenService.create_access_token(user.id)
        refresh_token = TokenService.create_refresh_token(user.id)
        
        logger.info(f"User logged in: {email}")
        
        # Return token response
        response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                created_at=user.created_at
            )
        )
        
        return response, ""
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Tuple[Optional[str], str]:
        """
        Create new access token from refresh token
        Returns: (new_access_token, error_message)
        """
        payload = TokenService.verify_token(refresh_token)
        
        if not payload:
            return None, "Invalid or expired refresh token"
        
        if payload.get("type") != "refresh":
            return None, "Invalid token type"
        
        user_id = payload.get("sub")
        
        # Verify user still exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            return None, "User not found or inactive"
        
        # Generate new access token
        new_access_token, _ = TokenService.create_access_token(user_id)
        
        return new_access_token, ""
    
    @staticmethod
    def get_current_user(db: Session, token: str) -> Tuple[Optional[User], str]:
        """
        Get current user from token
        Returns: (user, error_message)
        """
        user_id = TokenService.get_user_id_from_token(token)
        
        if not user_id:
            return None, "Invalid or expired token"
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_active:
            return None, "User not found or inactive"
        
        return user, ""
