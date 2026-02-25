# Resume Parser - Application Workflow

## Overview

The AI Resume Parser is a full-stack application that converts resume files (PDF, DOCX, Images, Text) into structured JSON data. It uses Azure Computer Vision for intelligent data extraction and provides a user-friendly Streamlit frontend for interaction.

---

## Architecture

### Backend
- **Framework**: FastAPI
- **Port**: 8000
- **Main File**: `main.py`
- **Key Services**:
  - `azure_vision.py` - Azure Computer Vision API integration for OCR & data extraction
  - `converter.py` - File format conversion (PDF/DOCX → PNG, Text extraction)
  - `logger.py` - Processing logs and metrics
  - `schemas.py` - Pydantic models for data validation

### Frontend
- **Framework**: Streamlit
- **Port**: 8501
- **Main File**: `streamlit_app.py`
- **Data Storage**: Streamlit Session State (in-memory, temporary)

---

## Complete Workflow

### 1. **File Upload Phase**
**User Action**: Upload resume file(s) via Streamlit UI
- Single file upload
- Multiple file selection
- ZIP batch upload

**Backend Processing**:
- File validation (format, size)
- Unique `file_id` generated (UUID)
- File stored in **session state** (temporary, in-memory)

### 2. **File Routing**
**Orchestrator Endpoint** (`/parse`):
- Reads file extension
- Routes to appropriate handler:
  - **Text files** (.txt, .md, .json, etc.) → `parse_resume_txt` (fast, direct text processing)
  - **Binary files** (PDF, DOCX, Images) → `parse_resume` (image-based processing)

### 3. **Image-Based Parsing** (PDF/DOCX/Images)
**Process**:
1. **Convert to PNG**: Multi-page PDFs/DOCX → List of PNG images
2. **OCR Extraction**: Azure Computer Vision reads image → Raw text
3. **AI Parsing**: Claude/Azure AI extracts structured data from text
4. **Data Merging**: All pages combined → Single JSON object
5. **Validation**: Pydantic models validate extracted data

