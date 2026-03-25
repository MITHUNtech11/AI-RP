# HR Recruitment Ranking App - Quick Start & Testing Guide

## ✅ Implementation Complete!

Your HR recruitment ranking app is fully implemented and ready to test. Here's how to get started:

---

## 1. **Backend Setup**

### Prerequisites
- Python 3.8+
- Virtual environment activated (`.venv-1` in your project)
- All dependencies installed (see `backend/requirements.txt`)

### Start the Backend

```bash
cd backend
python main.py
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Visit `http://127.0.0.1:8000/docs` to see all API endpoints (Swagger UI)

---

## 2. **Frontend Setup**

### Web Browser Testing
```bash
cd mobile-app
npm start
# Select 'w' for web

# Backend URL will be: http://localhost:8000
```

### Mobile (Expo Go) Testing
```bash
cd mobile-app
npm start
# Select 'i' (iOS) or 'a' (Android)
# Scan QR code in Expo Go app

# For development, update BACKEND_URL in mobile-app/src/services/api.ts
# Use your machine's IP instead of localhost (e.g., 192.168.1.100:8000)
```

---

## 3. **Test Workflow**

### Step 1: Upload Job Description
1. **Open the app** → Click **"🎯 Start Ranking"** button
2. **Choose input method:**
   - **Paste Text**: Copy-paste a real job description (or sample below)
   - **Upload File**: Select PDF/DOCX with JD
3. **Click "Parse Job Description"** → Wait for extraction
4. **Review preview** → Skills, experience, education should appear
5. **Click "Next: Upload Resumes"**

### Step 2: Upload Resumes (Batch)
1. **Click "+ Add Resume"** multiple times (add 3-5 resumes)
2. **Each resume uploads and parses individually**
3. **Resumes appear in list** with names and emails
4. **Click "Analyze N Candidates"**

### Step 3: View Rankings
1. **Results display with:**
   - 🏆 Top candidate highlighted
   - Ranked list sorted by score (highest first)
   - Summary stats: total candidates, avg score, processing time
2. **Expand each candidate** to see:
   - ✓ Matched skills (green tags)
   - ✗ Missing skills (red tags)
   - Experience comparison
   - Education fit
   - Previous job titles
   - AI-generated assessment
3. **Start new session** with different JD/resumes

---

## 4. **Sample Job Descriptions for Testing**

### Sample 1: Senior Python Developer
```
Senior Python Developer - Full Stack

Position: Senior Python Developer
Location: Remote (US-based)
Experience Required: 5-7 years
Education: Bachelor's degree in Computer Science or related field
Seniority: Senior

Required Skills:
- Python 3.8+
- FastAPI or Django
- PostgreSQL/MySQL
- Docker & Kubernetes
- AWS or GCP
- Git & Version Control
- REST API Design
- Linux/Unix

Preferred Skills:
- Celery/Message Queues
- Machine Learning (scikit-learn, TensorFlow)
- Redis
- Apache Spark
- Agile/Scrum

Responsibilities:
- Design and develop scalable backend services
- Lead code reviews and mentor junior developers
- Optimize database queries and system performance
- Implement CI/CD pipelines
- Collaborate with DevOps team

Benefits:
- Competitive salary: $150K-$200K
- 100% remote
- Health insurance
- Stock options
- Learning budget
```

### Sample 2: React Frontend Engineer
```
React Frontend Engineer - UI/UX Focus

Job Title: Senior React Developer
Required Experience: 4+ years with React
Education: Bachelor's degree (or equivalent experience)
Level: Mid to Senior

Technical Requirements:
- React 18+
- TypeScript
- Tailwind CSS or Styled Components
- Redux or Context API
- Jest & React Testing Library
- Webpack/Vite
- Mobile-responsive design
- Accessibility (A11y)

Nice to Have:
- Next.js
- GraphQL
- Performance optimization
- Component libraries
- Figma collaboration

Employment Type: Full-time
```

---

## 5. **Sample Resume Collections for Testing**

When testing, you can use existing resume files from your uploads folder, or create simple text resumes with this structure:

```
John Doe
Email: john@example.com
Phone: 555-1234

PROFESSIONAL SUMMARY
5 years of experience in Python development with strong backend expertise.

SKILLS
Python, FastAPI, Django, PostgreSQL, Docker, AWS, Redis, Git, REST APIs, Linux

WORK EXPERIENCE

Senior Backend Developer (2022-Present)
TechCorp Inc., Remote
- Lead development of microservices architecture using Python and FastAPI
- Optimized database queries, reducing query time by 40%
- Implemented Docker containerization and Kubernetes orchestration
- Deployed applications on AWS using Lambda and RDS

Python Developer (2020-2022)
StartupXYZ, San Francisco

EDUCATION
B.S. in Computer Science
State University (2020)

LANGUAGES
English, Spanish (Fluent)
```

