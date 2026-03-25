"""
FastAPI Resume Parser Backend
3-tier architecture: Frontend -> API -> Resume Parser

🌐 Backend API (Python / FastAPI)
    ↓
🧠 Resume Parser (AI logic via Gemini)
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import traceback
import uuid
import logging

from .config.settings import ALLOWED_FORMATS, MAX_FILE_SIZE_MB, REQUIRE_AUTH, RATE_LIMIT_PARSE, RATE_LIMIT_BATCH, RATE_LIMIT_TEXT
from .config.auth import verify_api_key
from .services.converter import (
    convert_to_png_list,
    extract_text_from_docx_bytes,
    DocxConversionError,
    get_resume_files_from_zip,
)
from .resume_parser.azure_vision import extract_resume_json_multi_page, extract_resume_from_text
from .services.logger import log_processing
from .resume_parser.gemini import generate_text
from .resume_parser.jd_parser import parse_job_description
from .resume_parser.matching_algorithm import rank_candidates as rank_candidates_impl
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic Models for API validation
class ParseResponse(BaseModel):
    status: str
    data: Dict
    processing_time: float
    error: str = None
    file_id: str
    original_filename: str

class BatchResult(BaseModel):
    filename: str
    status: str
    data: Dict = None
    error: str = None
    processing_time: float

class BatchParseResponse(BaseModel):
    status: str
    total_files: int
    successful: int
    failed: int
    results: list[BatchResult]
    total_processing_time: float

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    services: Dict[str, str]

# ============================================
# Pydantic Models for Recruitment Features
# ============================================

class ParseJDResponse(BaseModel):
    status: str
    data: Dict[str, Any]
    processing_time: float
    error: Optional[str] = None

class CandidateScoreBreakdown(BaseModel):
    skills: float
    experience: float
    job_title: float
    education: float

class CandidateScoreDetails(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    candidate_experience_years: float
    jd_required_experience_years: int
    candidate_education: str
    jd_required_education: str
    candidate_job_titles: List[str]

class RankingResult(BaseModel):
    resume_index: int
    candidate_name: str
    overall_score: float
    score_percentage: int
    scores: CandidateScoreBreakdown
    details: CandidateScoreDetails
    reasoning: str
    error: Optional[str] = None

class RankCandidatesResponse(BaseModel):
    status: str
    jd_title: str
    total_candidates: int
    results: List[RankingResult]
    processing_time: float
    error: Optional[str] = None

class RankCandidatesRequest(BaseModel):
    jd_data: Dict[str, Any]
    resume_list: List[Dict[str, Any]]

app = FastAPI(
    title="Resume Parser API",
    description="Convert and parse resumes (PDF/DOCX/Images/Text) to structured JSON",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# HEALTH CHECK ENDPOINT
# ============================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for monitoring and load balancer checks
    
    Returns system status and service availability
    """
    import datetime
    from .config.settings import GEMINI_API_KEY
    
    services_status = {
        "gemini_api": "available" if GEMINI_API_KEY else "unconfigured",
        "file_processing": "available",
        "database": "not_required"  # No database dependency
    }
    
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        timestamp=datetime.datetime.utcnow().isoformat(),
        services=services_status
    )

# ============================================
# ORCHESTRATOR ENDPOINT (RECOMMENDED)
# ============================================

# Define text file extensions that can be processed directly
TEXT_EXTENSIONS = {
    '.txt', '.rtf', '.log', '.md', '.csv', '.json', '.xml', 
    '.yaml', '.yml', '.py', '.js', '.html', '.css', '.c', 
    '.cpp', '.java', '.sh', '.odt', '.tex', '.rst'
}

