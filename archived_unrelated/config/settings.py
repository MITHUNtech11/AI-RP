import os
from dotenv import load_dotenv

load_dotenv()

# Generative model configuration
API_KEY = os.getenv("API_KEY", "your-default-secret-key")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"

# Gemini / Google Generative API (set these in your environment or .env)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# GEMINI_ENDPOINT should point to the Gemini/Generative API endpoint you plan to use.
# Examples vary depending on provider (Vertex AI, Google Generative REST, etc.).
GEMINI_ENDPOINT = os.getenv("GEMINI_ENDPOINT", "https://generativelanguage.googleapis.com/v1beta2/models/your-model:generate")

# Supabase (optional) - used if you host backend or assets on Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# App Configuration
MAX_FILE_SIZE_MB = 50
ALLOWED_FORMATS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.jfif']

# Logging
LOG_FILE = "processing_log.txt"