**Output**: `ResumeData` JSON with:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "skills": ["Python", "React", "AWS"],
  "employment": [...],
  "qualifications": [...],
  ...
}
```

### 4. **Text-Based Parsing** (TXT/MD/etc.)
**Process** (Faster):
1. **Decode Text**: Read file content with encoding detection
2. **Direct AI Processing**: Send raw text to Azure AI
3. **Extract Data**: Structured JSON extraction
4. **Validation**: Pydantic validation

**Advantage**: No image conversion needed, ~3-5x faster

### 5. **Batch Processing** (ZIP files)
**Process**:
1. **Extract ZIP**: Decompress archive
2. **Identify Files**: Find all supported resume files
3. **Parallel Processing**: Process multiple files concurrently (max 2 workers)
4. **Per-File Tracking**: Each file gets individual status, data, error logs
5. **Return Results**: Array of results with success/failure status

**Response Format**:
```json
{
  "status": "batch_complete",
  "total_files": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "filename": "resume1.pdf",
      "file_id": "uuid-xxx",
      "status": "success",
      "data": {...},
      "processing_time": 12.5
    },
    {
      "filename": "resume2.docx",
      "status": "error",
      "error": "Conversion failed"
    }
  ]
}
```

### 6. **Frontend Display**
**Single File Mode**:
1. Parse response received
2. Extract parsed data + file_id
3. Store in session state:
   - `latest_parsed` - Structured resume data
   - `latest_file_id` - Unique identifier
   - `latest_file_bytes` - Raw file bytes (for viewing)
   - `latest_filename` - Original filename
4. Render 7 tabs:
   - **Bio** - Name, email, phone, location
   - **Description** - Summary/professional statement
   - **Skills** - List of technical & soft skills
   - **Languages** - Languages spoken with proficiency
   - **Employment History** - Work experience with details
   - **Qualifications** - Education & certifications
   - **Original Resume** - View uploaded resume file

**Batch Mode**:
1. Frontend extracts ZIP archive locally
2. Store individual file bytes in `batch_file_bytes` session state dictionary
3. Display list of all resumes with status (✓ success / ✗ failed)
4. Allow selection of individual resume
5. Display parsed data + original file preview for selected resume
6. Show error message if parsing failed

### 7. **File Viewing**
**Implementation**: 
- Files stored in **Streamlit Session State** (in-memory)
- No disk storage - privacy-first approach
- Files displayed inline in the **Original Resume** tab

**Supported Preview Formats**:
- **PDFs** - Embedded PDF viewer (base64 iframe)
- **Images** (JPG, PNG, BMP, GIF, WebP) - Full-size display
- **Text Files** (TXT, MD, JSON, CSV, XML, YAML) - Text area with content
- **Word Documents** (.docx) - Extracted text + table content displayed
- **Other Formats** - Message directing user to parsed data in other tabs

**Benefits**:
- ✅ No local machine storage
- ✅ Privacy-friendly (in-memory only)
- ✅ Automatic cleanup when session ends
- ✅ No disk space needed
- ✅ View original file without leaving the app

---

## API Endpoints

### Parse Endpoints

**`POST /parse`** (Recommended - Auto-routing)
- Input: Any supported file format
- Auto-routes based on file type
- Returns: Parsed resume + file_id
- File stored in session state

**`POST /parse_resume`** (Image-based)
- Input: PDF, DOCX, Images
- Converts to PNG → OCR → AI extraction
- Returns: Parsed resume data
- Processing time: 10-15 seconds

**`POST /parse_resume_txt`** (Text-based, Fast)
- Input: .txt, .md, .json, .csv, etc.
- Direct text → AI extraction
- Returns: Parsed resume data
- Processing time: 2-5 seconds

**`POST /parse_batch`** (Batch processing)
- Input: ZIP file with multiple resumes
- Parallel processing (max 2 workers)
- Returns: Array of per-file results
- Per-file tracking and error handling

### Health Endpoints

**`GET /`** (Root)
- Returns API info and available endpoints
- Useful for API discovery

**`GET /health`** (Health check)
- Returns: `{"status": "healthy"}`
- For monitoring/deployment

---

## Response Model

```python
class ParseResponse(BaseModel):
    status: str = "success"                      # success/error
    data: Optional[ResumeData] = None           # Parsed resume
    processing_time: float = 0.0                # Seconds taken
    error: Optional[str] = None                 # Error message if failed
    file_id: Optional[str] = None               # Unique file identifier
```

---

## Session State Flow (Frontend)

```
Upload File (Single or Batch)
    ↓
Parse Button
    ↓
API Request (/parse or /parse_batch)
    ↓
Response Received
    ↓
Store in Session State:
  - latest_parsed (data)
  - latest_file_id (uuid)
  - latest_file_bytes (binary)
  - latest_filename (string)
  
  OR for batch:
  - batch_results (array of results)
  - batch_file_bytes (dict of filename → bytes)
    ↓
Render Tabs with Data
    ↓
User clicks "Original Resume" tab
    ↓
File previewed inline (PDF/Image/Text/Word)
    ↓
Session auto-clears on browser close/refresh
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    STREAMLIT FRONTEND                       │
│  File Upload → Parse Button → Display Results → Download    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP POST /parse
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                           │
│                                                              │
│  1. Orchestrator: Route by file type                         │
│  2. Converter: PDF/DOCX/IMG → PNG/Text                       │
│  3. Vision API: OCR extraction (Azure)                       │
│  4. AI Parser: Structured data extraction                    │
│  5. Validation: Pydantic models check                        │
│  6. Response: JSON with file_id                              │
│                                                              │
│  Services:                                                   │
│  - azure_vision.py   → Computer Vision API calls             │
│  - converter.py      → File format conversion                │
│  - logger.py         → Processing logs                       │
│  - schemas.py        → Data validation                       │
└──────────────────────────┬────────────────────────────────── ┘
                           │
                    HTTP Response JSON
                           ↓
