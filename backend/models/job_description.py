"""Job Description model"""
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..config.database import Base


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    jd_json = Column(JSON, nullable=True)  # Parsed JD data from backend
    is_active = Column(String, default=False)  # Currently selected for evaluations
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="job_descriptions")

    def __repr__(self):
        return f"<JobDescription(id={self.id}, title={self.title}, user_id={self.user_id})>"

