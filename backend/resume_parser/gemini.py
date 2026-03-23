import requests
from typing import Any, Dict
import os
import logging

from backend.config.settings import GEMINI_API_KEY

logger = logging.getLogger(__name__)


def generate_text(prompt: str, temperature: float = 0.2, max_tokens: int = 4000) -> str:
    """
    Call Google Generative AI (Gemini) API to generate text from a prompt.
    Works with any model available in your Google AI Studio account.
    
    Returns the generated text content directly.
    """

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured in environment")

    # Use gemini-2.5-flash by default (latest and fastest)
    # You can override with environment variable: GEMINI_MODEL=gemini-2.5-pro
    # Available options: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
    
    headers = {
        "Content-Type": "application/json",
    }

    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
    }

    try:
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
    except requests.exceptions.HTTPError as e:
        error_detail = resp.text if hasattr(resp, 'text') else str(e)
        logger.error(f"Gemini API Error ({resp.status_code}): {error_detail}")
        logger.error(f"Endpoint: {endpoint}")
        logger.error(f"Payload: {payload}")
        raise RuntimeError(f"Gemini API error: {error_detail}") from e

    response_data = resp.json()
    
    # Extract text from Google's response format
    try:
        return response_data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        logger.error(f"Unexpected API response: {response_data}")
        raise ValueError(f"Unexpected API response format: {response_data}") from e
