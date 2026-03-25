"""
Generative extraction integration (Gemini proxy)
Supports multi-page document processing. This module previously used AzureOpenAI;
it now proxies text-generation requests through the `backend.resume_parser.gemini` wrapper.
"""

import base64
import json
import re
from .gemini import generate_text, generate_content
from ..config.settings import GEMINI_API_KEY


def _extract_json_from_response(response_text: str) -> dict:
    """
    Extract JSON from various response formats.
    Handles:
    - Plain JSON: {"key": "value"}
    - Markdown JSON: ```json\n{...}\n```
    - Markdown JSON: ```\n{...}\n```
    - Incomplete/truncated JSON
    
    Returns parsed dict or raises ValueError if no valid JSON found
    """
    response_text = response_text.strip()
    
    # Try 1: Direct JSON parsing
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass
    
    # Try 2: Extract from markdown code blocks - more flexible regex
    # Look for ```json or ``` followed by content and optional closing ```
    json_match = re.search(r'```(?:json)?\s*\n([\s\S]*?)(?:\n```|$)', response_text, re.DOTALL)
    if json_match:
        json_str = json_match.group(1).strip()
        # Try to parse even if incomplete - JSON decoder might handle it
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            # If JSON is incomplete, try to fix it by adding closing braces
            try:
                # Count open and close braces
                open_braces = json_str.count('{') - json_str.count('}')
                open_brackets = json_str.count('[') - json_str.count(']')
                
                # Add missing closing characters
                fixed_json = json_str + '}' * open_braces + ']' * open_brackets
                return json.loads(fixed_json)
            except json.JSONDecodeError:
                pass
    
    # Try 3: Look for JSON object pattern - more flexible
    # Find first { and try to find matching }
    start_idx = response_text.find('{')
    if start_idx != -1:
        # Try to find the end of JSON by counting braces
        json_str = response_text[start_idx:]
        open_count = 0
        end_idx = 0
        in_string = False
        escape = False
        
        for i, char in enumerate(json_str):
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if char == '"' and not escape:
                in_string = not in_string
                continue
            if in_string:
                continue
            if char == '{':
                open_count += 1
            elif char == '}':
                open_count -= 1
                if open_count == 0:
                    end_idx = i + 1
                    break
        
        if end_idx > 0:
            json_str = json_str[:end_idx]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
    
    # If all else fails, raise error with response preview
    raise ValueError(f"Could not extract valid JSON from response: {response_text[:300]}")


def extract_resume_json_multi_page(png_bytes_list: list) -> dict:
    """
    Process multiple PNG pages and merge results
    Returns merged JSON data
    """
    
    all_results = []
    
    # Process each page
    for page_num, png_bytes in enumerate(png_bytes_list, start=1):
        result = _extract_from_single_page(png_bytes, page_num)
        all_results.append(result)
    
    # Merge all results
    merged = _merge_resume_data(all_results)
    
    return merged


def _extract_from_single_page(png_bytes: bytes, page_num: int) -> dict:
    """Extract data from single PNG page using Gemini Vision API"""
    
    # Use Gemini Vision to extract and parse resume from image
    return extract_resume_from_image(png_bytes)


