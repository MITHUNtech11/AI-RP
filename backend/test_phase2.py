"""
Phase 2 Test Suite: Resume, Job Description, and Activity Management
Tests all 15 new endpoints for CRUD operations
"""

import pytest
import json
import sys
from pathlib import Path
from fastapi.testclient import TestClient
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import app
from backend.config.database import SessionLocal, Base, engine
from backend.models.user import User
from backend.services.auth_service import PasswordService, TokenService

client = TestClient(app)

# ============================================
# SETUP: Create test user and authentication
# ============================================

@pytest.fixture(scope="module")
def setup_db():
    """Initialize database for testing"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def auth_token():
    """Create test user and get auth token"""
    db = SessionLocal()
    
    # Create test user
    password_service = PasswordService()
    hashed_pwd = password_service.hash_password("testpass123")
    
    user = User(
        email="phase2test@example.com",
        username="phase2tester",
        hashed_password=hashed_pwd
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token
    token_service = TokenService()
    token = token_service.create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    db.close()
    return token

def get_headers(token):
    """Return authorization headers"""
    return {"Authorization": f"Bearer {token}"}

# ============================================
# PHASE 2: RESUME ENDPOINT TESTS
# ============================================

def test_create_resume(auth_token):
    """POST /resumes - Create new resume"""
    resume_data = {
        "file_name": "john_doe_resume.pdf",
        "resume_json": {
            "personalInfo": {
                "fullName": "John Doe",
                "email": "john@example.com",
                "phone": "123-456-7890"
            },
            "summary": "Senior Software Engineer with 5 years experience",
            "skills": ["Python", "FastAPI", "React", "Docker"],
            "experience": [
                {
                    "jobTitle": "Software Engineer",
                    "company": "TechCorp",
                    "duration": "2 years"
                }
            ],
            "education": [
                {
                    "degree": "Bachelor of Science",
                    "major": "Computer Science",
                    "university": "MIT"
                }
            ]
        }
    }
    
    response = client.post(
        "/resumes",
        json=resume_data,
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["id"]
    assert data["file_name"] == "john_doe_resume.pdf"
    assert data["user_id"]
    
    return data["id"]

def test_list_resumes(auth_token):
    """GET /resumes - List resumes with pagination and filters"""
    # First create a resume
    resume_data = {
        "file_name": "test_resume.pdf",
        "resume_json": {
            "personalInfo": {"fullName": "Test Candidate"},
            "summary": "Test summary",
            "skills": ["Python"],
            "experience": [],
            "education": []
        }
    }
    
    client.post(
        "/resumes",
        json=resume_data,
        headers=get_headers(auth_token)
    )
    
    # Test basic listing
    response = client.get(
        "/resumes",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "resumes" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert "has_more" in data

def test_list_resumes_with_search(auth_token):
    """GET /resumes - Test search functionality"""
    response = client.get(
        "/resumes?search=john",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "resumes" in data

def test_list_resumes_with_filters(auth_token):
    """GET /resumes - Test min_score and recommendation filters"""
    response = client.get(
        "/resumes?min_score=50&recommendation=Strong Match",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "resumes" in data

def test_get_resume(auth_token):
    """GET /resumes/{id} - Get single resume"""
    # Create resume first
    resume_data = {
        "file_name": "get_test.pdf",
        "resume_json": {"personalInfo": {"fullName": "Get Test"}}
    }
    
    create_response = client.post(
        "/resumes",
        json=resume_data,
        headers=get_headers(auth_token)
    )
    
    resume_id = create_response.json()["id"]
    
    # Get resume
    response = client.get(
        f"/resumes/{resume_id}",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == resume_id

def test_update_resume(auth_token):
    """PUT /resumes/{id} - Update resume metadata"""
    # Create resume first
    resume_data = {
        "file_name": "update_test.pdf",
        "resume_json": {"personalInfo": {"fullName": "Update Test"}}
    }
    
    create_response = client.post(
        "/resumes",
        json=resume_data,
        headers=get_headers(auth_token)
    )
    
    resume_id = create_response.json()["id"]
    
    # Update resume
    update_data = {
        "hr_notes": "Strong candidate, schedule interview",
        "match_score": 85,
        "recommendation": "Strong Match"
    }
    
    response = client.put(
        f"/resumes/{resume_id}",
        json=update_data,
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["hr_notes"] == "Strong candidate, schedule interview"
    assert data["match_score"] == 85

def test_delete_resume(auth_token):
    """DELETE /resumes/{id} - Delete single resume"""
    # Create resume first
    resume_data = {
        "file_name": "delete_test.pdf",
        "resume_json": {"personalInfo": {"fullName": "Delete Test"}}
    }
    
    create_response = client.post(
        "/resumes",
        json=resume_data,
        headers=get_headers(auth_token)
    )
    
    resume_id = create_response.json()["id"]
    
    # Delete resume
    response = client.delete(
        f"/resumes/{resume_id}",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200

def test_bulk_delete_resumes(auth_token):
    """POST /resumes/bulk-delete - Delete multiple resumes"""
    # Create multiple resumes
    ids = []
    for i in range(3):
        resume_data = {
            "file_name": f"bulk_delete_test_{i}.pdf",
            "resume_json": {"personalInfo": {"fullName": f"Bulk Test {i}"}}
        }
        
        create_response = client.post(
            "/resumes",
            json=resume_data,
            headers=get_headers(auth_token)
        )
        ids.append(create_response.json()["id"])
    
    # Bulk delete
    response = client.post(
        "/resumes/bulk-delete",
        json={"resume_ids": ids},
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200

# ============================================
# PHASE 2: JOB DESCRIPTION ENDPOINT TESTS
# ============================================

def test_create_job_description(auth_token):
    """POST /job-descriptions - Create job description"""
    jd_data = {
        "title": "Senior Software Engineer",
        "description": "We are looking for a Senior Software Engineer with 5+ years experience in Python and FastAPI."
    }
    
    response = client.post(
        "/job-descriptions",
        json=jd_data,
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["id"]
    assert data["title"] == "Senior Software Engineer"
    
    return data["id"]

def test_list_job_descriptions(auth_token):
    """GET /job-descriptions - List all job descriptions"""
    response = client.get(
        "/job-descriptions",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_job_description(auth_token):
    """GET /job-descriptions/{id} - Get single job description"""
    # Create JD first
    jd_data = {
        "title": "Junior Developer",
        "description": "Entry-level developer position"
    }
    
    create_response = client.post(
        "/job-descriptions",
        json=jd_data,
        headers=get_headers(auth_token)
    )
    
    jd_id = create_response.json()["id"]
    
    # Get JD
    response = client.get(
        f"/job-descriptions/{jd_id}",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == jd_id

def test_update_job_description(auth_token):
    """PUT /job-descriptions/{id} - Update job description"""
    # Create JD first
    jd_data = {
        "title": "Product Manager",
        "description": "Product management role"
    }
    
    create_response = client.post(
        "/job-descriptions",
        json=jd_data,
        headers=get_headers(auth_token)
    )
    
    jd_id = create_response.json()["id"]
    
    # Update JD
    update_data = {
        "title": "Senior Product Manager",
        "description": "Senior PM role with team leadership",
        "is_active": False
    }
    
    response = client.put(
        f"/job-descriptions/{jd_id}",
        json=update_data,
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Senior Product Manager"

def test_set_active_job_description(auth_token):
    """PUT /job-descriptions/{id}/set-active - Set JD as active"""
    # Create JD first
    jd_data = {
        "title": "Data Scientist",
        "description": "Data science position"
    }
    
    create_response = client.post(
        "/job-descriptions",
        json=jd_data,
        headers=get_headers(auth_token)
    )
    
    jd_id = create_response.json()["id"]
    
    # Set as active
    response = client.put(
        f"/job-descriptions/{jd_id}/set-active",
        json={"is_active": True},
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] == True

def test_get_active_job_description(auth_token):
    """GET /job-descriptions/{id}/active - Get active job description"""
    # Set one as active first
    jd_data = {
        "title": "QA Engineer",
        "description": "Quality assurance role"
    }
    
    create_response = client.post(
        "/job-descriptions",
        json=jd_data,
        headers=get_headers(auth_token)
    )
    
    jd_id = create_response.json()["id"]
    
    client.put(
        f"/job-descriptions/{jd_id}/set-active",
        json={"is_active": True},
        headers=get_headers(auth_token)
    )
    
    # Get active
    response = client.get(
        f"/job-descriptions/{jd_id}/active",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200

def test_delete_job_description(auth_token):
    """DELETE /job-descriptions/{id} - Delete job description"""
    # Create JD first
    jd_data = {
        "title": "DevOps Engineer",
        "description": "Infrastructure and deployment"
    }
    
    create_response = client.post(
        "/job-descriptions",
        json=jd_data,
        headers=get_headers(auth_token)
    )
    
    jd_id = create_response.json()["id"]
    
    # Delete JD
    response = client.delete(
        f"/job-descriptions/{jd_id}",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200

# ============================================
# PHASE 2: ACTIVITY ENDPOINT TESTS
# ============================================

def test_get_activities(auth_token):
    """GET /activities - Get activity history"""
    response = client.get(
        "/activities",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "activities" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data

def test_get_activity_summary(auth_token):
    """GET /activities/summary - Get activity statistics"""
    response = client.get(
        "/activities/summary",
        headers=get_headers(auth_token)
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "total_events" in data
    assert "events_this_week" in data
    assert "events_this_month" in data
    assert "last_activity" in data
    assert "event_breakdown" in data


# ============================================
# TEST RUNNER
# ============================================

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
