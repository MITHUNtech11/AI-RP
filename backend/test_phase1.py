"""
Test script for Phase 1: Authentication & User Management
Run this to verify all endpoints are working correctly
"""

import requests
import json
from typing import Optional, Tuple

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'


def print_test(name: str):
    print(f"\n{Colors.BLUE}[TEST]{Colors.RESET} {name}")


def print_success(msg: str):
    print(f"  {Colors.GREEN}✓{Colors.RESET} {msg}")


def print_error(msg: str):
    print(f"  {Colors.RED}✗{Colors.RESET} {msg}")


def print_info(msg: str):
    print(f"  {Colors.YELLOW}ℹ{Colors.RESET} {msg}")


def test_signup(email: str, full_name: str, password: str) -> Tuple[bool, Optional[str]]:
    """Test user signup"""
    print_test(f"Signup: {email}")
    
    payload = {
        "email": email,
        "full_name": full_name,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=payload)
        
        if response.status_code == 201:
            data = response.json()
            access_token = data.get("access_token")
            print_success(f"User created with access_token")
            print_info(f"User ID: {data['user']['id']}")
            return True, access_token
        else:
            print_error(f"Signup failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False, None


def test_login(email: str, password: str) -> Tuple[bool, Optional[str]]:
    """Test user login"""
    print_test(f"Login: {email}")
    
    payload = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            refresh_token = data.get("refresh_token")
            print_success(f"Login successful")
            print_info(f"Access token expires in: {data['expires_in']} seconds")
            return True, access_token
        else:
            print_error(f"Login failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False, None


def test_get_current_user(token: str) -> bool:
    """Test getting current user profile"""
    print_test("Get Current User")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"User profile retrieved")
            print_info(f"Email: {data['email']}")
            print_info(f"Full Name: {data['full_name']}")
            return True
        else:
            print_error(f"Failed to get user: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False


def test_get_full_profile(token: str) -> bool:
    """Test getting full profile with preferences"""
    print_test("Get Full Profile with Preferences")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/users/me/full", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Full profile retrieved")
            print_info(f"Theme: {data['preferences']['theme']}")
            print_info(f"Notifications: {data['preferences']['notifications_enabled']}")
            return True
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False


def test_update_preferences(token: str) -> bool:
    """Test updating user preferences"""
    print_test("Update User Preferences")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "theme": "dark",
        "notifications_enabled": False,
        "language": "en"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/users/me/preferences", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Preferences updated")
            print_info(f"Theme: {data['preferences']['theme']}")
            return True
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False


def test_change_password(token: str, current_pw: str, new_pw: str) -> bool:
    """Test changing password"""
    print_test("Change Password")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "current_password": current_pw,
        "new_password": new_pw
    }
    
    try:
        response = requests.put(f"{BASE_URL}/auth/me/password", json=payload, headers=headers)
        
        if response.status_code == 200:
            print_success(f"Password changed successfully")
            return True
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False


def test_validate_token(token: str) -> bool:
    """Test token validation"""
    print_test("Validate Token")
    
    payload = {"token": token}
    
    try:
        response = requests.post(f"{BASE_URL}/auth/validate", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data["valid"]:
                print_success(f"Token is valid")
                print_info(f"User ID: {data['user_id']}")
                return True
            else:
                print_error(f"Token is invalid: {data['message']}")
                return False
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False


def test_health() -> bool:
    """Test health endpoint"""
    print_test("Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Backend is healthy")
            print_info(f"Version: {data['version']}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False


def main():
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"  PHASE 1 TEST SUITE: Authentication & User Management")
    print(f"{'='*60}{Colors.RESET}\n")
    
    # Check if backend is running
    if not test_health():
        print(f"\n{Colors.RED}Backend is not running. Start it with:{Colors.RESET}")
        print("  uvicorn backend.main:app --reload")
        return
    
    # Test credentials
    test_email = "testuser@phase1.com"
    test_password = "TestPassword123!"
    test_new_password = "NewPassword456!"
    
    # Run tests
    all_passed = True
    
    # Test 1: Signup
    signup_ok, token1 = test_signup(test_email, "Test User", test_password)
    all_passed = all_passed and signup_ok
    
    if signup_ok:
        # Test with token from signup
        test_get_current_user(token1)
        test_get_full_profile(token1)
        test_update_preferences(token1)
        
        # Test change password
        if test_change_password(token1, test_password, test_new_password):
            # Login with new password
            login_ok, token2 = test_login(test_email, test_new_password)
            all_passed = all_passed and login_ok
            
            if login_ok:
                test_validate_token(token2)
    
    # Summary
    print(f"\n{Colors.BLUE}{'='*60}")
    if all_passed:
        print(f"{Colors.GREEN}✓ ALL TESTS PASSED{Colors.RESET}")
    else:
        print(f"{Colors.RED}✗ SOME TESTS FAILED{Colors.RESET}")
    print(f"{'='*60}{Colors.RESET}\n")


if __name__ == "__main__":
    main()
