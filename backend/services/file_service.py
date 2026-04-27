"""File handling and resume parsing service"""
import os
import json
import uuid
import logging
import tempfile
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path

from ..resume_parser.azure_vision import extract_resume_json_multi_page, extract_resume_from_text
from ..resume_parser.gemini import generate_text
from ..services.converter import convert_to_png_list, extract_text_from_docx_bytes

logger = logging.getLogger(__name__)


def normalize_extracted_resume(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize raw extracted resume data from Gemini/Azure into frontend-expected format
    
    Converts from format:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "employment": [...],
        "qualifications": [...]
    }
    
    To format:
    {
        "personalInfo": {
            "fullName": "John Doe",
            "email": "john@example.com",
            ...
        },
        "experience": [...],
        "education": [...],
        ...
    }
    """
    # Extract personal info
    name = raw_data.get('name') or f"{raw_data.get('first_name', '')} {raw_data.get('last_name', '')}".strip() or 'Unknown'
    
    # Build address/location
    address_parts = []
    address = raw_data.get('address', {})
    if isinstance(address, dict):
        if address.get('district'):
            address_parts.append(address.get('district'))
        if address.get('state'):
            address_parts.append(address.get('state'))
        if address.get('country'):
            address_parts.append(address.get('country'))
    location = ', '.join(filter(None, address_parts)) or ''
    
    # Normalize experience
    experience = []
    for emp in raw_data.get('employment', []):
        if isinstance(emp, dict):
            experience.append({
                'id': str(uuid.uuid4()),
                'title': emp.get('designation', emp.get('job_title', 'Unknown Position')),
                'company': emp.get('organization', emp.get('company', 'Unknown Company')),
                'startDate': emp.get('start_date', emp.get('from_date', '')),
                'endDate': emp.get('end_date', emp.get('to_date', 'Present' if emp.get('currently_working') else '')),
                'description': emp.get('job_description', emp.get('description', ''))
            })
    
    # Normalize education
    education = []
    for qual in raw_data.get('qualifications', []):
        if isinstance(qual, dict):
            education.append({
                'id': str(uuid.uuid4()),
                'degree': qual.get('qualification_name', qual.get('degree', 'Unknown')),
                'school': qual.get('university', qual.get('institution', 'Unknown')),
                'graduationDate': qual.get('passing_year', qual.get('completion_year', ''))
            })
    
    # Normalize skills
    skills = []
    for skill in raw_data.get('skills', []):
        if isinstance(skill, str):
            skills.append(skill.strip())
        elif isinstance(skill, dict):
            skills.append(skill.get('skill_name', str(skill)))
    
    # Normalize languages
    languages = []
    for lang in raw_data.get('languages', []):
        if isinstance(lang, dict):
            languages.append({
                'language': lang.get('language', 'Unknown'),
                'proficiency': lang.get('proficiency', 'Intermediate')
            })
        elif isinstance(lang, str):
            languages.append({
                'language': lang,
                'proficiency': 'Intermediate'
            })
    
    # Normalize return format
    normalized = {
        'personalInfo': {
            'fullName': name,
            'email': raw_data.get('email', ''),
            'phone': raw_data.get('phone', ''),
            'location': location,
            'linkedin': raw_data.get('linkedin', raw_data.get('linkedIn_url', '')),
            'website': raw_data.get('website', raw_data.get('portfolio', ''))
        },
        'summary': raw_data.get('summary', raw_data.get('professional_summary', '')),
        'skills': skills,
        'experience': experience,
        'education': education,
        'languages': languages,
        'hrNotes': None
    }
    
    logger.info(f"Resume normalized: {normalized['personalInfo']['fullName']} with {len(skills)} skills, {len(experience)} experiences, {len(education)} educations")
    
    return normalized


class FileService:
    """Service for file handling and storage"""
    
    # File configuration
    ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg'}
    MAX_FILE_SIZE_MB = 10
    UPLOAD_DIR = Path(tempfile.gettempdir()) / "resume_uploads"
    
    @staticmethod
    def ensure_upload_dir():
        """Ensure upload directory exists"""
        FileService.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def validate_file(filename: str, file_size_bytes: int) -> Tuple[bool, str]:
        """Validate file extension and size"""
        # Check file extension
        ext = Path(filename).suffix.lower()
        if ext not in FileService.ALLOWED_EXTENSIONS:
            return False, f"File type {ext} not allowed. Allowed types: {', '.join(FileService.ALLOWED_EXTENSIONS)}"
        
        # Check file size
        if file_size_bytes > FileService.MAX_FILE_SIZE_MB * 1024 * 1024:
            return False, f"File size exceeds limit of {FileService.MAX_FILE_SIZE_MB}MB"
        
        return True, "Valid"
    
    @staticmethod
    def save_file(file_content: bytes, original_filename: str) -> str:
        """Save file and return file ID"""
        FileService.ensure_upload_dir()
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        ext = Path(original_filename).suffix.lower()
        filename = f"{file_id}{ext}"
        filepath = FileService.UPLOAD_DIR / filename
        
        # Save file
        with open(filepath, 'wb') as f:
            f.write(file_content)
        
        logger.info(f"File saved: {filepath}")
        return file_id
    
    @staticmethod
    def get_file(file_id: str, original_filename: str) -> Optional[bytes]:
        """Retrieve file by ID"""
        ext = Path(original_filename).suffix.lower()
        filepath = FileService.UPLOAD_DIR / f"{file_id}{ext}"
        
        if not filepath.exists():
            return None
        
        with open(filepath, 'rb') as f:
            return f.read()
    
    @staticmethod
    def delete_file(file_id: str, original_filename: str) -> bool:
        """Delete file by ID"""
        ext = Path(original_filename).suffix.lower()
        filepath = FileService.UPLOAD_DIR / f"{file_id}{ext}"
        
        try:
            if filepath.exists():
                filepath.unlink()
                logger.info(f"File deleted: {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file: {str(e)}")
            return False
    
    @staticmethod
    def cleanup_old_files(days: int = 7):
        """Delete files older than specified days"""
        from datetime import timedelta
        import time
        
        FileService.ensure_upload_dir()
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        
        deleted_count = 0
        for filepath in FileService.UPLOAD_DIR.glob("*"):
            if filepath.is_file() and filepath.stat().st_mtime < cutoff_time:
                try:
                    filepath.unlink()
                    deleted_count += 1
                except Exception as e:
                    logger.error(f"Failed to delete old file {filepath}: {str(e)}")
        
        logger.info(f"Cleaned up {deleted_count} old files")
        return deleted_count


class ParsingService:
    """Service for parsing resume files"""
    
    @staticmethod
    async def parse_resume_file(
        file_content: bytes,
        filename: str,
        use_azure_vision: bool = True
    ) -> Dict[str, Any]:
        """
        Parse resume from uploaded file and normalize the output
        Returns normalized resume JSON in frontend-expected format
        """
        ext = Path(filename).suffix.lower()
        
        try:
            if ext == '.pdf':
                raw_data = await ParsingService._parse_pdf(file_content, filename, use_azure_vision)
            elif ext in {'.docx', '.doc'}:
                raw_data = await ParsingService._parse_docx(file_content)
            elif ext == '.txt':
                raw_data = await ParsingService._parse_text(file_content)
            elif ext in {'.png', '.jpg', '.jpeg'}:
                raw_data = await ParsingService._parse_image(file_content)
            else:
                raise ValueError(f"Unsupported file type: {ext}")
            
            # Normalize the extracted data to frontend format
            normalized_data = normalize_extracted_resume(raw_data)
            logger.info(f"Resume parsed and normalized: {filename}")
            return normalized_data
            
        except Exception as e:
            logger.error(f"Failed to parse {filename}: {str(e)}")
            raise
    
    @staticmethod
    async def _parse_pdf(file_content: bytes, filename: str, use_azure: bool) -> Dict[str, Any]:
        """Parse PDF resume"""
        # Convert PDF to images
        images = convert_to_png_list(file_content, filename)
        
        if use_azure:
            # Use Azure Vision API
            extracted_json = extract_resume_json_multi_page(images)
        else:
            # Fallback to text extraction + Gemini
            text = ""
            for image in images:
                # Would use OCR here
                pass
            extracted_json = await ParsingService._process_text_with_gemini(text)
        
        return extracted_json
    
    @staticmethod
    async def _parse_docx(file_content: bytes) -> Dict[str, Any]:
        """Parse DOCX resume"""
        # Extract text from DOCX
        text = extract_text_from_docx_bytes(file_content)
        
        # Process with Gemini
        return await ParsingService._process_text_with_gemini(text)
    
    @staticmethod
    async def _parse_text(file_content: bytes) -> Dict[str, Any]:
        """Parse plain text resume"""
        text = file_content.decode('utf-8', errors='ignore')
        return await ParsingService._process_text_with_gemini(text)
    
    @staticmethod
    async def _parse_image(file_content: bytes) -> Dict[str, Any]:
        """Parse image resume (PNG, JPG)"""
        # Could use Gemini's image processing or Azure OCR
        # For now, return placeholder
        return {
            "personalInfo": {
                "fullName": "Image Resume",
                "email": "",
                "phone": ""
            },
            "summary": "Image-based resume - requires OCR processing",
            "skills": [],
            "experience": [],
            "education": []
        }
    
    @staticmethod
    async def _process_text_with_gemini(text: str) -> Dict[str, Any]:
        """
        Process resume text using Gemini API
        Returns structured resume JSON
        """
        prompt = f"""
        Parse the following resume text and return a structured JSON format with these fields:
        - personalInfo (fullName, email, phone)
        - summary
        - skills (list)
        - experience (list with jobTitle, company, duration, description)
        - education (list with degree, major, university)
        
        Resume text:
        {text}
        
        Return only valid JSON, no additional text.
        """
        
        try:
            response = generate_text(prompt)
            
            # Parse response as JSON
            json_str = response.strip()
            if json_str.startswith('```json'):
                json_str = json_str[7:-3]  # Remove markdown code blocks
            elif json_str.startswith('```'):
                json_str = json_str[3:-3]
            
            parsed = json.loads(json_str)
            return parsed
        except json.JSONDecodeError:
            logger.error("Failed to parse Gemini response as JSON")
            return {
                "personalInfo": {"fullName": "Unknown"},
                "summary": text[:500],
                "skills": [],
                "experience": [],
                "education": []
            }
        except Exception as e:
            logger.error(f"Error in Gemini parsing: {str(e)}")
            raise


class BatchProcessingService:
    """Service for batch processing multiple files"""
    
    @staticmethod
    async def process_batch(
        file_list: list[Tuple[bytes, str]],
        use_azure_vision: bool = True,
        max_workers: int = 4
    ) -> Dict[str, Any]:
        """
        Process multiple files in batch
        Returns results with success/failure status
        """
        from concurrent.futures import ThreadPoolExecutor
        import asyncio
        
        results = {
            "total": len(file_list),
            "successful": 0,
            "failed": 0,
            "results": [],
            "start_time": datetime.utcnow().isoformat()
        }
        
        try:
            for file_content, filename in file_list:
                try:
                    parsed = await ParsingService.parse_resume_file(
                        file_content,
                        filename,
                        use_azure_vision
                    )
                    
                    results["results"].append({
                        "filename": filename,
                        "status": "success",
                        "data": parsed
                    })
                    results["successful"] += 1
                except Exception as e:
                    results["results"].append({
                        "filename": filename,
                        "status": "failed",
                        "error": str(e)
                    })
                    results["failed"] += 1
            
            results["end_time"] = datetime.utcnow().isoformat()
            return results
        except Exception as e:
            logger.error(f"Batch processing failed: {str(e)}")
            raise
