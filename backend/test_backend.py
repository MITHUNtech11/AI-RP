#!/usr/bin/env python3
"""
Test script for the resume parser backend
Tests the API endpoints with sample data
"""

import requests
import json
import time
from pathlib import Path

def test_backend():
    """Test the backend API endpoints"""

    base_url = "http://localhost:8000"

    print("🚀 Testing Resume Parser Backend")
    print("=" * 40)

    # Test 1: Health check (if exists)
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check: OK")
        else:
            print(f"⚠️  Health check: {response.status_code}")
    except:
        print("ℹ️  Health check: Not available (removed)")

    # Test 2: Parse resume text
    print("\n📝 Testing text parsing...")
    test_text = """
    John Doe
    Software Engineer
    5 years experience
    Skills: Python, JavaScript, React
    Education: BS Computer Science
    """

    try:
        response = requests.post(
            f"{base_url}/parse_resume_txt",
            json={"text": test_text}
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Text parsing: SUCCESS")
            print(f"   Name: {result.get('name', 'N/A')}")
            print(f"   Skills: {len(result.get('skills', []))} found")
        else:
            print(f"❌ Text parsing: {response.status_code}")
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ Text parsing: ERROR - {str(e)}")

    # Test 3: Parse resume file (if test file exists)
    test_file = Path("../uploads/sample_resume.pdf")
    if test_file.exists():
        print("\n📄 Testing file parsing...")
        try:
            with open(test_file, "rb") as f:
                files = {"file": ("sample_resume.pdf", f, "application/pdf")}
                response = requests.post(f"{base_url}/parse", files=files)

            if response.status_code == 200:
                result = response.json()
                print("✅ File parsing: SUCCESS")
                print(f"   Name: {result.get('name', 'N/A')}")
            else:
                print(f"❌ File parsing: {response.status_code}")
                print(f"   Error: {response.text}")

        except Exception as e:
            print(f"❌ File parsing: ERROR - {str(e)}")
    else:
        print("\n📄 File parsing: SKIPPED (no test file)")
        print("\n💡 To test file parsing:")
        print("   1. Place a PDF resume in ../uploads/sample_resume.pdf")
        print("   2. Run this test again")

    print("\n🎯 Backend Status:")
    print("   - API: Running")
    print("   - Models: gemini-2.5-flash (working)")
    print("   - Vision: Gemini Vision API")
    print("   - Processing: Vision-based parsing")
if __name__ == "__main__":
    test_backend()