@app.post("/parse")
async def parse_resume_orchestrator(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """
    Smart orchestrator endpoint - automatically routes to the correct handler
    
    Requires: X-API-Key header with valid API key (if REQUIRE_AUTH=true)
    
    Routes:
    - Text files (.txt, .md, .json, .py, etc.) → Direct text processing
    - Binary files (PDF, DOCX, Images) → Image-based processing
    
    Also saves the original file for later retrieval
    """
    
    filename = file.filename
    file_ext = Path(filename).suffix.lower()
    file_content = await file.read()
    
    logger.info(f"Orchestrator: Received {filename} (type: {file_ext})")
    
    # Validate file content is not empty
    if not file_content or len(file_content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )
    
    logger.info(f"  File size: {len(file_content)} bytes")
    
    # Generate file_id for tracking
    file_id = str(uuid.uuid4())
    
    # Route based on file type
    if file_ext in TEXT_EXTENSIONS:
        logger.info(f"Routing to TEXT handler... ({file_ext})")
        # Create a new UploadFile-like object for the handler
        from io import BytesIO
        file_like = BytesIO(file_content)
        # Re-instantiate the UploadFile with the saved content
        new_file = UploadFile(file_like, filename=filename, size=len(file_content))
        response = await parse_resume_txt(new_file)
    else:
        logger.info(f"Routing to IMAGE handler... ({file_ext})")
        # Create a new UploadFile-like object for the handler
        from io import BytesIO
        file_like = BytesIO(file_content)
        new_file = UploadFile(file_like, filename=filename, size=len(file_content))
        response = await parse_resume(new_file)
    
    # Add file_id and original filename to response
    # Normalize response to a dict and attach file_id
    if isinstance(response, dict):
        response['file_id'] = file_id
        response['original_filename'] = filename
    else:
        try:
            # Try to convert Pydantic-like objects to dict
            response = getattr(response, 'dict', lambda: None)() or {}
            response['file_id'] = file_id
            response['original_filename'] = filename
        except Exception:
            response = {'status': 'success', 'data': response, 'file_id': file_id, 'original_filename': filename}
    
    logger.info(f"  Processed successfully with ID: {file_id}")
    return response


# ============================================
# BATCH PARSING ENDPOINT
# ============================================

@app.post("/parse_batch", response_model=BatchParseResponse)
async def parse_batch(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """
    Parse multiple resumes from a ZIP file.
    
    Requires: X-API-Key header with valid API key (if REQUIRE_AUTH=true)
    
    Accepts: ZIP file containing resume files
    Returns: List of parsing results with status, data, and errors per file
    
    Example response:
    {
        "status": "batch_complete",
        "total_files": 5,
        "successful": 4,
        "failed": 1,
        "results": [
            {
                "filename": "resume1.pdf",
                "status": "success",
                "data": {...},
                "error": null,
                "processing_time": 12.5
            },
            {
                "filename": "resume2.docx",
                "status": "error",
                "data": null,
                "error": "Conversion failed: ...",
                "processing_time": 2.1
            }
        ],
        "total_processing_time": 45.2
    }
    """
    
    batch_start = time.time()
    filename = file.filename
    
    try:
        # Validate ZIP file
        file_ext = Path(filename).suffix.lower()
        if file_ext != '.zip':
            raise HTTPException(
                status_code=400,
                detail=f"Expected ZIP file, got {file_ext}"
            )
        
        # Read ZIP content
        zip_bytes = await file.read()
        
        # Extract resume files from ZIP
        logger.info(f"Extracting resumes from {filename}...")
        resume_files = get_resume_files_from_zip(zip_bytes)
        
        if not resume_files:
            raise HTTPException(
                status_code=400,
                detail="No supported resume files found in ZIP"
            )
        
        logger.info(f"Found {len(resume_files)} resumes to process")
        
        results = []
        successful = 0
        failed = 0
        
        # Process files with thread pool
        def process_single_resume(filename, file_content):
            start_time = time.time()
            try:
                # Use the image-based parser for generic processing
                png_bytes_list = convert_to_png_list(file_content, filename)
                resume_json = extract_resume_json_multi_page(png_bytes_list)
                processing_time = time.time() - start_time
                
                return BatchResult(
                    filename=filename,
                    status="success",
                    data=resume_json,
                    processing_time=processing_time
                )
            except Exception as e:
                processing_time = time.time() - start_time
                return BatchResult(
                    filename=filename,
                    status="error",
                    error=str(e),
                    processing_time=processing_time
                )
        
        # Execute with ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(process_single_resume, filename, fbytes): filename
                for filename, fbytes in resume_files
            }
            
            # Collect results as they complete
            for future in futures:
                try:
                    result = future.result()
                    results.append(result)
                    
                    if result.status == "success":
                        successful += 1
                        logger.info(f"✓ {result.filename} ({result.processing_time:.2f}s)")
                    else:
                        failed += 1
                        logger.warning(f"✗ {result.filename}: {result.error[:50] if result.error else 'Unknown error'}")
                except Exception as e:
                    filename = futures[future]
                    failed += 1
                    error_msg = str(e)
                    print(f"✗ {filename}: {error_msg[:50]}")
                    results.append({
                        "filename": filename,
                        "status": "error",
                        "data": None,
                        "error": error_msg,
                        "processing_time": 0
                    })
        
        batch_time = time.time() - batch_start
        
        return BatchParseResponse(
            status="batch_complete",
            total_files=len(resume_files),
            successful=successful,
            failed=failed,
            results=results,
            total_processing_time=batch_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        batch_time = time.time() - batch_start
        logger.error(f"Batch processing error: {str(e)}")
        logger.error(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "batch_error",
                "message": str(e),
                "total_processing_time": batch_time
            }
        )

# ============================================
# SPECIALIZED ENDPOINTS
# ============================================

@app.post("/parse_resume")
@app.post("/parse", response_model=ParseResponse)
async def parse_resume(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """
    Parse resume from uploaded file (supports multi-page documents)
    
    Requires: X-API-Key header with valid API key (if REQUIRE_AUTH=true)
    
    Supported formats: PDF, DOCX, DOC, JPG, JPEG, PNG, BMP, TIFF, JFIF
    
    Returns: Structured resume JSON (merged from all pages) with file_id for retrieval
    """
    
    request_start = time.time()
    filename = file.filename
    file_ext = Path(filename).suffix.lower()
    file_content = await file.read()
    error_msg = None
    resume_data = None
    file_id = None

    try:
        # Validate file extension
        if file_ext not in ALLOWED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"File format not supported: {file_ext}. Allowed: {ALLOWED_FORMATS}"
            )
        
        # Validate file size
        file_size_mb = len(file_content) / (1024 * 1024)
        if file_size_mb > MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=413,
                detail=f"File too large: {file_size_mb:.2f}MB (max: {MAX_FILE_SIZE_MB}MB)"
            )
        
        # Generate file_id for tracking
        file_id = str(uuid.uuid4())
        
        # Step 1: Convert to PNG (returns list for multi-page)
        png_bytes_list = convert_to_png_list(file_content, filename)
        logger.info(f"Converted {filename} to {len(png_bytes_list)} page(s)")
        
        # Step 2: Extract JSON from ALL pages and merge
        resume_json = extract_resume_json_multi_page(png_bytes_list)
        
        # Convert to Pydantic model for validation
        # Use plain dict instead of Pydantic model
        resume_data = resume_json
        
        processing_time = time.time() - request_start
        
        # Log success
        log_processing(filename, processing_time, "SUCCESS")
        
        return ParseResponse(
            status="success",
            data=resume_data,
            processing_time=processing_time,
            file_id=file_id,
            original_filename=filename
        )
    
    except DocxConversionError as e:
        logger.warning(f"Docx conversion failed for {filename}; falling back to text parser: {e}")
        text_content = extract_text_from_docx_bytes(file_content)
        if not text_content.strip():
            raise HTTPException(
                status_code=500,
                detail="DOCX text extraction returned no content"
            )

        resume_json = extract_resume_from_text(text_content)
        resume_data = resume_json
        processing_time = time.time() - request_start
        log_processing(filename, processing_time, "SUCCESS (docx text fallback)")

        return ParseResponse(
            status="success",
            data=resume_data,
            processing_time=processing_time,
            file_id=file_id,
            original_filename=filename
        )

    except HTTPException:
        raise
    
    except Exception as e:
        processing_time = time.time() - request_start
        error_msg = str(e)
        
        # Log failure
        log_processing(filename, processing_time, "FAILED", error_msg)
        
        logger.error(f"Error processing {filename}: {error_msg}")
        logger.error(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": error_msg,
                "processing_time": processing_time
            }
        )


