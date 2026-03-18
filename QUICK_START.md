# ⚡ Quick Start Guide

Get your 3-tier resume parser running in **5 minutes**.

## Prerequisites

- Python 3.8+ ([download](https://www.python.org))
- Node.js 16+ ([download](https://nodejs.org))
- Git

## 1️⃣ Setup Backend

### Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Takes ~2 minutes** (downloading PDF/image libraries)

### Configure environment

Create `.env` file in project root:

```env
# API Authentication
API_KEY=dev-key-12345
REQUIRE_AUTH=false

# Gemini API (Google Generative AI)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro-vision:generateContent

# File limits
MAX_FILE_SIZE_MB=50
```

> **Get Gemini API Key:** https://makersuite.google.com/app/apikeys

### Start backend server

```bash
python main.py
```

✅ Server running at: **http://localhost:8000**

Visit **http://localhost:8000/docs** for interactive API explorer

---

## 2️⃣ Setup Frontend (Optional)

### Install dependencies

```bash
cd ../mobile-app
npm install
```

### Start Expo dev server

```bash
npx expo start
```

Then either:
- Press `w` for web preview (opens http://localhost:19006)
- Scan QR code with phone (Expo Go app)

---

## 3️⃣ Test the API

### Option A: Using Browser UI

1. Go to http://localhost:8000/docs
2. Scroll to `/parse` endpoint
3. Click "Try it out"
4. Upload a resume (PDF/DOCX/TXT)
5. Click "Execute"

### Option B: Using curl

```bash
curl -X POST http://localhost:8000/parse \
  -F "file=@your-resume.pdf"
```

### Option C: Using Postman

1. New POST request: `http://localhost:8000/parse`
2. Body → form-data
3. Key: `file`, Value: [select your resume file]
4. Send

---

## Example Response

```json
{
  "status": "success",
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "skills": ["Python", "FastAPI", "React Native"],
    "employment": [
      {
        "company_name": "Tech Corp",
        "designation": "Senior Developer",
        "startDate": "2020-01",
        "endDate": "2023-12"
      }
    ]
  },
  "processing_time": 8.5,
  "file_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |
| `POST` | `/parse` | 🎯 Auto-detect file type |
| `POST` | `/parse_resume` | Parse PDF/DOCX/Images |
| `POST` | `/parse_resume_txt` | Parse text files (faster) |
| `POST` | `/parse_batch` | Batch process ZIP file |
| `POST` | `/generate` | Direct Gemini API access |

### Full API Docs

Once backend is running, visit: **http://localhost:8000/docs**

(Swagger UI automatically generated from FastAPI)

---

## Troubleshooting

### "Module not found: backend"

**Solution:** Run from project root, not from `backend/` subdirectory

```bash
# ✅ Correct
cd AI-resume-parser
python backend/main.py

# ❌ Wrong
cd backend
python main.py
```

### "PyMuPDF not found"

```bash
pip install PyMuPDF
```

### "DOCX conversion failed"

Linux:
```bash
sudo apt-get install libreoffice
```

macOS:
```bash
brew install libreoffice
```

### "No module named config"

Ensure `.env` file exists and has required keys set.

---

## Project Structure

```
AI-resume-parser/
├── backend/                # 🌐 API + 🧠 AI Logic
│   ├── main.py            # Start here
│   ├── requirements.txt
│   ├── config/            # Settings & auth
│   ├── services/          # File conversion
│   └── resume_parser/     # AI logic (Gemini)
│
└── mobile-app/            # 📱 Frontend
    ├── app.json
    ├── App.tsx
    ├── package.json
    └── src/               # React Native components
```

**Detailed docs:** See [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Next Steps

- [ ] Test with a real resume file
- [ ] Read [ARCHITECTURE.md](./ARCHITECTURE.md) for design details
- [ ] Explore [backend/README.md](./backend/README.md) for API specifics
- [ ] Deploy to production (Heroku, Railway, etc.)
- [ ] Integrate with frontend

---

## Need Help?

- 📖 Full documentation: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 🔗 API docs: http://localhost:8000/docs (when running)
- 📦 Backend guide: [backend/README.md](./backend/README.md)
- 🚀 Frontend guide: [mobile-app/README.md](./mobile-app/README.md)

---

## Key Endpoints to Try

### 1. Health Check (no file needed)
```bash
curl http://localhost:8000/health
```

### 2. Parse Single Resume
```bash
curl -X POST http://localhost:8000/parse \
  -F "file=@resume.pdf"
```

### 3. Batch Process (ZIP with multiple resumes)
```bash
curl -X POST http://localhost:8000/parse_batch \
  -F "file=@resumes.zip"
```

---

**Ready to parse resumes? 🚀 Start with the backend!**

```bash
cd backend && python main.py
```

