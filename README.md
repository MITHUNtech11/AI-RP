# 🎓 AI Resume Parser

**Intelligent resume parsing with AI-powered data extraction**

![Python](https://img.shields.io/badge/Python-3.8+-blue)
![React Native](https://img.shields.io/badge/React%20Native-Expo-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-modern-green)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 What It Does

Converts PDF/DOCX/Images/Text resumes into **structured JSON** using AI (Google Gemini):

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "skills": ["Python", "FastAPI", "React Native"],
  "employment": [
    {
      "company_name": "Tech Corp",
      "designation": "Senior Developer",
      "startDate": "2020-01"
    }
  ],
  "qualifications": [...]
}
```

---

## 🏗️ Architecture

**3-Tier Clean Architecture:**

```
📱 React Native App (Frontend)
    ↓ REST API
🌐 Backend API (FastAPI)
    ↓ Uses
🧠 Resume Parser (AI Logic)
```

[View Full Architecture →](./ARCHITECTURE.md)

---

## ⚡ Quick Start

### 1️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

✅ API running at: `http://localhost:8000`

### 2️⃣ Configure API Keys

Create `.env` in project root:

```env
API_KEY=dev-key-12345
GEMINI_API_KEY=your-gemini-key
```

### 3️⃣ Test It

```bash
curl -X POST http://localhost:8000/parse \
  -F "file=@resume.pdf"
```

[Full Quick Start →](./QUICK_START.md)

---

## 📦 Features

✅ **Multi-Format Support**: PDF, DOCX, Images (JPG/PNG), Text files  
✅ **Multi-Page Documents**: Automatically merges all pages  
✅ **Batch Processing**: Process multiple resumes at once (ZIP files)  
✅ **AI-Powered**: Google Gemini for intelligent extraction  
✅ **Structured Output**: Consistent JSON schema for all inputs  
✅ **Fast Text Processing**: Direct text parsing (no image conversion)  
✅ **API Key Authentication**: Secure endpoints  
✅ **Comprehensive Error Handling**: Fallback strategies included  
✅ **Request Logging**: Track processing time & status  
✅ **Mobile-Ready**: React Native frontend included  

---

## 📂 Project Structure

```
AI-resume-parser/
├── README.md                    # ← You are here
├── QUICK_START.md              # Get running in 5 minutes
├── ARCHITECTURE.md             # Detailed architecture overview
│
├── backend/                    # 🌐 API + 🧠 AI Logic
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt
│   ├── config/                 # Settings & authentication
│   ├── services/               # File conversion & logging
│   └── resume_parser/          # AI extraction logic
│
└── mobile-app/                 # 📱 React Native Frontend
    ├── app.json
    ├── App.tsx
    ├── package.json
    └── src/
```

**[See detailed structure →](./ARCHITECTURE.md)**

---

## 🚀 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/parse` | `POST` | 🎯 Smart routing (auto-detects file type) |
| `/parse_resume` | `POST` | Parse PDF/DOCX/Images (with image conversion) |
| `/parse_resume_txt` | `POST` | Parse text files (faster, no conversion) |
| `/parse_batch` | `POST` | Batch process ZIP with multiple resumes |
| `/health` | `GET` | Health check |
| `/docs` | `GET` | Interactive API docs (Swagger) |

**Interactive API Explorer**: http://localhost:8000/docs (when running)

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python async web framework)
- **AI/ML**: Google Gemini API
- **File Processing**: PyMuPDF, python-docx, Pillow
- **Utilities**: python-dotenv, requests

### Frontend
- **Framework**: React Native / Expo
- **Language**: TypeScript
- **Styling**: React Native components

### DevOps
- **Runtime**: Python 3.8+
- **Server**: Uvicorn (ASGI)
- **Package Manager**: pip (Python), npm (Node)

---

## 🔧 Setup Instructions