def _merge_resume_data(results_list: list) -> dict:
    """
    Intelligently merge data from multiple pages
    Prioritize non-null values, combine arrays
    """
    
    if not results_list:
        raise ValueError("No results to merge")
    
    # Start with first page
    merged = results_list[0].copy() if results_list[0] else {}
    
    # Merge subsequent pages
    for page_data in results_list[1:]:
        if not page_data:
            continue
        
        # Merge simple fields (prefer non-null from first occurrence)
        for key in ['first_name', 'last_name', 'name', 'initial', 'email', 'phone', 
                    'date_of_birth', 'gender', 'marital_status', 'nationality', 
                    'summary', 'highest_qualification', 'work_status']:
            if not merged.get(key) and page_data.get(key):
                merged[key] = page_data[key]
        
        # Merge address
        if not merged.get('address'):
            merged['address'] = page_data.get('address')
        else:
            for addr_key in ['street_address', 'taluk', 'district', 'state', 'country', 'pincode']:
                if not merged['address'].get(addr_key) and page_data.get('address', {}).get(addr_key):
                    merged['address'][addr_key] = page_data['address'][addr_key]
        
        # Merge arrays (avoid duplicates)
        for array_key in ['skills', 'hobbies']:
            if not merged.get(array_key):
                merged[array_key] = []
            
            existing = set(merged.get(array_key, []))
            new_items = page_data.get(array_key, [])
            merged[array_key] = list(existing.union(set(new_items)))
        
        # Merge languages
        if not merged.get('languages'):
            merged['languages'] = []
        
        existing_langs = {l.get('language'): l for l in merged.get('languages', [])}
        for lang in page_data.get('languages', []):
            lang_name = lang.get('language')
            if lang_name and lang_name not in existing_langs:
                merged['languages'].append(lang)
        
        # Merge employment and qualifications (append new ones)
        if not merged.get('employment'):
            merged['employment'] = []
        
        merged['employment'].extend(page_data.get('employment', []))
        
        if not merged.get('qualifications'):
            merged['qualifications'] = []
        
        merged['qualifications'].extend(page_data.get('qualifications', []))
    
    # Ensure required fields
    if not merged.get('name') and merged.get('first_name') and merged.get('last_name'):
        merged['name'] = f"{merged['first_name']} {merged['last_name']}"
    
    if not merged.get('initial') and merged.get('last_name'):
        merged['initial'] = merged['last_name'][0]
    
    # Fallback for missing required fields
    if not merged.get('first_name'):
        merged['first_name'] = 'Unknown'
    if not merged.get('last_name'):
        merged['last_name'] = 'Unknown'
    if not merged.get('name'):
        merged['name'] = f"{merged['first_name']} {merged['last_name']}"
    if not merged.get('initial'):
        merged['initial'] = merged['last_name'][0] if merged['last_name'] else 'U'
    
    # Ensure arrays exist
    merged.setdefault('skills', [])
    merged.setdefault('hobbies', [])
    merged.setdefault('languages', [])
    merged.setdefault('employment', [])
    merged.setdefault('qualifications', [])
    
    return merged

