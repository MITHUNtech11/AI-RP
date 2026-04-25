import requests
from typing import Any, Dict, List, Optional, Tuple
import os
import logging
import time

from ..config.settings import GEMINI_API_KEY

logger = logging.getLogger(__name__)


def _extract_error_info(response: requests.Response) -> Tuple[Optional[str], str]:
    """Extract provider status/message from Gemini error responses."""
    fallback_message = response.text[:500] if response.text else "Unknown Gemini API error"

    try:
        payload = response.json()
    except ValueError:
        return None, fallback_message

    error = payload.get("error", {})
    status = error.get("status")
    message = error.get("message") or fallback_message

    reason = None
    for detail in error.get("details", []):
        detail_reason = detail.get("reason")
        if detail_reason:
            reason = detail_reason
            break

    if reason and reason.lower() not in message.lower():
        message = f"{message} (reason: {reason})"

    return status, message


def _is_transient_error(http_status: int, provider_status: Optional[str]) -> bool:
    transient_http = {429, 500, 502, 503, 504}
    transient_provider = {"UNAVAILABLE", "RESOURCE_EXHAUSTED", "DEADLINE_EXCEEDED", "INTERNAL"}
    return http_status in transient_http or (provider_status or "").upper() in transient_provider


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

    max_retries = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
    retry_base_delay = float(os.getenv("GEMINI_RETRY_BASE_DELAY_SECONDS", "1.5"))

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(endpoint, json=payload, headers=headers, timeout=60)
        except requests.exceptions.RequestException as exc:
            if attempt < max_retries:
                wait_seconds = retry_base_delay * (2 ** (attempt - 1))
                logger.warning(
                    "Gemini request error on attempt %d/%d for model %s: %s. Retrying in %.1fs",
                    attempt,
                    max_retries,
                    model,
                    str(exc),
                    wait_seconds,
                )
                time.sleep(wait_seconds)
                continue
            raise RuntimeError(f"Gemini request failed after {max_retries} attempts: {str(exc)}") from exc

        if resp.status_code >= 400:
            provider_status, message = _extract_error_info(resp)

            if _is_transient_error(resp.status_code, provider_status) and attempt < max_retries:
                wait_seconds = retry_base_delay * (2 ** (attempt - 1))
                logger.warning(
                    "Gemini transient error (%s %s) on attempt %d/%d for model %s: %s. Retrying in %.1fs",
                    resp.status_code,
                    provider_status or "UNKNOWN",
                    attempt,
                    max_retries,
                    model,
                    message,
                    wait_seconds,
                )
                time.sleep(wait_seconds)
                continue

            if resp.status_code == 429:
                logger.warning("Rate limit exceeded for model %s. Consider upgrading to paid tier.", model)
                logger.warning("Free tier limits: https://ai.google.dev/gemini-api/docs/rate-limits")

            logger.error(
                "Gemini API Error (%s %s) model=%s: %s",
                resp.status_code,
                provider_status or "UNKNOWN",
                model,
                message,
            )
            logger.error(
                "Gemini request metadata: part_count=%d has_image=%s max_tokens=%s temperature=%s",
                len(contents_parts),
                any("inline_data" in p for p in contents_parts),
                max_tokens,
                temperature,
            )
            raise RuntimeError(f"Gemini API error [{resp.status_code} {provider_status or 'UNKNOWN'}]: {message}")

        response_data = resp.json()

        # Extract text from Google's response format
        try:
            return response_data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            logger.error("Unexpected API response format for model %s: %s", model, response_data)
            raise ValueError(f"Unexpected API response format: {response_data}") from exc

    raise RuntimeError("Gemini request failed after retries")
