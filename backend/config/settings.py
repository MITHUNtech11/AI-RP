import os
from dotenv import load_dotenv

load_dotenv()

# Generative model configuration
API_KEY = os.getenv("API_KEY", "your-default-secret-key")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"

# Gemini / Google Generative API (set these in your environment or .env)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Optional: Specify which Gemini model to use (default: gemini-2.5-flash)
# Available options: gemini-2.5-flash (fastest), gemini-2.5-pro, gemini-2.0-flash
# You can set this in your .env as: GEMINI_MODEL=gemini-2.5-pro

# Supabase (optional) - used if you host backend or assets on Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# App Configuration
MAX_FILE_SIZE_MB = 50
ALLOWED_FORMATS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.jfif']

# Logging
LOG_FILE = "processing_log.txt"
