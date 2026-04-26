"""Resume upload and batch processing routes (Phase 4)

Handles:
- Single resume uploads with parsing
- Batch resume uploads with progress tracking
- Temporary file cleanup
- Comprehensive error handling with user-friendly messages
- Loading and empty states
"""
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import time
import logging
from enum import Enum

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


class ProcessingStatus(str, Enum):
    """Standardized processing status values"""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    PARTIAL_SUCCESS = "partial_success"
    FAILED = "failed"


class ErrorCategory(str, Enum):
    """Error categories for standardized error handling"""
    FILE_VALIDATION = "file_validation"
    FILE_PROCESSING = "file_processing"
    SERVICE_UNAVAILABLE = "service_unavailable"
    RATE_LIMITED = "rate_limited"
    DATABASE_ERROR = "database_error"
    UNKNOWN_ERROR = "unknown_error"


def _create_error_response(
    category: ErrorCategory,
    user_message: str,
    status_code: int,
    suggestions: List[str] = None
) -> Dict[str, Any]:
    """
    Create standardized error response that never exposes raw objects.
    
    Args:
        category: Error category for client-side handling
        user_message: Human-readable error message
        status_code: HTTP status code
        suggestions: List of suggested actions for the user
    """
    return {
        "error": {
            "category": category.value,
            "message": user_message,
            "suggestions": suggestions or [],
            "timestamp": time.time()
        }
    }




def _map_parsing_error(exc: Exception) -> tuple[int, ErrorCategory, str, List[str]]:
    """
    Translate low-level parser/provider errors into user-friendly responses.
    Never exposes raw exception messages or stack traces.
    
    Returns:
        (status_code, error_category, user_message, suggestions)
    """
    message = str(exc).lower()
    
    # API Key Configuration Errors
    if any(x in message for x in ["api_key_invalid", "api key expired", "gemini_api_key is not configured"]):
        return (
            status.HTTP_503_SERVICE_UNAVAILABLE,
            ErrorCategory.SERVICE_UNAVAILABLE,
            "The AI parser is not properly configured on the server.",
            ["Please contact your system administrator to check the server configuration."]
        )
    
    # Rate Limiting Errors
    if any(x in message for x in ["rate limit", "429", "quota"]):
        return (
            status.HTTP_429_TOO_MANY_REQUESTS,
            ErrorCategory.RATE_LIMITED,
            "The AI parser is currently busy processing too many requests.",
            [
                "Please wait 1-2 minutes and try again.",
                "Try uploading fewer files at once.",
                "Contact support if the issue persists."
            ]
        )
    
    # Service Unavailability Errors
    if any(x in message for x in ["unavailable", "503", "timeout", "connection refused", "service temporarily unavailable"]):
        return (
            status.HTTP_503_SERVICE_UNAVAILABLE,
            ErrorCategory.SERVICE_UNAVAILABLE,
            "The AI parser is temporarily unavailable due to high demand.",
            [
                "Please try again in a few moments.",
                "If this persists, contact support for assistance."
            ]
        )
    
    # File Processing Errors
    if any(x in message for x in ["corrupt", "invalid format", "unreadable", "encoding error"]):
        return (
            status.HTTP_400_BAD_REQUEST,
            ErrorCategory.FILE_PROCESSING,
            "The file could not be read or processed. It may be corrupted or in an unsupported format.",
            [
                "Try saving the file again and re-uploading.",
                "Ensure the file is not password-protected.",
                "Try converting to PDF format if possible."
            ]
        )
    
    # Default to generic error (never expose raw message)
    logger.warning(f"Unmapped parsing error: {type(exc).__name__}")
    return (
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        ErrorCategory.UNKNOWN_ERROR,
        "An unexpected error occurred while processing your file.",
        [
            "Please try again.",
            "If the problem continues, contact support with reference ID: parse_" + str(int(time.time()))
        ]
    )





