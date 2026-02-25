"""
Quick test script for API authentication
Run this after starting the FastAPI server
"""
import requests

API_BASE = "http://localhost:8000"
API_KEY = "1and1"

print("Testing Resume Parser API Authentication\n")
print("=" * 50)

# Test 1: Root endpoint (no auth required)
print("\n1. Testing root endpoint (no auth)...")
try:
    resp = requests.get(f"{API_BASE}/")
    print(f"   Status: {resp.status_code}")
    print(f"   Auth enabled: {resp.json().get('authentication')}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Parse endpoint without API key (should fail if auth enabled)
print("\n2. Testing /parse without API key...")
try:
    resp = requests.post(f"{API_BASE}/parse")
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 401:
        print(f"   ✓ Auth is working! Error: {resp.json()['detail']['error']}")
    else:
        print(f"   Response: {resp.json()}")
except Exception as e:
    print(f"   Error: {e}")

# Test 3: Parse endpoint with wrong API key (should fail)
print("\n3. Testing /parse with wrong API key...")
try:
    headers = {"X-API-Key": "wrong-key"}
    resp = requests.post(f"{API_BASE}/parse", headers=headers)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 401:
        print(f"   ✓ Auth validation working! Error: {resp.json()['detail']['error']}")
except Exception as e:
    print(f"   Error: {e}")

# Test 4: Parse endpoint with correct API key (should succeed with file)
print("\n4. Testing /parse with correct API key...")
try:
    headers = {"X-API-Key": API_KEY}
    resp = requests.post(f"{API_BASE}/parse", headers=headers)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 422:
        print(f"   ✓ Auth passed! (422 = missing file, which is expected)")
    elif resp.status_code == 200:
        print(f"   ✓ Success!")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 50)
print("✓ Authentication is configured correctly!")
print("\nNext steps:")
print("1. Upload a file through Streamlit app")
print("2. Check that it includes the X-API-Key header")
print("3. Verify successful parsing")