# ============================================
# RECRUITMENT FEATURES: JD PARSING
# ============================================

@app.post("/parse_jd", response_model=ParseJDResponse)
async def parse_job_description_endpoint(
    text: Optional[str] = None,
    file: Optional[UploadFile] = File(None),
    api_key: str = Depends(verify_api_key)
):
    """
    Parse a Job Description from text or file (PDF/DOCX/Image)
    
    Requires: X-API-Key header with valid API key (if REQUIRE_AUTH=true)
    
    Either provide:
    - text: Raw job description as string, OR
    - file: Upload PDF/DOCX/Image file of JD
    
    Returns: Structured JD data with required skills, experience, title, education, seniority
    """
    request_start = time.time()
    
    try:
        jd_data = None
        
        if text:
            # Parse from text input
            logger.info("Parsing JD from text input...")
            jd_data = parse_job_description(text, is_text=True)
        
        elif file:
            # Parse from file (PDF/DOCX/Image)
            logger.info(f"Parsing JD from file: {file.filename}")
            
            file_ext = Path(file.filename).suffix.lower()
            file_content = await file.read()
            
            if not file_content:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
            
            # For text files, extract text directly
            if file_ext in TEXT_EXTENSIONS:
                # Decode text
                text_content = None
                for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-16']:
                    try:
                        text_content = file_content.decode(encoding)
                        break
                    except (UnicodeDecodeError, UnicodeError):
                        continue
                
                if text_content is None:
                    raise HTTPException(status_code=400, detail="Cannot decode text file. Unsupported encoding.")
                
                jd_data = parse_job_description(text_content, is_text=True)
            
            else:
                # For binary files (PDF/DOCX/Images), convert to images and use Gemini Vision
                logger.info(f"Converting {file.filename} to images for JD extraction...")
                
                png_bytes_list = convert_to_png_list(file_content, file.filename)
                
                if not png_bytes_list:
                    raise HTTPException(status_code=400, detail="Failed to convert file to images")
                
                # Use first page/image for JD extraction
                import base64
                image_base64 = base64.b64encode(png_bytes_list[0]).decode('utf-8')
                
                jd_data = parse_job_description("", is_text=False, image_base64=image_base64)
        
        else:
            raise HTTPException(status_code=400, detail="Provide either 'text' parameter or upload a 'file'")
        
        processing_time = time.time() - request_start
        
        logger.info(f"✓ JD parsed successfully: {jd_data.get('job_title', 'Unknown')} ({processing_time:.2f}s)")
        
        return ParseJDResponse(
            status="success",
            data=jd_data,
            processing_time=processing_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - request_start
        error_msg = str(e)
        
        logger.error(f"Error parsing JD: {error_msg}")
        logger.error(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to parse JD: {error_msg}",
                "processing_time": processing_time
            }
        )