def extract_resume_from_text(text_content: str) -> dict:
    """
    Extract resume data from plain text without image conversion
    Sends text directly to Gemini API (no Vision API needed)
    
    Args:
        text_content: Raw text extracted from .txt file
        
    Returns:
        dict: Structured resume data matching your existing schema
    """
    # Use the Gemini wrapper to generate structured JSON from text
    system_prompt = """You are an expert resume parser. Extract ALL information from the text and return ONLY valid JSON:

{
  "first_name": "string or null",
  "last_name": "string or null",
  "name": "full name or null",
  "initial": "single letter or null",
  "email": "email@example.com or null",
  "phone": "phone number or null",
  "date_of_birth": "YYYY-MM-DD or null",
  "gender": "male or female or null",
  "marital_status": "single or married or divorced or separated or widowed or null",
  "nationality": "country or null",
  "summary": "professional summary or null",
  "address": {
    "street_address": "street or null",
    "taluk": "taluk or null",
    "district": "district or null",
    "state": "state or null",
    "country": "country or null",
    "pincode": "pincode or null"
  },
  "highest_qualification": "degree or null",
  "skills": ["skill1", "skill2"],
  "hobbies": ["hobby1", "hobby2"],
  "languages": [
    {"language": "language name", "can_read": "yes or no or null", "can_speak": "yes or no or null", "can_write": "yes or no or null"}
  ],
  "work_status": "freshers or experienced or null",
  "employment": [
    {
      "company_name": "company or null",
      "designation": "job title or null",
      "startDate": "YYYY-MM or null",
      "endDate": "YYYY-MM or null",
      "department": "department or null",
      "job_profile": "job description or null",
      "employment_type": "full-time or part-time or internship or contract or freelance or null",
      "current_ctc": "salary or null",
      "relevant_experience": "experience or null"
    }
  ],
  "qualifications": [
    {
      "qualification": "degree name or null",
      "specialization": "field or null",
      "university_name": "university or null",
      "college_or_school": "institution or null",
      "year_of_completion": "YYYY-MM or null",
      "percentage": "score or null",
      "search": "institution name or null",
      "registration_no": "registration number or null"
    }
  ]
}

CRITICAL RULES:
1. Extract ALL information from the text
2. Use null for missing fields
3. Use empty arrays [] for empty lists
4. Return ONLY valid JSON object - DO NOT wrap in markdown code blocks, DO NOT use ```json, just return the raw JSON"""

    try:
        # Log the content being sent  
        content_preview = text_content[:500] if len(text_content) > 500 else text_content
        print(f"[TEXT EXTRACTION] Sending to Gemini ({len(text_content)} chars)")
        print(f"[TEXT EXTRACTION] Content preview: {content_preview[:200]}...")
        
        resp = generate_text(system_prompt + "\n\n" + f"Extract all resume information from this text:\n\n{text_content}", temperature=0.1, max_tokens=8000)
        
        print(f"[TEXT EXTRACTION] Gemini response received ({len(resp)} chars)")
        
        # Extract JSON from response (handles markdown wrapping)
        try:
            result_json = _extract_json_from_response(resp)
        except ValueError as e:
            print(f"[TEXT EXTRACTION] JSON parsing error: {str(e)}")
            raise Exception(f"Failed to parse JSON response: {str(e)}")
        
        # Validate that we got actual data, not just defaults
        print(f"[TEXT EXTRACTION] Extracted data: name={result_json.get('name')}, email={result_json.get('email')}, skills={len(result_json.get('skills', []))}")
        
        # Apply same fallback logic as image processing
        if not result_json.get('name') and result_json.get('first_name') and result_json.get('last_name'):
            result_json['name'] = f"{result_json['first_name']} {result_json['last_name']}"
        
        if not result_json.get('initial') and result_json.get('last_name'):
            result_json['initial'] = result_json['last_name'][0]
        
        # Ensure required fields have fallback values
        if not result_json.get('first_name'):
            result_json['first_name'] = 'Unknown'
        if not result_json.get('last_name'):
            result_json['last_name'] = 'Unknown'
        if not result_json.get('name'):
            result_json['name'] = f"{result_json['first_name']} {result_json['last_name']}"
        if not result_json.get('initial'):
            result_json['initial'] = result_json['last_name'][0] if result_json['last_name'] else 'U'
        
        # Ensure arrays exist
        result_json.setdefault('skills', [])
        result_json.setdefault('hobbies', [])
        result_json.setdefault('languages', [])
        result_json.setdefault('employment', [])
        result_json.setdefault('qualifications', [])
        
        print(f"[TEXT EXTRACTION] Final result: name={result_json.get('name')}")
        return result_json
        
    except Exception as e:
        print(f"[TEXT EXTRACTION] ERROR: {str(e)}")
        raise Exception(f"Generative API error processing text: {e}")


