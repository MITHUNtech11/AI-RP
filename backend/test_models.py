"""
Test script to check Gemini API models and their rate limits
Run this to find models that work with your current quota
"""

import os
import sys
import requests
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Models to test in order of preference (more stable first)
MODELS_TO_TEST = [
    "gemini-1.5-flash",      # Established, good limits
    "gemini-1.5-pro",        # Established, higher limits
    "gemini-2.0-flash",      # Stable
    "gemini-2.5-flash",      # Latest
    "gemini-2.5-pro",        # Latest pro
]

def test_model(model_name):
    """Test a specific model with a simple request"""
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"

    headers = {"Content-Type": "application/json"}

    payload = {
        "contents": [{
            "parts": [{
                "text": "Say 'OK' in one word."
            }]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 10,
        }
    }

    try:
        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)

        if response.status_code == 200:
            return "✅ WORKING"
        elif response.status_code == 429:
            return "❌ RATE LIMITED"
        elif response.status_code == 404:
            return "❌ NOT FOUND"
        else:
            return f"❌ ERROR {response.status_code}"

    except Exception as e:
        return f"❌ EXCEPTION: {str(e)[:50]}"

def main():
    print("🔍 Testing Gemini API Models for Resume Parser")
    print("=" * 50)

    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY not found in environment")
        print("Set it in your .env file or environment variables")
        return

    print(f"API Key: {GEMINI_API_KEY[:20]}...")
    print()

    working_models = []

    for model in MODELS_TO_TEST:
        print(f"Testing {model}...", end=" ")
        result = test_model(model)
        print(result)

        if "WORKING" in result:
            working_models.append(model)

    print()
    print("📋 Results:")
    if working_models:
        print("✅ Working models:", ", ".join(working_models))
        print()
        print("💡 RECOMMENDATION:")
        print("   Since only gemini-2.5-flash works, the system now uses:")
        print("   - Gemini Vision API for image processing")
        print("   - Text extraction for resume parsing")
        print("   - Graceful fallback for unreadable images")
        print()
        print("   To use a specific model, set in your .env:")
        print(f"   GEMINI_MODEL={working_models[0]}")
    else:
        print("❌ No working models found")
        print("💡 You may need to:")
        print("   1. Check your GEMINI_API_KEY")
        print("   2. Upgrade to Google AI paid tier")
        print("   3. Wait for quota reset")
        print("   4. Visit: https://ai.google.dev/gemini-api/docs/rate-limits")

if __name__ == "__main__":
    main()