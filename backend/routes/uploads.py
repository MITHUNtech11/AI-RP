"""Resume upload and batch processing routes (Phase 4)"""
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import time
import logging

from ..config.database import get_db
from ..config.dependencies import get_current_user
from ..models.user import User
from ..services.file_service import FileService, ParsingService, BatchProcessingService
from ..services.resume_service import ResumeService
from ..schemas.resume import ResumeResponse

router = APIRouter(
    prefix="/uploads",
    tags=["file-uploads"],
    responses={401: {"description": "Unauthorized"}}
)

logger = logging.getLogger(__name__)


def _map_parsing_error(exc: Exception, fallback_message: str) -> HTTPException:
    """Translate low-level parser/provider errors into concise API responses."""
    message = str(exc)
    message_lower = message.lower()

    if (
        "api_key_invalid" in message_lower
        or "api key expired" in message_lower
        or "gemini_api_key is not configured" in message_lower
    ):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI parser configuration issue: GEMINI_API_KEY is missing, invalid, or expired. Update backend .env and restart the server."
        )

    if "rate limit" in message_lower or "code\": 429" in message_lower or "status code 429" in message_lower:
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI parser rate limit reached. Please retry in a minute."
        )

    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=fallback_message
    )


@router.post("/resume", response_model=ResumeResponse, status_code=201)
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse a single resume file
    Supports: PDF, DOCX, TXT, PNG, JPG
    """
    try:
        # Read file content
        contents = await file.read()
        
        # Validate file
        valid, message = FileService.validate_file(file.filename, len(contents))
        if not valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Parse resume
        start_time = time.time()
        parsed_data = await ParsingService.parse_resume_file(
            contents,
            file.filename,
            use_azure_vision=True
        )
        parsing_time = time.time() - start_time
        
        # Save to database
        resume = ResumeService.create_resume(
            db,
            current_user.id,
            file.filename,
            parsed_data
        )
        
        return resume
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Resume parsing failed for %s", file.filename)
        raise _map_parsing_error(e, "Failed to parse resume due to an internal parsing error.")


@router.post("/batch", status_code=202)
async def batch_upload_resumes(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse multiple resumes in batch
    Returns status and results for each file
    """
    try:
        if not files or len(files) > 50:
            raise HTTPException(
                status_code=400,
                detail="Please upload between 1 and 50 files"
            )
        
        # Prepare file list
        file_list = []
        for file in files:
            contents = await file.read()
            valid, message = FileService.validate_file(file.filename, len(contents))
            if valid:
                file_list.append((contents, file.filename))
        
        # Process batch
        start_time = time.time()
        results = await BatchProcessingService.process_batch(
            file_list,
            use_azure_vision=True,
            max_workers=4
        )
        
        # Save successful parses to database
        for result in results["results"]:
            if result["status"] == "success":
                try:
                    ResumeService.create_resume(
                        db,
                        current_user.id,
                        result["filename"],
                        result["data"]
                    )
                except Exception as e:
                    result["save_error"] = str(e)
        
        processing_time = time.time() - start_time
        
        return {
            "status": "completed",
            "total_files": results["total"],
            "successful": results["successful"],
            "failed": results["failed"],
            "processing_time_ms": round(processing_time * 1000, 2),
            "results": results["results"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Batch resume processing failed")
        raise _map_parsing_error(e, "Batch processing failed due to an internal parsing error.")


@router.post("/cleanup")
async def cleanup_old_uploads(
    days: int = 7,
    current_user: User = Depends(get_current_user)
):
    """
    Clean up old temporary files from upload directory
    Only accessible to authenticated users (for safety)
    """
    try:
        deleted_count = FileService.cleanup_old_files(days)
        
        return {
            "status": "success",
            "deleted_files": deleted_count,
            "message": f"Cleaned up files older than {days} days"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cleanup failed: {str(e)}"
        )
