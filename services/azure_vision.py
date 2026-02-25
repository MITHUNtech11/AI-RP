"""
Generative extraction integration (Gemini proxy)
Supports multi-page document processing. This module previously used AzureOpenAI;
it now proxies text-generation requests through the `services.gemini` wrapper.
"""

import base64
import json
from services.gemini import generate_text
from config.settings import GEMINI_API_KEY


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
    """Extract data from single PNG page"""
    # Encode PNG to base64
    base64_image = base64.b64encode(png_bytes).decode('utf-8')

    system_prompt = """You are an expert resume parser. Extract ALL information and return ONLY valid JSON:

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
1. Extract ALL information visible on THIS PAGE ONLY
2. Use null for missing fields
3. Use empty arrays [] for empty lists
4. Ignore page headers like '----- PAGE X -----'
5. Return ONLY valid JSON"""
    
    # Build a prompt that includes the base64 image as data URI. Note: many LLM
    # endpoints do not natively support image understanding via base64 in text;
    # for best OCR results consider integrating Google Cloud Vision or Tesseract.
    user_text = f"Extract all resume information from page {page_num}. The page image is provided as a base64 data URI below. Return ONLY valid JSON matching the schema."\
                f"\n\nDATA_URI:\ndata:image/png;base64,{base64_image}"

    try:
        resp = generate_text(system_prompt + "\n\n" + user_text, temperature=0.1, max_tokens=4000)
        # The wrapper returns parsed JSON from the external API; attempt to extract
        # text response candidate. Adjust based on your Gemini response shape.
        if isinstance(resp, dict):
            # Many providers put text in resp['choices'][0]['text'] or similar.
            text_candidate = None
            if 'choices' in resp and isinstance(resp['choices'], list) and resp['choices']:
                text_candidate = resp['choices'][0].get('text') or resp['choices'][0].get('message', {}).get('content')
            else:
                # fallback to top-level 'output' or 'content'
                text_candidate = resp.get('output') or resp.get('content')

            if text_candidate:
                try:
                    result_json = json.loads(text_candidate)
                    return result_json
                except Exception:
                    # Return wrapper response as-is if it isn't JSON
                    return {"raw": resp}

        return {"raw": resp}
    except Exception as e:
        raise Exception(f"Generative API error on page {page_num}: {e}")


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
    Sends text directly to Azure OpenAI (no Vision API needed)
    
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
4. Return ONLY valid JSON"""

    try:
        resp = generate_text(system_prompt + "\n\n" + f"Extract all resume information from this text:\n\n{text_content}", temperature=0.1, max_tokens=4000)
        # Attempt to find text output
        text_candidate = None
        if isinstance(resp, dict):
            if 'choices' in resp and isinstance(resp['choices'], list) and resp['choices']:
                text_candidate = resp['choices'][0].get('text') or resp['choices'][0].get('message', {}).get('content')
            else:
                text_candidate = resp.get('output') or resp.get('content')

        if text_candidate:
            result_json = json.loads(text_candidate)
        else:
            # If the wrapper returned raw text
            result_json = resp if isinstance(resp, dict) else json.loads(str(resp))
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
        
        return result_json
        
    except Exception as e:
        raise Exception(f"Generative API error processing text: {e}")
