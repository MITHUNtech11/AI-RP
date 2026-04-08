"""Database models"""
from ..config.database import Base
from .user import User, UserPreferences
from .resume import Resume
from .job_description import JobDescription
from .activity import Activity
from .comparison import Comparison

__all__ = [
    "Base", 
    "User", 
    "UserPreferences",
    "Resume",
    "JobDescription",
    "Activity",
    "Comparison"
]

