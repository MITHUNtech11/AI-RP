"""Resume upload and batch processing routes (Phase 4)"""
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import time

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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse resume: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500,
            detail=f"Batch processing failed: {str(e)}"
        )


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