┌──────────────────────────────────────────────────────────────┐
│              Session State (In-Memory Storage)               │
│                                                              │
│  - parsed_data (ResumeData)                                  │
│  - file_bytes (Binary)                                       │
│  - original_filename (String)                                │
│  - file_id (UUID)                                            │
│                                                              │
│  Auto-cleared when session ends or browser closes            │
└──────────────────────────────────────────────────────────────┘
```

---

## Supported File Formats

### Image/Document Formats (Converted to PNG)
- `.pdf` - Portable Document Format
- `.docx` - Microsoft Word Document
- `.doc` - Microsoft Word Document (older)
- `.jpg`, `.jpeg` - JPEG Images
- `.png` - PNG Images
- `.bmp` - Bitmap Images
- `.tiff`, `.tif` - TIFF Images
- `.jfif` - JPEG File Interchange Format

### Text Formats (Direct Text Processing)
- `.txt` - Plain text
- `.md` - Markdown
- `.json` - JSON format
- `.csv` - Comma-separated values
- `.xml` - XML format
- `.yaml`, `.yml` - YAML format
- `.py` - Python code
- `.js` - JavaScript code
- `.html` - HTML markup
- `.css` - CSS styles
- `.rtf` - Rich Text Format
- `.odt` - Open Document Text
- `.tex` - LaTeX
- `.rst` - ReStructuredText
- `.sh` - Shell scripts
- `.log` - Log files

---

## Configuration

**Backend Configuration** (`config/settings.py`):
```python
ALLOWED_FORMATS = {
    '.pdf', '.docx', '.doc', '.jpg', '.jpeg', 
    '.png', '.bmp', '.tiff', '.tif', '.jfif', 
    '.txt', '.rtf', '.log', '.md', '.csv', '.json',
    '.xml', '.yaml', '.yml', '.py', '.js', '.html',
    '.css', '.c', '.cpp', '.java', '.sh', '.odt',
    '.tex', '.rst'
}

MAX_FILE_SIZE_MB = 25  # Maximum file size

