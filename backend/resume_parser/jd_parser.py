"""
Job Description Parser

Parses Job Descriptions from various formats (text, PDF, DOCX, images)
and extracts structured requirements using Gemini AI.
"""

import logging
from typing import Dict, List, Any, Optional
from .gemini import generate_text, generate_content

logger = logging.getLogger(__name__)


class JobDescriptionParser:
    """Parse and extract requirements from Job Descriptions"""

    @staticmethod
    def extract_from_text(text: str) -> Dict[str, Any]:
        """
        Extract JD structured data from raw text using Gemini
        
        Args:
            text: Raw job description text
            
        Returns:
            Structured JD data with skills, experience, title, education, seniority
        """
        if not text or len(text.strip()) < 50:
            raise ValueError("Job description text is too short (minimum 50 characters)")
        
        prompt = """You are an expert HR recruiter. Parse this job description and extract the key requirements in JSON format.

IMPORTANT: Return ONLY valid JSON, no markdown, no comments, no explanations.

Job Description:
---
{jd_text}
---

Extract and return this JSON structure:
{{
  "job_title": "exact job title from the JD",
  "required_skills": ["skill1", "skill2", "skill3", ...],
  "minimum_experience_years": number (0 if not specified or entry-level),
  "preferred_experience_years": number (0 if not specified),
  "required_education": "Bachelor's degree/Master's degree/High School/Any/Other (be specific)",
  "seniority_level": "Entry-level/Mid-level/Senior/Lead/Executive (or Other if unclear)",
  "key_responsibilities": ["responsibility1", "responsibility2", ...],
  "benefits_summary": "Brief summary of key benefits if mentioned",
  "industry": "Industry/domain if mentioned",
  "employment_type": "Full-time/Part-time/Contract/Freelance/Other"
}}

Rules:
1. Extract ALL technical skills mentioned (programming languages, tools, frameworks, etc.)
2. Be conservative with minimum_experience_years - if range is given (e.g., "3-5 years"), use the lower bound
3. For required_education, match exactly to the provided options or use "Other"
4. Return empty arrays/strings rather than null values
5. Ensure all required fields are present
""".format(jd_text=text[:8000])  # Use first 8000 chars to avoid token limits

        logger.info("Parsing JD text with Gemini...")
        response_text = generate_text(prompt, temperature=0.1, max_tokens=2000)
        
        # Parse JSON response
        import json
        try:
            # Try direct parsing first
            jd_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON if wrapped in markdown
            if "```json" in response_text:
                jd_data = json.loads(response_text.split("```json")[1].split("```")[0].strip())
            elif "```" in response_text:
                jd_data = json.loads(response_text.split("```")[1].split("```")[0].strip())
            else:
                raise ValueError(f"Failed to parse Gemini response as JSON: {response_text[:500]}")
        
        # Validate required fields
        required_fields = ["job_title", "required_skills", "minimum_experience_years", 
                          "required_education", "seniority_level"]
        for field in required_fields:
            if field not in jd_data:
                raise ValueError(f"Missing required field in JD parsing: {field}")
        
        # Normalize data types
        jd_data["required_skills"] = [s.lower().strip() for s in jd_data.get("required_skills", [])]
        jd_data["minimum_experience_years"] = int(jd_data.get("minimum_experience_years", 0))
        jd_data["preferred_experience_years"] = int(jd_data.get("preferred_experience_years", 0))
        
        logger.info(f"✓ Extracted JD: {jd_data['job_title']} - {len(jd_data['required_skills'])} skills, {jd_data['minimum_experience_years']} years min exp")
        
        return jd_data

    @staticmethod
    def extract_from_image_base64(image_base64: str, jd_context: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract JD structured data from an image (base64) using Gemini Vision
        
        Args:
            image_base64: Base64 encoded image
            jd_context: Optional context about what to look for
            
        Returns:
            Structured JD data
        """
        prompt = """You are an expert HR recruiter. This is an image of a job description.
Extract the key requirements in JSON format (ONLY JSON, no markdown, no comments).

Extract and return this JSON structure:
{{
  "job_title": "exact job title from the JD",
  "required_skills": ["skill1", "skill2", "skill3", ...],
  "minimum_experience_years": number (0 if not specified),
  "preferred_experience_years": number (0 if not specified),
  "required_education": "Bachelor's degree/Master's degree/High School/Any/Other",
  "seniority_level": "Entry-level/Mid-level/Senior/Lead/Executive/Other",
  "key_responsibilities": ["responsibility1", "responsibility2", ...],
  "benefits_summary": "Brief summary of key benefits if mentioned",
  "industry": "Industry/domain if mentioned",
  "employment_type": "Full-time/Part-time/Contract/Freelance/Other"
}}"""

        logger.info("Parsing JD image with Gemini Vision...")
        response_text = generate_content(
            [{"image": image_base64}, {"text": prompt}],
            temperature=0.1,
            max_tokens=2000
        )
        
        # Parse JSON response
        import json
        try:
            jd_data = json.loads(response_text)
        except json.JSONDecodeError:
            if "```json" in response_text:
                jd_data = json.loads(response_text.split("```json")[1].split("```")[0].strip())
            elif "```" in response_text:
                jd_data = json.loads(response_text.split("```")[1].split("```")[0].strip())
            else:
                raise ValueError(f"Failed to parse Gemini Vision response as JSON")
        
        # Validate and normalize
        required_fields = ["job_title", "required_skills", "minimum_experience_years", 
                          "required_education", "seniority_level"]
        for field in required_fields:
            if field not in jd_data:
                raise ValueError(f"Missing required field in JD parsing: {field}")
        
        jd_data["required_skills"] = [s.lower().strip() for s in jd_data.get("required_skills", [])]
        jd_data["minimum_experience_years"] = int(jd_data.get("minimum_experience_years", 0))
        jd_data["preferred_experience_years"] = int(jd_data.get("preferred_experience_years", 0))
        
        logger.info(f"✓ Extracted JD from image: {jd_data['job_title']}")
        
        return jd_data


def parse_job_description(jd_input: str, is_text: bool = True, image_base64: Optional[str] = None) -> Dict[str, Any]:
    """
    Main function to parse a job description
    
    Args:
        jd_input: Either raw text or image base64 string
        is_text: If True, treats jd_input as text; if False, treats as image
        image_base64: Optional pre-extracted image base64
        
    Returns:
        Structured JD data
    """
    parser = JobDescriptionParser()
    
    if is_text:
        return parser.extract_from_text(jd_input)
    else:
        return parser.extract_from_image_base64(jd_input if not image_base64 else image_base64)
