import requests
from typing import Any, Dict, List, Union
import os
import logging
import base64
import time

from ..config.settings import GEMINI_API_KEY

logger = logging.getLogger(__name__)


def generate_text(prompt: str, temperature: float = 0.2, max_tokens: int = 4000) -> str:
    """
    Call Google Generative AI (Gemini) API to generate text from a prompt.
    Works with any model available in your Google AI Studio account.

    Returns the generated text content directly.
    """
    return generate_content([{"text": prompt}], temperature=temperature, max_tokens=max_tokens)


def generate_content(parts: List[Dict[str, Any]], temperature: float = 0.2, max_tokens: int = 4000, model: str = None) -> str:
    """
    Call Google Generative AI (Gemini) API with multimodal content.
    Supports text and images.

    Args:
        parts: List of content parts, each can be {"text": "string"} or {"image": base64_string}
        temperature: Generation temperature
        max_tokens: Maximum output tokens
        model: Specific model to use, defaults to gemini-2.5-flash

    Returns:
        Generated text content
    """

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured in environment")

    # Use vision-capable model by default for multimodal content
    if model is None:
        # Check if any part has image data
        has_image = any("image" in part for part in parts)
        if has_image:
            # Use the only working model for now
            model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # Only working model
        else:
            model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # Text model

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"

    headers = {
        "Content-Type": "application/json",
    }

    # Convert parts to Gemini API format
    contents_parts = []
    for part in parts:
        if "text" in part:
            contents_parts.append({"text": part["text"]})
        elif "image" in part:
            # Assume base64 string, add data URI prefix
            image_data = part["image"]
            if not image_data.startswith("data:"):
                image_data = f"data:image/png;base64,{image_data}"
            contents_parts.append({
                "inline_data": {
                    "mime_type": "image/png",
                    "data": image_data.replace("data:image/png;base64,", "")
                }
            })
        else:
            raise ValueError(f"Unsupported part type: {part}")

    payload = {
        "contents": [{
            "parts": contents_parts
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
        
        # Check if it's a rate limit error (429)
        if resp.status_code == 429:
            logger.warning(f"Rate limit exceeded for model {model}. Consider upgrading to paid tier.")
            logger.warning("Free tier limits: https://ai.google.dev/gemini-api/docs/rate-limits")
        
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