TEXT_EXTENSIONS = {
    '.txt', '.rtf', '.log', '.md', '.csv', '.json',
    '.xml', '.yaml', '.yml', '.py', '.js', '.html',
    '.css', '.c', '.cpp', '.java', '.sh', '.odt',
    '.tex', '.rst'
}
```

**Frontend Configuration** (`streamlit_app.py`):
```python
API_BASE = "http://localhost:8000"  # Backend API URL
```

---

## Error Handling

### Backend Errors
- **400 Bad Request**: Invalid file format or empty file
- **413 Payload Too Large**: File exceeds size limit (25MB)
- **500 Internal Server Error**: Processing failed with error details

### Frontend Error Display
- Red error panel with icon
- Shows error message from backend
- Allows retry by uploading again
- No file stored on failure

### Batch Processing Errors
- Per-file error tracking
- Successful files still processed
- Failed files show error message
- Overall batch status reflects success/failure count

---

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Single Text File | 2-5 sec | Fast, direct processing |
| Single PDF (1 page) | 8-12 sec | Conversion + OCR |
| Single PDF (3+ pages) | 15-30 sec | Multi-page merging |
| Batch (5 files) | 30-60 sec | Parallel (max 2 workers) |
| Network Latency | ~0.5-1 sec | API calls to Azure |

**Optimization Tips**:
- Text files are 3-5x faster than images
- Consider splitting large PDFs
- Batch processing efficient for 3+ files

---

## Session State Cleanup

**Automatic Cleanup**:
- Browser refresh/close
- Session timeout (Streamlit default: 30 min)
- Server restart

**No Manual Cleanup Needed**:
- Files never persist on disk
- Memory automatically reclaimed
- No cleanup tasks required

---

## Security & Privacy

✅ **Privacy Features**:
- No files saved to disk
- Session state is temporary
- Automatic cleanup on session end
- Files only in browser memory

⚠️ **Considerations**:
- Files transmitted over HTTP (use HTTPS in production)
- Large files consume server memory
- Azure API calls contain resume data (check Azure privacy policy)

---

## Development Workflow

### Starting Services

**Terminal 1 - Backend**:
```powershell
cd C:\Users\mithun\Desktop\AI-resume-parser
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
# Backend running on http://localhost:8000
```

**Terminal 2 - Frontend**:
```powershell
cd C:\Users\mithun\Desktop\AI-resume-parser
.\.venv\Scripts\Activate.ps1
streamlit run streamlit_app.py
# Frontend running on http://localhost:8501
```

### Testing

1. Open http://localhost:8501 in browser
2. Upload a resume file (single, multiple, or ZIP)
3. Click "Parse" or "Parse All" button
4. Wait for processing
5. View parsed results in tabs
6. Click "Original Resume" tab to view uploaded file
7. For batch: Select different resumes to view each one
8. Refresh page to clear session

---

## File Preview Capabilities

### Word Documents (.docx)
The application can now display Word document content by:
- Extracting all paragraphs with text
- Extracting table content (formatted with pipe separators)
- Displaying in a readable text area
- Requires `python-docx` library (already included)

### PDFs
- Embedded PDF viewer using base64 iframe
- Full PDF display without external plugins
- Page navigation supported

### Images
- Full-size display of JPG, PNG, BMP, GIF, WebP
- Uses Pillow for image handling

### Text Files
- Direct text display in editable text area
- Supports TXT, MD, JSON, CSV, XML, YAML formats
- Automatic encoding detection (UTF-8, Latin-1, CP1252, ISO-8859-1)

---

## Future Enhancements

- [ ] Database storage for parsed results
- [ ] User authentication & profiles
- [ ] Resume comparison/matching
- [ ] Bulk export (CSV, Excel)
- [ ] Resume scoring/rating
- [ ] ATS (Applicant Tracking System) integration
- [ ] Real-time processing status updates
- [ ] Advanced filtering & search
- [ ] Historical result tracking
- [ ] Analytics dashboard

---

## Troubleshooting

### Backend Not Responding
```
Error: Connection refused
Solution: Check if uvicorn is running on port 8000
         Run: uvicorn main:app --reload
```

### Large File Processing
```
Error: Timeout or memory issues
Solution: Split large PDFs or use text format
         Max file size: 25MB
```

### Session State Lost
```
Issue: Results disappear after page refresh
Reason: Session state is temporary (by design)
Solution: Re-upload and parse again if needed
```

### Azure API Errors
```
Error: 401 Unauthorized
Solution: Check Azure credentials in environment
         Verify API key and endpoint are correct
```

---

## Project Structure

```
AI-resume-parser/
├── main.py                  # FastAPI backend
├── streamlit_app.py         # Streamlit frontend
├── requirements.txt         # Dependencies
├── README.md               # User guide
├── WORKFLOW.md             # This file
│
├── config/
│   ├── __init__.py
│   └── settings.py         # Configuration
│
├── models/
│   ├── __init__.py
│   └── schemas.py          # Pydantic models
│
├── services/
│   ├── __init__.py
│   ├── azure_vision.py     # Azure Computer Vision
│   ├── converter.py        # File conversion
│   └── logger.py           # Logging
│
└── utils/
    ├── __init__.py
    └── ssl_config.py       # SSL configuration
```

---

## Summary

The Resume Parser follows a **simple, secure, privacy-first workflow**:

1. **User uploads** resume via web interface (single, batch, or ZIP)
2. **Backend processes** file (OCR + AI extraction)
3. **Structured data** displayed in organized tabs
4. **Original file** viewable inline in the "Original Resume" tab
5. **Session state** auto-clears when browser closes
6. **Zero disk storage** - all data in-memory only

### Key Features
- ✅ Multi-format support (PDF, DOCX, Images, Text)
- ✅ Batch processing with per-file tracking
- ✅ In-memory file storage (no disk footprint)
- ✅ Inline file preview (no external downloads needed)
- ✅ Automatic session cleanup
- ✅ Privacy-focused architecture

This design prioritizes **ease of use**, **data privacy**, and **clean architecture**.
