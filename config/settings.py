import os
from dotenv import load_dotenv

load_dotenv()

# Azure Configuration
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION", "2024-02-15-preview")
AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_DEPLOYMENT_NAME", "gpt-4.1-mini")

# Authentication Configuration
API_KEY = os.getenv("API_KEY", "your-default-secret-key")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"

# App Configuration
MAX_FILE_SIZE_MB = 50
ALLOWED_FORMATS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.jfif']

# Logging
LOG_FILE = "processing_log.txt"
