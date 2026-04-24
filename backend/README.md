# Backend Architecture

This directory contains the **🌐 Backend API** and **🧠 Resume Parser** layers of the 3-tier architecture.

## Directory Structure

```
backend/
├── main.py                 # FastAPI entry point (run this!)
├── requirements.txt        # Python dependencies
│
├── app/                    # FastAPI app initialization
│   └── __init__.py
│
├── config/                 # Configuration & Authentication
│   ├── __init__.py
│   ├── settings.py         # API settings, keys, limits
│   └── auth.py             # API key validation
│
├── services/               # Utility Services
│   ├── __init__.py
│   ├── converter.py        # PDF/DOCX/Image → PNG conversion
│   └── logger.py           # Request logging
│
└── resume_parser/          # 🧠 AI Logic (Resume Parsing)
    ├── __init__.py
    ├── gemini.py          # Gemini API wrapper
    └── azure_vision.py    # Multi-page resume extraction & merging
```

## What's in Each Module

### `config/`
- **settings.py** — API configuration (keys, file size limits, formats)
- **auth.py** — API key verification for protected endpoints

### `services/`
- **converter.py** — Converts PDF/DOCX/Images to PNG for processing
- **logger.py** — Logs processing results and timing

### `resume_parser/` 🧠
- **gemini.py** — Wrapper to call Google Generative API
- **azure_vision.py** — Extracts structured JSON from resume pages & merges results

### API Endpoints

**Generic (Orchestrator)**
- `POST /parse` — Auto-detects file type and routes appropriately

**Image-based (PDF, DOCX, Images)**
- `POST /parse_resume` — Convert to images, extract with Gemini

**Text-based (Fast)**
- `POST /parse_resume_txt` — Direct text processing (no image conversion)

**Batch Processing**
- `POST /parse_batch` — Process multiple resumes from ZIP file

**Health & Utility**
- `GET /` — API info
- `GET /health` — Health check
- `POST /generate` — Direct Gemini API access

## Running the Backend

### Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables (.env file at project root)
# See ../.env for required keys:
# - API_KEY
# - GEMINI_API_KEY
# - GEMINI_ENDPOINT
# - REQUIRE_AUTH (true/false)
```

### Start the Server

```bash
# Development (with auto-reload)
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

Create a `.env` file in the project root:

```
API_KEY=your-api-key-here
REQUIRE_AUTH=true
GEMINI_API_KEY=your-gemini-key
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta2/models/your-model:generate
MAX_FILE_SIZE_MB=50
```

## Integration with Frontend

The **mobile-app/** connects to this backend via REST API calls:

```typescript
// Example: Upload resume to backend
const response = await fetch('http://localhost:8000/parse', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key'
  },
  body: formData  // FormData with file
});

const result = await response.json();
// result.data contains parsed resume structure
```

## Key Features

✅ Multi-page document support (PDFs merge into single JSON)
✅ Multiple file format support (PDF, DOCX, Images, Text)
✅ Batch processing (ZIP files with multiple resumes)
✅ API key authentication
✅ Comprehensive error handling
✅ Request logging & timing
✅ Text encoding fallbacks (UTF-8, Latin-1, ISO-8859-1, etc.)
✅ CORS enabled for frontend integration

## Troubleshooting

**ModuleNotFoundError: No module named 'backend'**
- Ensure you're running from the project root: `python -m backend.main`
- Or update PYTHONPATH: `export PYTHONPATH="${PYTHONPATH}:/path/to/project"`

**GEMINI_API_KEY not configured**
- Check your `.env` file has the correct key
- Restart the server after updating .env

**PDF conversion fails (PyMuPDF error)**
- Install PyMuPDF: `pip install PyMuPDF`

**DOCX to PDF conversion issues**
- Install libreoffice: `apt-get install libreoffice` (Linux)
- Or: `brew install libreoffice` (macOS)

## Next Steps

- [ ] Deploy backend to production (Heroku, Railway, AWS Lambda)
- [ ] Add database layer for result caching
- [ ] Implement WebSocket for real-time batch processing
- [ ] Add rate limiting
- [ ] Integrate with notification service (email/SMS)