# ============================================
# RECRUITMENT FEATURES: CANDIDATE RANKING
# ============================================

@app.post("/rank_candidates", response_model=RankCandidatesResponse)
async def rank_candidates_endpoint(
    request_data: RankCandidatesRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Rank candidates against a Job Description
    
    Requires: X-API-Key header with valid API key (if REQUIRE_AUTH=true)
    
    Input: JSON with jd_data (parsed JD) and resume_list (list of parsed resumes)
    
    Returns: Ranked list of candidates with scores and detailed breakdown
    """
    request_start = time.time()
    
    try:
        jd_data = request_data.jd_data
        resume_list = request_data.resume_list
        
        if not jd_data:
            raise HTTPException(status_code=400, detail="Missing JD data")
        
        if not resume_list or len(resume_list) == 0:
            raise HTTPException(status_code=400, detail="Resume list is empty")
        
        logger.info(f"🎯 Ranking {len(resume_list)} candidates against JD: {jd_data.get('job_title', 'Unknown')}")
        
        # Rank all candidates
        ranking_results = rank_candidates_impl(resume_list, jd_data, generate_reasoning=True)
        
        processing_time = time.time() - request_start
        
        logger.info(f"✓ Ranked {len(ranking_results)} candidates ({processing_time:.2f}s)")
        
        # Convert results to Pydantic models
        results_list = []
        for result in ranking_results:
            try:
                ranking_result = RankingResult(
                    resume_index=result.get("resume_index", 0),
                    candidate_name=result.get("candidate_name", "Unknown"),
                    overall_score=result.get("overall_score", 0.0),
                    score_percentage=result.get("score_percentage", 0),
                    scores=CandidateScoreBreakdown(**result.get("scores", {})),
                    details=CandidateScoreDetails(**result.get("details", {})),
                    reasoning=result.get("reasoning", ""),
                    error=result.get("error", None)
                )
                results_list.append(ranking_result)
            except Exception as e:
                logger.warning(f"Error converting result to Pydantic model: {e}")
                results_list.append(RankingResult(
                    resume_index=result.get("resume_index", 0),
                    candidate_name=result.get("candidate_name", "Unknown"),
                    overall_score=0.0,
                    score_percentage=0,
                    scores=CandidateScoreBreakdown(skills=0, experience=0, job_title=0, education=0),
                    details=CandidateScoreDetails(
                        matched_skills=[], missing_skills=[], 
                        candidate_experience_years=0, jd_required_experience_years=0,
                        candidate_education="Unknown", jd_required_education="Unknown",
                        candidate_job_titles=[]
                    ),
                    reasoning="",
                    error=str(e)
                ))
        
        return RankCandidatesResponse(
            status="success",
            jd_title=jd_data.get("job_title", "Unknown"),
            total_candidates=len(results_list),
            results=results_list,
            processing_time=processing_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - request_start
        error_msg = str(e)
        
        logger.error(f"Error ranking candidates: {error_msg}")
        logger.error(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to rank candidates: {error_msg}",
                "processing_time": processing_time
            }
        )


@app.post("/parse_resume_txt")
@app.post("/parse_txt", response_model=ParseResponse)
async def parse_resume_txt(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """
    Parse resume from text-based files (faster - no image conversion)
    
    Requires: X-API-Key header with valid API key (if REQUIRE_AUTH=true)
    
    Supported: .txt, .rtf, .log, .md, .csv, .json, .xml, .py, .js, .html, 
               .css, .c, .cpp, .java, .sh, .odt, .tex, .rst, .yaml, etc.
    
    Returns: Structured resume JSON (same format as /parse_resume) with file_id for retrieval
    """
    
    request_start = time.time()
    filename = file.filename
    file_ext = Path(filename).suffix.lower()
    file_id = None
    
    try:
        # Validate file extension
        if file_ext not in TEXT_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Not a text file: {file_ext}. Supported: {', '.join(sorted(TEXT_EXTENSIONS))}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size
        file_size_mb = len(file_content) / (1024 * 1024)
        if file_size_mb > MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=413,
                detail=f"File too large: {file_size_mb:.2f}MB (max: {MAX_FILE_SIZE_MB}MB)"
            )
        
        # Generate file_id for tracking
        file_id = str(uuid.uuid4())
        
        # Decode text with multiple encoding fallbacks
        text_content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-16']:
            try:
                text_content = file_content.decode(encoding)
                logger.info(f"Decoded {filename} with {encoding}")
                break
            except (UnicodeDecodeError, UnicodeError):
                continue
        
        if text_content is None:
            raise HTTPException(
                status_code=400, 
                detail="Cannot decode text file. Unsupported encoding."
            )
        
        # Validate content is not empty
        if not text_content.strip():
            raise HTTPException(status_code=400, detail="Text file is empty")
        
        print(f"Processing text file: {filename} ({file_size_mb:.2f}MB, {len(text_content)} chars)")
        
        # Extract JSON directly from text (no image conversion)
        resume_json = extract_resume_from_text(text_content)
        
        # Use plain dict instead of Pydantic model
        resume_data = resume_json
        
        processing_time = time.time() - request_start
        
        # Log success
        log_processing(filename, processing_time, "SUCCESS")
        
        logger.info(f"Text processing complete: {processing_time:.2f}s")
        
        return ParseResponse(
            status="success",
            data=resume_data,
            processing_time=processing_time,
            file_id=file_id,
            original_filename=filename
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        processing_time = time.time() - request_start
        error_msg = str(e)
        
        # Log failure
        log_processing(filename, processing_time, "FAILED", error_msg)
        
        print(f"Error processing {filename}: {error_msg}")
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": error_msg,
                "processing_time": processing_time
            }
        )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
