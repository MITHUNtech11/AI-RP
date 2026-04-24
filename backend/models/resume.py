"""Resume model"""
from sqlalchemy import Column, String, DateTime, Integer, Float, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..config.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    resume_json = Column(JSON, nullable=False)  # Full parsed resume data
    hr_notes = Column(Text, nullable=True)
    
    # Evaluation metrics
    match_score = Column(Integer, nullable=True)  # 0-100
    recommendation = Column(String, nullable=True)  # 'Strong Hire', 'Hire', 'Hold', 'Reject'
    
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    comparisons = relationship("Comparison", back_populates="resumes", secondary="comparison_resumes")

    def __repr__(self):
        return f"<Resume(id={self.id}, file_name={self.file_name}, user_id={self.user_id})>"

