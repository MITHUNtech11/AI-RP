"""
FastAPI Resume Parser
Convert PDF/DOCX/Images/Text to structured JSON
Supports intelligent routing via orchestrator endpoint
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import traceback
import uuid

from config.settings import ALLOWED_FORMATS, MAX_FILE_SIZE_MB, REQUIRE_AUTH
from config.auth import verify_api_key
from services.converter import (
    convert_to_png_list,
    extract_text_from_docx_bytes,
    DocxConversionError,
    get_resume_files_from_zip,
)
from services.azure_vision import extract_resume_json_multi_page, extract_resume_from_text
from services.logger import log_processing
from services.gemini import generate_text
from typing import Dict

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

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Resume Parser API",
        "version": "2.0.0",
        "authentication": "enabled" if REQUIRE_AUTH else "disabled",
        "endpoints": {
            "recommended": "/parse (auto-routes based on file type)",
            "image_files": "/parse_resume (PDF, DOCX, Images)",
            "text_files": "/parse_resume_txt (.txt only)",
            "batch": "/parse_batch (ZIP files with multiple resumes)"
        },
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


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
    
    print(f"Orchestrator: Received {filename} (type: {file_ext})")
    
    # Generate file_id for tracking
    file_id = str(uuid.uuid4())
    
    # Route based on file type
    if file_ext in TEXT_EXTENSIONS:
        print(f"Routing to TEXT handler... ({file_ext})")
        # Create a new UploadFile-like object for the handler
        from io import BytesIO
        file_like = BytesIO(file_content)
        # Re-instantiate the UploadFile with the saved content
        new_file = UploadFile(file_like, filename=filename, size=len(file_content))
        response = await parse_resume_txt(new_file)
    else:
        print(f"Routing to IMAGE handler... ({file_ext})")
        # Create a new UploadFile-like object for the handler
        from io import BytesIO
        file_like = BytesIO(file_content)
        new_file = UploadFile(file_like, filename=filename, size=len(file_content))
        response = await parse_resume(new_file)
    
    # Add file_id to response
    # Normalize response to a dict and attach file_id
    if isinstance(response, dict):
        response['file_id'] = file_id
    else:
        try:
            # Try to convert Pydantic-like objects to dict
            response = getattr(response, 'dict', lambda: None)() or {}
            response['file_id'] = file_id
        except Exception:
            response = {'status': 'success', 'data': response, 'file_id': file_id}
    
    return response


# ============================================
# BATCH PARSING ENDPOINT
# ============================================

class BatchParseResponse:
    """Response for batch parsing - list of per-file results"""
    pass


@app.post("/parse_batch")
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
        print(f"Extracting resumes from {filename}...")
        resume_files = get_resume_files_from_zip(zip_bytes)
        
        if not resume_files:
            raise HTTPException(
                status_code=400,
                detail="No supported resume files found in ZIP"
            )
        
        print(f"Found {len(resume_files)} resume files in ZIP")
        
        # Helper function to process a single resume (for threading)
        def process_resume(resume_filename, resume_bytes):
            """Process a single resume file"""
            file_start = time.time()
            
            try:
                # Generate file_id for tracking
                file_id = str(uuid.uuid4())
                
                # Determine file type and parse accordingly
                file_ext = Path(resume_filename).suffix.lower()
                resume_data = None
                
                # Try image-based parsing first
                if file_ext not in TEXT_EXTENSIONS:
                    try:
                        png_bytes_list = convert_to_png_list(resume_bytes, resume_filename)
                        resume_json = extract_resume_json_multi_page(png_bytes_list)
                        resume_data = resume_json
                    except DocxConversionError:
                        # Fall back to text parsing for DOCX
                        text_content = extract_text_from_docx_bytes(resume_bytes)
                        resume_json = extract_resume_from_text(text_content)
                        resume_data = resume_json
                else:
                    # Text-based parsing
                    text_content = None
                    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-16']:
                        try:
                            text_content = resume_bytes.decode(encoding)
                            break
                        except (UnicodeDecodeError, UnicodeError):
                            continue
                    
                    if text_content is None:
                        raise Exception("Cannot decode text file. Unsupported encoding.")
                    
                    resume_json = extract_resume_from_text(text_content)
                    resume_data = resume_json
                
                file_time = time.time() - file_start
                return {
                    "filename": resume_filename,
                    "file_id": file_id,
                    "status": "success",
                    "data": resume_data.dict() if hasattr(resume_data, 'dict') else resume_data,
                    "error": None,
                    "processing_time": file_time
                }
                
            except Exception as e:
                file_time = time.time() - file_start
                error_msg = str(e)
                return {
                    "filename": resume_filename,
                    "file_id": None,
                    "status": "error",
                    "data": None,
                    "error": error_msg,
                    "processing_time": file_time
                }
        
        # Parse each resume using ThreadPoolExecutor (max 2 workers)
        results = []
        successful = 0
        failed = 0
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            # Submit all tasks
            futures = {
                executor.submit(process_resume, filename, fbytes): filename
                for filename, fbytes in resume_files
            }
            
            # Collect results as they complete
            for future in futures:
                try:
                    result = future.result()
                    results.append(result)
                    
                    if result['status'] == 'success':
                        successful += 1
                        print(f"✓ {result['filename']} ({result['processing_time']:.2f}s)")
                    else:
                        failed += 1
                        print(f"✗ {result['filename']}: {result['error'][:50]}")
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
        
        return {
            "status": "batch_complete",
            "total_files": len(resume_files),
            "successful": successful,
            "failed": failed,
            "results": results,
            "total_processing_time": batch_time
        }
    
    except HTTPException:
        raise
    except Exception as e:
        batch_time = time.time() - batch_start
        print(f"Batch processing error: {str(e)}")
        traceback.print_exc()
        
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
        print(f"Converted to {len(png_bytes_list)} page(s)")
        
        # Step 2: Extract JSON from ALL pages and merge
        resume_json = extract_resume_json_multi_page(png_bytes_list)
        
        # Convert to Pydantic model for validation
        # Use plain dict instead of Pydantic model
        resume_data = resume_json
        
        processing_time = time.time() - request_start
        
        # Log success
        log_processing(filename, processing_time, "SUCCESS")
        
        return {
            "status": "success",
            "data": resume_data,
            "processing_time": processing_time,
            "error": None,
            "file_id": file_id
        }
    
    except DocxConversionError as e:
        print(f"Docx conversion failed for {filename}; falling back to text parser: {e}")
        text_content = extract_text_from_docx_bytes(file_content)
        if not text_content.strip():
            raise HTTPException(
                status_code=500,
                detail={
                    "status": "error",
                    "message": "DOCX text extraction returned no content",
                    "processing_time": time.time() - request_start,
                }
            )

        resume_json = extract_resume_from_text(text_content)
        resume_data = resume_json
        processing_time = time.time() - request_start
        log_processing(filename, processing_time, "SUCCESS (docx text fallback)")

        return {
            "status": "success",
            "data": resume_data,
            "processing_time": processing_time,
            "error": None,
            "file_id": file_id
        }

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


# Define text file extensions at the top of your main.py
TEXT_EXTENSIONS = {
    '.txt', '.rtf', '.log', '.md', '.csv', '.json', '.xml', 
    '.yaml', '.yml', '.py', '.js', '.html', '.css', '.c', 
    '.cpp', '.java', '.sh', '.odt', '.tex', '.rst'
}

@app.post("/parse_resume_txt")
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
                print(f"Decoded with {encoding}")
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
        # This calls the synchronous function (no await)
        resume_json = extract_resume_from_text(text_content)
        
        # Convert to Pydantic model for validation
        # Use plain dict instead of Pydantic model
        resume_data = resume_json
        
        processing_time = time.time() - request_start
        
        # Log success
        log_processing(filename, processing_time, "SUCCESS")
        
        print(f"Text processing complete: {processing_time:.2f}s")
        
        return {
            "status": "success",
            "data": resume_data,
            "processing_time": processing_time,
            "error": None,
            "file_id": file_id
        }
        
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


    @app.post("/generate")
    async def generate_text_endpoint(
        payload: Dict[str, str],
        api_key: str = Depends(verify_api_key)
    ):
        """Simple endpoint to proxy prompts to Gemini/Generative API.

        Expects JSON: { "prompt": "..." }
        Returns the raw JSON response from the configured GEMINI endpoint.
        """
        prompt = payload.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Missing 'prompt' in request body")

        try:
            resp = generate_text(prompt)
            return {"status": "success", "data": resp}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
