"""Schemas for all endpoints"""
from pydantic import BaseModel


class StandardResponse(BaseModel):
    """Standard API response wrapper"""
    status: str  # 'success', 'error'
    data: dict = None
    message: str = None
    timestamp: str = None
    
    class Config:
        example = {
            "status": "success",
            "data": {},
            "message": "Operation completed successfully",
            "timestamp": "2024-01-15T10:30:00Z"
        }
