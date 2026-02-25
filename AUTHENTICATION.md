# API Authentication Setup

## Overview
The Resume Parser API supports API key authentication to secure your endpoints.

## Configuration

### 1. Backend Setup (.env file)

Add these variables to your `.env` file:

```env
# Authentication
API_KEY=your-secure-api-key-here
REQUIRE_AUTH=true
```

**Options:**
- `API_KEY`: Your secret API key (change from default!)
- `REQUIRE_AUTH`: Set to `true` to enable auth, `false` to disable

### 2. Frontend Setup (.streamlit/secrets.toml)

Add these to your `.streamlit/secrets.toml` file:

```toml
# Backend API Configuration
api_base = "http://localhost:8000"

# Authentication
api_key = "your-secure-api-key-here"
```

**Important:** Use the same API key in both backend and frontend!

## Usage

### Protected Endpoints

All parsing endpoints now require authentication:
- `POST /parse` - Parse single resume
- `POST /parse_batch` - Parse multiple resumes

### Making Authenticated Requests

**With cURL:**
```bash
curl -X POST "http://localhost:8000/parse" \
  -H "X-API-Key: your-secure-api-key-here" \
  -F "file=@resume.pdf"
```

**With Python requests:**
```python
import requests

headers = {"X-API-Key": "your-secure-api-key-here"}
files = {"file": open("resume.pdf", "rb")}

response = requests.post(
    "http://localhost:8000/parse",
    headers=headers,
    files=files
)
```

**With Streamlit (automatic):**
The Streamlit app automatically sends the API key from secrets.toml.

## Error Responses

### 401 Unauthorized - Missing API Key
```json
{
  "detail": {
    "error": "Authentication required",
    "message": "Missing X-API-Key header. Please provide a valid API key."
  }
}
```

### 401 Unauthorized - Invalid API Key
```json
{
  "detail": {
    "error": "Invalid API key",
    "message": "The provided API key is incorrect. Please check your credentials."
  }
}
```

## Security Best Practices

1. **Use Strong API Keys**
   - Generate random, complex keys (e.g., using `openssl rand -hex 32`)
   - Never use simple passwords or default values

2. **Keep Keys Secret**
   - Never commit `.env` or `secrets.toml` to git
   - Add them to `.gitignore`
   - Rotate keys regularly

3. **Use HTTPS in Production**
   - Never send API keys over HTTP
   - Use SSL/TLS certificates

4. **Environment-Specific Keys**
   - Use different keys for dev/staging/production
   - Don't reuse keys across environments

## Disabling Authentication

For local development or testing, you can disable authentication:

```env
REQUIRE_AUTH=false
```

**Warning:** Only disable auth in secure, local environments!

## Generating Secure API Keys

### Method 1: Python
```python
import secrets
api_key = secrets.token_urlsafe(32)
print(api_key)
```

### Method 2: OpenSSL
```bash
openssl rand -hex 32
```

### Method 3: PowerShell
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Testing Authentication

1. **Test with auth enabled:**
```bash
# Should fail (no API key)
curl -X POST "http://localhost:8000/parse" -F "file=@resume.pdf"

# Should succeed (with API key)
curl -X POST "http://localhost:8000/parse" \
  -H "X-API-Key: your-key" \
  -F "file=@resume.pdf"
```

2. **Test with auth disabled:**
```bash
# Set REQUIRE_AUTH=false in .env
# Should succeed (no API key needed)
curl -X POST "http://localhost:8000/parse" -F "file=@resume.pdf"
```

## Troubleshooting

### "Authentication required" error
- Check that `X-API-Key` header is included
- Verify header name (case-sensitive)

### "Invalid API key" error
- Verify API key matches between `.env` and `secrets.toml`
- Check for trailing spaces or line breaks
- Ensure `.env` is being loaded (check with `print(API_KEY)`)

### Frontend not sending API key
- Verify `secrets.toml` exists in `.streamlit/` folder
- Restart Streamlit after changing secrets
- Check browser console for errors