### Prerequisites
- Python 3.8+ ([download](https://www.python.org))
- Node.js 16+ ([download](https://nodejs.org))
- Git

### 1. Clone Repository
```bash
git clone <repo-url>
cd AI-resume-parser
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Create `.env` file at **project root**:

```env
# API Configuration
API_KEY=your-secret-api-key
REQUIRE_AUTH=true

# Google Gemini API (https://makersuite.google.com/app/apikeys)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro-vision:generateContent

# Limits
MAX_FILE_SIZE_MB=50
```

### 4. Run Backend

```bash
# From backend directory
python main.py

# OR from project root
python -m backend.main
```

**Server ready at**: `http://localhost:8000`

### 5. Frontend Setup (Optional)

```bash
cd mobile-app
npm install
npx expo start
```

---

## 📖 Documentation

- **[QUICK_START.md](./QUICK_START.md)** — Get running in 5 minutes
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Understand the 3-tier design
- **[backend/README.md](./backend/README.md)** — Backend API details
- **[API Docs](http://localhost:8000/docs)** — Interactive explorer (when running)

---

## 💡 Usage Examples

### Single Resume Upload
```bash
curl -X POST http://localhost:8000/parse \
  -H "X-API-Key: your-api-key" \
  -F "file=@resume.pdf"
```

### Batch Processing (ZIP file)
```bash
curl -X POST http://localhost:8000/parse_batch \
  -H "X-API-Key: your-api-key" \
  -F "file=@resumes.zip"
```

### Using Python
```python
import requests

with open('resume.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/parse',
        files={'file': f},
        headers={'X-API-Key': 'your-api-key'}
    )
    
data = response.json()
print(f"Name: {data['data']['name']}")
print(f"Skills: {data['data']['skills']}")
```

---

## 🎓 How It Works

1. **Upload** → User selects resume file
2. **Validate** → Check file type & size
3. **Convert** → PDF/DOCX → PNG pages (standardization)
4. **Extract** → Send each page to Gemini API
5. **Parse** → AI extracts: name, email, skills, experience, etc.
6. **Merge** → Combine multi-page results
7. **Return** → Structured JSON response

[Detailed data flow →](./ARCHITECTURE.md#data-flow)

---

## 🚀 Deployment

### Backend Options
- **Heroku** — Easy setup, free tier available
- **Railway** — Modern alternative to Heroku
- **AWS Lambda** → With FastAPI + serverless framework
- **Docker** → Containerize for any cloud

### Frontend Options
- **Expo Published** → Managed cloud hosting
- **App Stores** → Apple App Store, Google Play
- **Web** → Build React web version

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🆘 Troubleshooting

### Backend won't start?
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Run with verbose output
python -u main.py
```

### "Module not found"?
```bash
# Ensure you're in project root
cd AI-resume-parser

# Run from project root
python -m backend.main
```

### Gemini API errors?
- Verify API key in `.env`
- Check API endpoint URL
- Visit: https://makersuite.google.com/app/apikeys

[More troubleshooting →](./backend/README.md#troubleshooting)

---

## 🎯 Roadmap

- [ ] Database layer (PostgreSQL) for caching
- [ ] User accounts & API keys management
- [ ] Multiple AI providers (Claude, ChatGPT)
- [ ] Job queue for async processing (Celery)
- [ ] WebSocket for real-time updates
- [ ] Rate limiting & analytics
- [ ] Docker support
- [ ] CI/CD pipeline

---

## 📞 Support

- 📖 **Documentation**: See [QUICK_START.md](./QUICK_START.md)
- 🐛 **Report Issues**: [GitHub Issues](../../issues)
- 💬 **Discussions**: [GitHub Discussions](../../discussions)

---

## 🙏 Acknowledgments

- **Google Gemini API** for AI capabilities
- **FastAPI** for modern Python async framework
- **React Native** for cross-platform mobile development
- **Expo** for simplified React Native deployment

---

## 📌 Key Highlights

✨ **Smart Orchestration** → Auto-detects file type  
🚀 **Fast & Scalable** → Parallel processing, batch jobs  
🔒 **Secure** → API key authentication  
📱 **Mobile-First** → React Native app included  
🤖 **AI-Powered** → Google Gemini integration  
📊 **Well-Structured** → 3-tier clean architecture  

---

**Ready to parse resumes intelligently? [Get Started →](./QUICK_START.md)**

