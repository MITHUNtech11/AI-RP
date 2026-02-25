import requests
from typing import Any, Dict

from config.settings import GEMINI_API_KEY, GEMINI_ENDPOINT


def generate_text(prompt: str, temperature: float = 0.2, max_tokens: int = 512) -> Dict[str, Any]:
    """
    Simple wrapper to call a Gemini / Generative API endpoint.

    Notes:
    - Ensure `GEMINI_API_KEY` and `GEMINI_ENDPOINT` are set in your environment (.env).
    - The exact request shape depends on the provider; this wrapper sends a
      generic JSON payload and returns the parsed JSON response.
    """

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured in environment")

    headers = {
        "Authorization": f"Bearer {GEMINI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "prompt": prompt,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    resp = requests.post(GEMINI_ENDPOINT, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()

    return resp.json()
