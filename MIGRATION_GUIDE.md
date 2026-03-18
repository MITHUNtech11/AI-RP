# 🔄 Migration Guide: Old to New Structure

This guide explains what changed in your project structure and how to update your code if needed.

---

## Before vs After

### Old Structure (Flat)
```
AI-resume-parser/
├── main.py                  # FastAPI app
├── streamlit_app.py         # Streamlit UI
├── config/
│   ├── auth.py
│   └── settings.py
├── services/
│   ├── converter.py
│   ├── azure_vision.py
│   ├── gemini.py
│   └── logger.py
├── src/                     # Frontend (duplicate)
├── airp/                    # Frontend (duplicate)
└── mobile-app/              # Main frontend
```

### New Structure (Clean 3-Tier)
```
AI-resume-parser/
├── backend/                 # 🌐 API + 🧠 AI Logic
│   ├── main.py              # Entry point
│   ├── config/
│   │   ├── auth.py
│   │   └── settings.py
│   ├── services/
│   │   ├── converter.py
│   │   └── logger.py
│   ├── resume_parser/       # 🧠 AI Logic (NEW)
│   │   ├── gemini.py
│   │   └── azure_vision.py
│   └── requirements.txt
│
└── mobile-app/              # 📱 Frontend (unchanged core)
    └── ...
```

---

## What Changed

### ✅ Created
- **`backend/`** — New directory organizing all server code
- **`backend/resume_parser/`** — Dedicated AI logic folder
- **`backend/main.py`** — Updated entry point (imports changed)
- **`backend/config/`** — Config files moved here
- **`backend/services/`** — Converter & logger moved here
- **`backend/requirements.txt`** — Python dependencies
- **`backend/README.md`** — Backend documentation
- **`ARCHITECTURE.md`** — Full architecture overview
- **`QUICK_START.md`** — Quick start guide
- **`README.md`** — Root project documentation

### 🗑️ Obsolete (Can Delete)
- **Old `main.py`** at root — Replaced by `backend/main.py`
- **`streamlit_app.py`** — Not part of 3-tier architecture
- **`config/` at root** — Moved to `backend/config/`
- **`services/` at root** — Moved to `backend/services/`
- **`src/` at root** — Old duplicate frontend
- **`airp/` at root** — Old duplicate frontend
- **`STREAMLIT/`** — Not needed
- **`archived_unrelated/`** — Already archived

---

## Import Changes

If you had custom code referencing the old structure:

### Old Imports
```python
from config.settings import API_KEY
from config.auth import verify_api_key
from services.converter import convert_to_png_list
from services.azure_vision import extract_resume_json_multi_page
from services.gemini import generate_text
from services.logger import log_processing
```

### New Imports
```python
from backend.config.settings import API_KEY
from backend.config.auth import verify_api_key
from backend.services.converter import convert_to_png_list
from backend.resume_parser.azure_vision import extract_resume_json_multi_page
from backend.resume_parser.gemini import generate_text
from backend.services.logger import log_processing
```

---

## Running the Application

### Before
```bash
# Run from root
python main.py
```

### After
```bash
# Option 1: Run from project root
python -m backend.main

# Option 2: Run from backend directory
cd backend
python main.py

# Both start server at http://localhost:8000
```

---

## Environment Variables

### No changes required!
Your `.env` file stays at the project root and remains the same.

```env
API_KEY=dev-key-12345
REQUIRE_AUTH=false
GEMINI_API_KEY=your-key
GEMINI_ENDPOINT=https://...
MAX_FILE_SIZE_MB=50
```

---

## Frontend Integration

### API Calls - No Changes
React Native code doesn't need updates:

```typescript
// This still works!
const response = await fetch('http://localhost:8000/parse', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key' },
  body: formData
});
```

All endpoints remain identical:
- `POST /parse`
- `POST /parse_resume`
- `POST /parse_resume_txt`
- `POST /parse_batch`
- `GET /health`

---

## Database/Storage References

If you added database code, update imports:

### Before
```python
from config.database import get_db  # Hypothetical
```

### After
```python
from backend.config.database import get_db  # Still in backend/config/
```

---

## Testing

### Update test file imports

```python
# Before
from services.converter import convert_to_png_list

# After
from backend.services.converter import convert_to_png_list
```

---

## Docker / Deployment

### Dockerfile

Update the entry point:

```dockerfile
# Before
CMD ["python", "main.py"]

# After
CMD ["python", "-m", "backend.main"]
# OR
# WORKDIR /app/backend
# CMD ["python", "main.py"]
```

### Requirements.txt

Now located at: `backend/requirements.txt`

```bash
# Install
pip install -f backend/requirements.txt
```

---

## Git Changes

### Cleanup Old Files

```bash
# View files to delete (DON'T RUN YET - just preview)
git status

# Optionally remove old files (keep them in git history)
rm -rf services/      # Old services folder
rm -rf config/        # Old config folder (at root)
rm -rf src/           # Old frontend
rm -rf airp/          # Old frontend
rm main.py            # Old main.py
rm streamlit_app.py   # Streamlit app

# Commit cleanup
git add -A
git commit -m "refactor: restructure into 3-tier architecture"
git push
```

---

## Troubleshooting Migration

### "ModuleNotFoundError: No module named 'backend'"

**Solution:** Run from project root directory

```bash
# Navigate to project root
cd /path/to/AI-resume-parser

# Run correctly
python -m backend.main
```

### Old imports still breaking

Make sure you're using the new import structure:

```python
# ✅ Correct
from backend.resume_parser.gemini import generate_text

# ❌ Wrong
from services.gemini import generate_text
```

### .env file not found

Ensure `.env` is at **project root**, not in `backend/`:

```
AI-resume-parser/
├── .env                    # ← HERE (project root)
├── backend/
│   └── main.py
└── mobile-app/
```

---

## Benefits of New Structure

✅ **Clear Separation** — Frontend, API, AI logic in separate tiers  
✅ **Scalability** — Easy to replace any layer (frontend, API, or AI)  
✅ **Maintainability** — Organized imports and responsibilities  
✅ **Deployment** — Each tier can be deployed independently  
✅ **Testing** — Easier to test isolated components  
✅ **Documentation** — Purpose of each folder is clear  

---

## Rollback (If Needed)

If you need to revert:

```bash
git log --oneline         # Find commit before restructure
git revert <commit-hash>  # Revert the restructuring commit
```

---

## Next Steps

1. ✅ Run `python -m backend.main` to start the API
2. ✅ Visit `http://localhost:8000/docs` to test endpoints
3. ✅ Update your frontend if needed (usually not required)
4. ✅ Test batch processing, different file types
5. ✅ Deploy to production

---

## Questions?

- 📖 Read: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 🚀 Start: [QUICK_START.md](./QUICK_START.md)
- 🔧 Backend: [backend/README.md](./backend/README.md)

---

**You're now running a professional 3-tier architecture! 🎉**