---

## 6. **API Endpoint Testing (via Curl/Postman)**

### Test /parse_jd Endpoint

**With Text Input:**
```bash
curl -X POST "http://127.0.0.1:8000/parse_jd?text=Senior%20Python%20Developer%20with%205%20years%20experience." \
  -H "X-API-Key: dev-key-12345"
```

**With File Input:**
```bash
curl -X POST "http://127.0.0.1:8000/parse_jd" \
  -H "X-API-Key: dev-key-12345" \
  -F "file=@job_description.pdf"
```

### Test /rank_candidates Endpoint

```bash
curl -X POST "http://127.0.0.1:8000/rank_candidates" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-12345" \
  -d '{
    "jd_data": {"job_title": "Senior Python Developer", "required_skills": ["Python", "FastAPI", "PostgreSQL"], "minimum_experience_years": 5, "required_education": "Bachelor'\''s degree", "seniority_level": "Senior"},
    "resume_list": [{"personalInfo": {"fullName": "John Doe"}, "skills": ["Python", "FastAPI", "AWS"], "experience": [{"title": "Backend Developer", "startDate": "2020", "endDate": "Present"}], "education": [{"degree": "Bachelor'\''s in CS"}]}]
  }'
```

---

## 7. **Troubleshooting**

| Problem | Solution |
|---------|----------|
| Backend won't start | Check if port 8000 is in use; verify Python installed; check `requirements.txt` |
| "Cannot reach backend" | Ensure backend is running on http://127.0.0.1:8000; check firewall; try http://localhost:8000 |
| JD parsing returns error | Try simpler JD text first; ensure text contains clear job requirements; check Gemini API key |
| Long processing time | Normal for large batches (3-5 resumes); Gemini API has rate limits |
| Scores seem low/high | Verify JD extraction was correct in preview; check if required skills are well-defined |

---

## 8. **Expected Behavior**

### ✅ When Working Correctly:

1. **JD Extraction:**
   - Required skills extracted accurately (e.g., Python, AWS, Docker)
   - Experience years parsed (e.g., "5+" → 5)
   - Education level recognized (Bachelor's, Master's, etc.)
   - Seniority level identified (Senior, Mid-level, etc.)

2. **Ranking Scores:**
   - Candidates with all required skills score 80%+
   - Missing 1-2 skills: 60-80%
   - Missing 3+ skills: 40-60%
   - Below minimum experience: lower score

3. **UI Behavior:**
   - Smooth navigation between screens
   - Real-time progress indicators while parsing
   - Expandable candidate cards on click
   - Skill tags display clearly

---

## 9. **Project Architecture Diagram**

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │ HTTP/JSON
         ▼
┌─────────────────────┐
│   FastAPI Backend   │
├─────────────────────┤
│ /parse_jd           │ ─→ Gemini API (JD extraction)
│ /rank_candidates    │ ─→ Gemini API (semantic matching)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Resume Parser      │
│  - JD Parser        │
│  - Matching Engine  │
└─────────────────────┘
```

---

## 10. **File Structure**

```
AI-resume-parser/
├── backend/
│   ├── main.py (✅ Updated with /parse_jd & /rank_candidates)
│   ├── resume_parser/
│   │   ├── jd_parser.py (✅ NEW)
│   │   ├── matching_algorithm.py (✅ NEW)
│   │   ├── gemini.py
│   │   └── azure_vision.py
│   ├── services/
│   └── config/
│
├── mobile-app/
│   ├── AppNavigator.tsx (✅ NEW - Main navigation wrapper)
│   ├── App.tsx (Original resume parser)
│   ├── index.ts (✅ Updated to use AppNavigator)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── CreateRankingSession.tsx (✅ NEW)
│   │   │   ├── BatchResumeUpload.tsx (✅ NEW)
│   │   │   └── RankingsResult.tsx (✅ NEW)
│   │   ├── services/
│   │   │   └── api.ts (✅ Updated with new endpoints)
│   │   └── types/
│   │       └── resume.ts (✅ Updated with new types)
│   └── package.json
```

---

## ✨ Features Implemented

- ✅ JD upload (text or file)
- ✅ Batch resume upload
- ✅ AI-powered ranking
- ✅ Detailed score breakdown
- ✅ Skill matching visualization
- ✅ AI-generated assessment for each candidate
- ✅ Real-time processing feedback
- ✅ Mobile-responsive UI
- ✅ Rate limiting (10/min for JD, 5/min for ranking)

---

## 🎯 Next Steps

1. Start backend server
2. Launch mobile app (web or native)
3. Click "🎯 Start Ranking"
4. Test with sample JD and resumes
5. Review ranked results

**Enjoy your HR recruitment ranking app!** 🚀
