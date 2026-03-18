# 🏗️ Project Architecture

## 3-Tier Architecture Overview

Your AI Resume Parser follows a **clean 3-tier architecture**:

```
┌─────────────────────────────────────────┐
│  📱 React Native App (Expo)             │  ← Mobile-app/ (frontend)
│  ├── Upload resume files                │
│  ├── Display parsed results             │
│  └── User preferences & history         │
└──────────────┬──────────────────────────┘
               │ REST API Calls
               ↓ (HTTP/JSON)
┌────────────────────────────────────────────┐
│  🌐 Backend API (Python / FastAPI)         │  ← backend/main.py
│  ├── File upload & validation              │
│  ├── Orchestrate processing                │
│  ├── Batch job handling                    │
│  └── Response formatting                   │
└──────────────┬───────────────────────────┘
               │ Uses
               ↓
┌────────────────────────────────────────────┐
│  🧠 Resume Parser (AI Logic)               │  ← backend/resume_parser/
│  ├── PDF/DOCX → Image conversion           │
│  ├── Multi-page document handling          │
│  ├── Gemini API integration                │
│  └── Data merging & validation             │
└────────────────────────────────────────────┘
```

## Directory Organization

### Top Level

```
AI-resume-parser/
├── .env                          # Environment variables
├── .gitignore
├── README.md                     # Project overview
├── ARCHITECTURE.md              # ← You are here
│
├── mobile-app/                  # 📱 TIER 1: Frontend
│   ├── package.json
│   ├── App.tsx
│   └── ...
│
├── backend/                     # 🌐 TIER 2 & 3: API + AI Logic
│   ├── main.py                  # Entry point
│   ├── requirements.txt
│   ├── README.md
│   │
│   ├── app/                     # API initialization
│   ├── config/                  # Settings & auth
│   ├── services/                # Utilities (converter, logger)
│   └── resume_parser/           # 🧠 AI logic (Gemini, processing)
│
└── docs/                        # Documentation (optional)
    └── API.md                   # API reference
```

## Three Tiers Explained

### Tier 1: 📱 Frontend (React Native / Expo)
**Location:** `mobile-app/`

**Purpose:** User-facing mobile application

**Key Files:**
- `App.tsx` — Main app component
- `src/pages/` — Upload, Results, History screens
- `src/services/gemini.ts` — API communication

**Responsibilities:**
- File upload UI
- Display parsed results
- Local storage & caching
- User settings

**Tech Stack:** React Native, TypeScript, Expo

---

### Tier 2: 🌐 Backend API (Python / FastAPI)
**Location:** `backend/`

**Purpose:** Request handling, validation, orchestration

**Key File:** `backend/main.py`

**Endpoints:**
- `POST /parse` — Smart auto-routing
- `POST /parse_resume` — Image-based parsing
- `POST /parse_resume_txt` — Text-based parsing
- `POST /parse_batch` — Batch ZIP processing
- `GET /health` — Status check

**Responsibilities:**
- Validate file types & sizes
- Route requests to appropriate handler
- Handle authentication (API key)
- Format responses
- Batch job coordination
- Request logging

**Tech Stack:** FastAPI, Python 3.8+, async

---

### Tier 3: 🧠 Resume Parser (AI Logic)
**Location:** `backend/resume_parser/`

**Purpose:** Core ML/AI for resume extraction

**Key Files:**
- `gemini.py` — Gemini API wrapper
- `azure_vision.py` — Multi-page resume extraction & merging
- `../services/converter.py` — File format conversion

**Modules:**
1. **Converter** (services/converter.py)
   - PDF → PNG (page by page)
   - DOCX → PNG
   - Image → PNG (standardization)
   - Text extraction (fallback)

2. **Resume Parser** (resume_parser/)
   - Per-page extraction via Gemini
   - Intelligent merging (multi-page documents)
   - Schema validation
   - Fallback handling

**Responsibilities:**
- Convert documents to processable format
- Call AI endpoints (Gemini)
- Extract structured data (JSON)
- Merge multi-page results
- Handle errors & fallbacks

**Tech Stack:** PyMuPDF, Pillow, Requests, Python

---

## Data Flow

### Example: Upload Resume

```
1. User selects file in mobile-app
                ↓
2. React Native app uploads to: POST /parse
                ↓
3. Backend API (main.py):
   - Validates file type & size
   - Determines if text/binary
   - Calls appropriate handler
                ↓
4. File Conversion (services/converter.py):
   - PDF → List of PNG pages
   - DOCX → PNG
   - Otherwise: return as-is
                ↓
5. Resume Parser (resume_parser/azure_vision.py):
   - For each PNG page:
     * Encode to base64
     * Call Gemini API
     * Extract structured JSON
   - Merge all pages into single resume
                ↓
6. Return JSON response to frontend:
   {
     "status": "success",
     "data": { name, email, skills, experience, ... },
     "processing_time": 12.5,
     "file_id": "uuid"
   }
                ↓
7. React Native displays results
```

---

## Key Design Principles

### ✅ Separation of Concerns
- **Frontend** only handles UI
- **Backend API** handles routing & auth
- **Parser** handles AI/ML logic

### ✅ Scalability
- Can swap frontend (web, native, CLI)
- Can upgrade parser (different AI models)
- API layer is framework-agnostic

### ✅ Maintainability
- Clear module boundaries
- Config centralized in `backend/config/`
- Services are independent & testable

### ✅ Performance
- Multi-page documents processed in parallel
- Batch processing with ThreadPoolExecutor
- Fallback strategies (text → image)

---

## Development Workflow

### Setup Environment

```bash
# Clone repo
git clone <repo>
cd AI-resume-parser

# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd ../mobile-app
npm install
```

### Run Locally

```bash
# Terminal 1: Backend API
cd backend
python main.py
# Server at http://localhost:8000

# Terminal 2: Frontend
cd mobile-app
npx expo start
# Scan QR code with phone
```

### Test Parser

```bash
# Call backend directly
curl -X POST http://localhost:8000/parse \
  -F "file=@resume.pdf" \
  -H "X-API-Key: your-key"
```

---

## Deployment

### Backend
- Deploy to: Heroku, Railway, AWS Lambda, Azure Functions, Google Cloud Run
- Entry point: `backend/main.py`
- Requirements: `backend/requirements.txt`

### Frontend
- Deploy to: Expo (managed), EAS (build), App Store, Google Play
- Config: `mobile-app/app.json`

---

## Next Steps

- [ ] Add database layer (PostgreSQL) for caching results
- [ ] Deploy backend to production
- [ ] Add more AI providers (Claude, ChatGPT)
- [ ] Implement job queue (Celery, RQ)
- [ ] Add user authentication (JWT)
- [ ] WebSocket for real-time updates
- [ ] Rate limiting & monitoring
- [ ] CI/CD pipeline

---

## References

- **Backend:** [backend/README.md](./backend/README.md)
- **API Docs:** Run backend and visit `http://localhost:8000/docs`
- **Frontend:** [mobile-app/README.md](./mobile-app/README.md)
- **Environment:** See `.env.example`