@router.post("/resume", response_model=ResumeResponse, status_code=201)
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse a single resume file.
    
    Supported formats: PDF, DOCX, DOC, TXT, PNG, JPG, JPEG
    Max file size: 10MB
    
    Returns:
        201: Successfully parsed and saved resume
        400: Invalid file or file validation failed
        429: Rate limit exceeded
        503: AI parser unavailable
        500: Server error
    """
    # Validate file upload
    if not file or not file.filename:
        logger.warning(f"Upload attempted with no file by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected. Please select a resume file to upload."
        )
    
    # Read file content
    try:
        contents = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file {file.filename}: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read the uploaded file. The file may be corrupted or too large."
        )
    
    # Validate file is not empty
    if not contents or len(contents) == 0:
        logger.warning(f"Empty file upload attempted: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please select a file with content."
        )
    
    # Validate file type and size
    valid, validation_message = FileService.validate_file(file.filename, len(contents))
    if not valid:
        logger.info(f"File validation failed for {file.filename}: {validation_message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_message
        )
    
    # Parse resume with error handling
    try:
        start_time = time.time()
        parsed_data = await ParsingService.parse_resume_file(
            contents,
            file.filename,
            use_azure_vision=True
        )
        parsing_time = time.time() - start_time
        
        # Validate parsed data
        if not parsed_data:
            logger.warning(f"Parser returned empty data for {file.filename}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The resume file could not be parsed. It may be in an unsupported format or contain no readable text."
            )
        
        logger.info(f"Resume parsed successfully in {parsing_time:.2f}s: {file.filename}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Resume parsing failed for {file.filename}")
        status_code, error_cat, user_msg, suggestions = _map_parsing_error(e)
        raise HTTPException(
            status_code=status_code,
            detail=user_msg
        )
    
    # Save to database
    try:
        resume, save_error = ResumeService.create_resume(
            db,
            current_user.id,
            file.filename,
            parsed_data
        )
        
        if save_error or not resume:
            logger.error(f"Database save failed for {file.filename}: {save_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The resume was parsed successfully but could not be saved to the database. Please try again."
            )
        
        logger.info(f"Resume saved successfully: {file.filename} (ID: {resume.id})")
        return resume
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Database error while saving resume {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while saving the resume. Please try uploading again."
        )





@router.post("/batch", status_code=202)
async def batch_upload_resumes(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse multiple resume files in batch.
    
    Returns 202 (Accepted) with processing status. This is a "loading state" response.
    
    Supported formats: PDF, DOCX, DOC, TXT, PNG, JPG, JPEG
    Max files: 50 per batch
    Max file size: 10MB each
    
    Returns:
        202: Batch processing accepted and in progress
        400: Invalid request (no files, too many files, etc.)
        500: Server error during batch processing
    """
    # Validate file list
    if not files:
        logger.warning(f"Batch upload attempted with no files by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files selected. Please select at least one resume file to upload."
        )
    
    if len(files) > 50:
        logger.warning(f"Batch upload attempted with {len(files)} files (max 50) by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Too many files ({len(files)} selected). Maximum 50 files per batch. Please split into smaller batches."
        )
    
    # Prepare file list with validation
    file_list = []
    validation_errors = []
    
    for idx, file in enumerate(files):
        # Check for missing filename
        if not file or not file.filename:
            validation_errors.append({
                "index": idx,
                "status": ProcessingStatus.FAILED.value,
                "filename": "unknown",
                "error": "File missing or has no name"
            })
            continue
        
        # Read file content
        try:
            contents = await file.read()
        except Exception as e:
            logger.error(f"Failed to read file {idx}: {file.filename}: {type(e).__name__}")
            validation_errors.append({
                "index": idx,
                "status": ProcessingStatus.FAILED.value,
                "filename": file.filename,
                "error": "Could not read file - it may be corrupted"
            })
            continue
        
        # Check for empty file
        if not contents or len(contents) == 0:
            logger.warning(f"Empty file in batch: {file.filename}")
            validation_errors.append({
                "index": idx,
                "status": ProcessingStatus.FAILED.value,
                "filename": file.filename,
                "error": "File is empty"
            })
            continue
        
        # Validate file type and size
        valid, validation_message = FileService.validate_file(file.filename, len(contents))
        if not valid:
            logger.info(f"File validation failed in batch: {file.filename}: {validation_message}")
            validation_errors.append({
                "index": idx,
                "status": ProcessingStatus.FAILED.value,
                "filename": file.filename,
                "error": validation_message
            })
            continue
        
        file_list.append((contents, file.filename, idx))
    
    # If all files failed validation, return error
    if not file_list and validation_errors:
        logger.warning(f"All {len(validation_errors)} files failed validation in batch upload")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"All {len(validation_errors)} files failed validation. Please check file formats and sizes."
        )
    
    # Process valid files in batch
    batch_start_time = time.time()
    results = {"results": [], "successful": 0, "failed": 0, "total": len(files)}
    
    try:
        # Process files asynchronously
        parsing_results = await BatchProcessingService.process_batch(
            file_list,
            use_azure_vision=True,
            max_workers=4
        )
        
        # Save successful parses to database
        for result in parsing_results.get("results", []):
            if result.get("status") == "success":
                try:
                    created_resume, db_error = ResumeService.create_resume(
                        db,
                        current_user.id,
                        result.get("filename", "unknown"),
                        result.get("data", {})
                    )
                    
                    if db_error or not created_resume:
                        result["status"] = ProcessingStatus.FAILED.value
                        result["error"] = "Parsed successfully but could not be saved"
                        results["failed"] += 1
                        logger.error(f"DB save failed for {result.get('filename')}: {db_error}")
                    else:
                        result["status"] = ProcessingStatus.SUCCESS.value
                        result["resume_id"] = created_resume.id
                        results["successful"] += 1
                        logger.info(f"Resume saved in batch: {result.get('filename')} (ID: {created_resume.id})")
                        
                except Exception as e:
                    logger.exception(f"DB error saving {result.get('filename')}")
                    result["status"] = ProcessingStatus.FAILED.value
                    result["error"] = "Could not save to database"
                    results["failed"] += 1
            else:
                results["failed"] += 1
        
        # Add pre-validation errors to results
        results["results"].extend(validation_errors)
        
        processing_time_ms = round((time.time() - batch_start_time) * 1000, 2)
        
        # Determine overall status
        if results["successful"] == results["total"]:
            overall_status = ProcessingStatus.SUCCESS.value
        elif results["successful"] > 0:
            overall_status = ProcessingStatus.PARTIAL_SUCCESS.value
        else:
            overall_status = ProcessingStatus.FAILED.value
        
        # Return 202 with status info (loading state)
        logger.info(f"Batch processing completed: {results['successful']}/{results['total']} successful in {processing_time_ms}ms")
        
        return {
            "status": overall_status,
            "message": f"Batch processing complete: {results['successful']} succeeded, {results['failed']} failed",
            "stats": {
                "total_files": results["total"],
                "successful": results["successful"],
                "failed": results["failed"],
                "processing_time_ms": processing_time_ms
            },
            "results": [
                {
                    "filename": r.get("filename", "unknown"),
                    "status": r.get("status", ProcessingStatus.FAILED.value),
                    "error": r.get("error"),
                    "resume_id": r.get("resume_id")
                }
                for r in results["results"]
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Critical error during batch processing")
        status_code, error_cat, user_msg, suggestions = _map_parsing_error(e)
        raise HTTPException(
            status_code=status_code,
            detail=f"Batch processing failed: {user_msg}"
        )





@router.post("/cleanup")
async def cleanup_old_uploads(
    days: int = 7,
    current_user: User = Depends(get_current_user)
):
    """
    Clean up old temporary files from upload directory.
    Only accessible to authenticated users.
    
    Args:
        days: Delete files older than this many days (default: 7)
    
    Returns:
        200: Cleanup completed successfully
        400: Invalid parameters
        500: Cleanup failed
    """
    # Validate input
    if days < 1 or days > 365:
        logger.warning(f"Invalid cleanup days parameter: {days} by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days parameter must be between 1 and 365."
        )
    
    try:
        deleted_count = FileService.cleanup_old_files(days)
        
        logger.info(f"Cleanup completed: {deleted_count} files deleted (older than {days} days) by user {current_user.id}")
        
        return {
            "status": "success",
            "deleted_files": deleted_count,
            "message": f"Successfully cleaned up {deleted_count} files older than {days} days."
        }
        
    except PermissionError:
        logger.error(f"Permission denied during cleanup")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cleanup failed due to permission issues. Please contact your administrator."
        )
        
    except Exception as e:
        logger.exception(f"Cleanup failed: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cleanup operation failed. Please try again later or contact support."
        )

