"""
Test script to verify Google Gemini API key is valid and working
Lists available models and tests the best one
Run this to diagnose API key issues before running the main application
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Models to try in order of preference
MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
]

def list_available_models():
    """List all available models from the API"""
    print("\nFetching available models from Google API...")
    
    try:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
        response = requests.get(endpoint, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            models = data.get("models", [])
            if models:
                print("✓ Available models:")
                for model in models:
                    model_name = model.get("name", "").replace("models/", "")
                    if model_name:
                        methods = model.get("supportedGenerationMethods", [])
                        has_generate = "generateContent" in methods
                        status = "✓" if has_generate else "✗"
                        print(f"  {status} {model_name}")
                return models
        else:
            print(f"Could not list models: {response.status_code}")
    except Exception as e:
        print(f"Error listing models: {e}")
    
    return []

def test_api_key():
    """Test if the GEMINI_API_KEY is valid by making a simple API call"""
    
    print("=" * 60)
    print("Google Gemini API Key Verification")
    print("=" * 60)
    
    # Check if API key exists
    if not GEMINI_API_KEY:
        print("❌ ERROR: GEMINI_API_KEY not found in .env file")
        print("\nPlease add GEMINI_API_KEY to your .env file:")
        print("  GEMINI_API_KEY=your_api_key_here")
        return False
    
    print(f"✓ API Key found (first 20 chars): {GEMINI_API_KEY[:20]}...")
    
    # List available models
    list_available_models()
    
    # Try models in order
    print("\nTesting models...")
    for model in MODELS_TO_TRY:
        print(f"\nAttempting: {model}")
        success = test_model(model)
        if success:
            print(f"\n✅ SUCCESS: Model '{model}' is working!")
            return True
    
    print("\n❌ FAILED: No working models found")
    return False

def test_model(model):
    """Test a specific model"""
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
    
    headers = {
        "Content-Type": "application/json",
    }
    
    payload = {
        "contents": [{
            "parts": [{
                "text": "Say 'API test successful' in 3 words only."
            }]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 50,
        }
    }
    
    try:
        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print(f"  ✓ HTTP Status: {response.status_code} (OK)")
            
            response_data = response.json()
            
            # Extract the response text
            try:
                generated_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
                print(f"  ✓ Response: '{generated_text.strip()}'")
                print("=" * 60)
                return True
            except (KeyError, IndexError) as e:
                print(f"  ❌ Unexpected response format: {response_data}")
                return False
                
        elif response.status_code == 404:
            print(f"  ✗ HTTP Status: {response.status_code} (Not Found)")
            print(f"     Model '{model}' not available")
            return False
            
        elif response.status_code == 400:
            print(f"  ❌ HTTP Status: {response.status_code} (Bad Request)")
            print(f"     Error: {response.text[:100]}")
            return False
            
        elif response.status_code == 401:
            print(f"  ❌ HTTP Status: {response.status_code} (Unauthorized)")
            print(f"     Invalid or expired API key")
            return False
            
        elif response.status_code == 403:
            print(f"  ❌ HTTP Status: {response.status_code} (Forbidden)")
            print(f"     API key doesn't have permission or API not enabled")
            return False
            
        elif response.status_code == 429:
            print(f"  ❌ HTTP Status: {response.status_code} (Too Many Requests)")
            print(f"     Rate limit exceeded")
            return False
            
        else:
            print(f"  ❌ HTTP Status: {response.status_code}")
            print(f"     {response.text[:100]}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"  ❌ Connection timeout")
        return False
    except requests.exceptions.ConnectionError:
        print(f"  ❌ Connection error - check internet")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


if __name__ == "__main__":
    print()
    success = test_api_key()
    print()
    sys.exit(0 if success else 1)
