"""Activity tracking model"""
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..config.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False)  # e.g., 'resume_uploaded', 'resume_evaluated', etc.
    event_data = Column(JSON, nullable=True)  # Additional metadata
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="activities")

    def __repr__(self):
        return f"<Activity(id={self.id}, event_type={self.event_type}, user_id={self.user_id})>"

