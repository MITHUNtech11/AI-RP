"""Comparison model"""
from sqlalchemy import Column, String, DateTime, Table, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..config.database import Base


# Association table for many-to-many relationship between Comparison and Resume
comparison_resumes = Table(
    'comparison_resumes',
    Base.metadata,
    Column('comparison_id', String, ForeignKey('comparisons.id'), primary_key=True),
    Column('resume_id', String, ForeignKey('resumes.id'), primary_key=True)
)


class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    comparison_data = Column(JSON, nullable=True)  # Results of the comparison
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="comparisons")
    resumes = relationship("Resume", secondary=comparison_resumes, back_populates="comparisons")

    def __repr__(self):
        return f"<Comparison(id={self.id}, user_id={self.user_id})>"