def extract_resume_from_image(image_bytes: bytes) -> dict:
    """
    Extract resume data from image using Gemini Vision API
    Sends image directly to Gemini for OCR and parsing
    
    Args:
        image_bytes: PNG image bytes
        
    Returns:
        dict: Structured resume data matching your existing schema
    """
    # Convert image to base64
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    
    # Use the same prompt as text extraction but for vision
    system_prompt = """You are an expert resume parser. Extract ALL information from the resume image and return ONLY valid JSON:

{
  "first_name": "string or null",
  "last_name": "string or null",
  "name": "full name or null",
  "initial": "single letter or null",
  "email": "email@example.com or null",
  "phone": "phone number or null",
  "date_of_birth": "YYYY-MM-DD or null",
  "gender": "male or female or null",
  "marital_status": "single or married or divorced or separated or widowed or null",
  "nationality": "country or null",
  "summary": "professional summary or null",
  "address": {
    "street_address": "street or null",
    "taluk": "taluk or null",
    "district": "district or null",
    "state": "state or null",
    "country": "country or null",
    "pincode": "pincode or null"
  },
  "highest_qualification": "degree or null",
  "skills": ["skill1", "skill2"],
  "hobbies": ["hobby1", "hobby2"],
  "languages": [
    {"language": "language name", "can_read": "yes or no or null", "can_speak": "yes or no or null", "can_write": "yes or no or null"}
  ],
  "work_status": "freshers or experienced or null",
  "employment": [
    {
      "company_name": "company or null",
      "designation": "job title or null",
      "startDate": "YYYY-MM or null",
      "endDate": "YYYY-MM or null",
      "department": "department or null",
      "job_profile": "job description or null",
      "employment_type": "full-time or part-time or internship or contract or freelance or null",
      "current_ctc": "salary or null",
      "relevant_experience": "experience or null"
    }
  ],
  "qualifications": [
    {
      "qualification": "degree name or null",
      "specialization": "field or null",
      "university_name": "university or null",
      "college_or_school": "institution or null",
      "year_of_completion": "YYYY-MM or null",
      "percentage": "score or null",
      "search": "institution name or null",
      "registration_no": "registration number or null"
    }
  ]
}

CRITICAL RULES:
1. Extract ALL information from the resume image
2. Use null for missing fields
3. Use empty arrays [] for empty lists
4. Return ONLY valid JSON object - DO NOT wrap in markdown code blocks, DO NOT use ```json, just return the raw JSON"""

    try:
        print(f"[VISION EXTRACTION] Sending image to Gemini ({len(image_bytes)} bytes)")
        
        # Use Gemini Vision API
        parts = [
            {"text": system_prompt + "\n\nExtract all resume information from this resume image:"},
            {"image": image_b64}
        ]
        
        resp = generate_content(parts, temperature=0.1, max_tokens=8000)
        
        print(f"[VISION EXTRACTION] Gemini response received ({len(resp)} chars)")
        
        # Extract JSON from response (handles markdown wrapping)
        try:
            result_json = _extract_json_from_response(resp)
        except ValueError as e:
            print(f"[VISION EXTRACTION] JSON parsing error: {str(e)}")
            raise Exception(f"Failed to parse JSON response: {str(e)}")
        
        # Validate that we got actual data, not just defaults
        print(f"[VISION EXTRACTION] Extracted data: name={result_json.get('name')}, email={result_json.get('email')}, skills={len(result_json.get('skills', []))}")
        
        # Apply same fallback logic as text processing
        if not result_json.get('name') and result_json.get('first_name') and result_json.get('last_name'):
            result_json['name'] = f"{result_json['first_name']} {result_json['last_name']}"
        
        if not result_json.get('initial') and result_json.get('last_name'):
            result_json['initial'] = result_json['last_name'][0]
        
        # Ensure required fields have fallback values
        if not result_json.get('first_name'):
            result_json['first_name'] = "Unknown"
        if not result_json.get('last_name'):
            result_json['last_name'] = "Unknown"
        if not result_json.get('name'):
            result_json['name'] = "Unknown Unknown"
        if not result_json.get('initial'):
            result_json['initial'] = "U"
        
        # Ensure arrays exist
        result_json.setdefault('skills', [])
        result_json.setdefault('hobbies', [])
        result_json.setdefault('languages', [])
        result_json.setdefault('employment', [])
        result_json.setdefault('qualifications', [])
        
        print(f"[VISION EXTRACTION] Final result: name={result_json.get('name')}")
        return result_json
        
    except Exception as e:
        print(f"[VISION EXTRACTION] ERROR: {str(e)}")
        raise Exception(f"Vision API error processing image: {e}")
