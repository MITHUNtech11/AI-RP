"""Validate GEMINI_API_KEY against a chosen Gemini model.

Usage examples:
  python backend/test_api_key.py
  python backend/test_api_key.py --model gemini-2.5-flash
  python backend/test_api_key.py --model "Gemini 2.5 Flash"
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Dict, Optional, Tuple
from pathlib import Path

import requests
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv()

DEFAULT_MODEL = "gemini-2.5-flash"
API_BASE = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


MODEL_ALIASES = {
    "gemini 2.5 flash": "gemini-2.5-flash",
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini 2.5 pro": "gemini-2.5-pro",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini 2.0 flash": "gemini-2.0-flash",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini 1.5 flash": "gemini-1.5-flash",
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini 1.5 pro": "gemini-1.5-pro",
    "gemini-1.5-pro": "gemini-1.5-pro",
}


def normalize_model_name(model: str) -> str:
    """Normalize friendly model names to API model IDs."""
    value = model.strip()
    if value.startswith("models/"):
        value = value.split("/", 1)[1]

    normalized = " ".join(value.lower().replace("_", "-").split())
    return MODEL_ALIASES.get(normalized, value.lower())


def mask_api_key(api_key: str) -> str:
    if len(api_key) <= 10:
        return "*" * len(api_key)
    return f"{api_key[:6]}...{api_key[-4:]}"


def parse_error_payload(response: requests.Response) -> Tuple[Optional[str], str]:
    """Return provider reason and message from Gemini error payload."""
    try:
        payload: Dict = response.json()
    except ValueError:
        return None, response.text[:300]

    error = payload.get("error", {})
    message = error.get("message", "Unknown error")
    reason = None

    for detail in error.get("details", []):
        detail_reason = detail.get("reason")
        if detail_reason:
            reason = detail_reason
            break

    return reason, message


def list_available_generate_models(api_key: str) -> set[str]:
    """Fetch models enabled for generateContent with this key."""
    endpoint = f"{API_BASE}/models?key={api_key}"

    try:
        response = requests.get(endpoint, timeout=15)
    except requests.RequestException as exc:
        print(f"WARN  could not list models: {exc}")
        return set()

    if response.status_code != 200:
        reason, message = parse_error_payload(response)
        reason_text = f" ({reason})" if reason else ""
        print(f"WARN  model listing failed: HTTP {response.status_code}{reason_text}: {message}")
        return set()

    data = response.json()
    models = set()
    for model in data.get("models", []):
        methods = model.get("supportedGenerationMethods", [])
        if "generateContent" in methods:
            model_name = model.get("name", "")
            if model_name.startswith("models/"):
                model_name = model_name.split("/", 1)[1]
            if model_name:
                models.add(model_name)

    return models


def test_key_for_model(api_key: str, model: str) -> bool:
    """Run a minimal generateContent request for the chosen model."""
    endpoint = f"{API_BASE}/models/{model}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{
                "text": "Reply with exactly: API key works"
            }]
        }],
        "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 32,
        },
    }

    try:
        response = requests.post(endpoint, json=payload, headers=headers, timeout=20)
    except requests.exceptions.Timeout:
        print("FAIL  request timed out")
        return False
    except requests.exceptions.ConnectionError:
        print("FAIL  connection error (check internet)")
        return False
    except requests.RequestException as exc:
        print(f"FAIL  request exception: {exc}")
        return False

    if response.status_code == 200:
        data = response.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError, TypeError):
            text = "<unreadable response>"

        print("PASS  API key is valid for selected model")
        print(f"INFO  response preview: {text[:120]}")
        return True

    reason, message = parse_error_payload(response)
    reason_text = f" ({reason})" if reason else ""
    print(f"FAIL  HTTP {response.status_code}{reason_text}: {message}")

    if reason == "API_KEY_INVALID" or "api key expired" in message.lower():
        print("HINT  rotate GEMINI_API_KEY in .env and restart backend")
    elif response.status_code == 404:
        print("HINT  selected model is not available for this key/account")
    elif response.status_code == 429:
        print("HINT  rate limit exceeded; retry later or upgrade quota")

    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Gemini API key for one chosen model")
    parser.add_argument(
        "--model",
        default=os.getenv("GEMINI_MODEL", DEFAULT_MODEL),
        help="Model name or friendly label (default: GEMINI_MODEL or gemini-2.5-flash)",
    )
    parser.add_argument(
        "--skip-model-list",
        action="store_true",
        help="Skip listing available generateContent models",
    )
    args = parser.parse_args()

    model = normalize_model_name(args.model)

    print("=" * 72)
    print("Gemini API Key + Model Validation")
    print("=" * 72)

    if not GEMINI_API_KEY:
        print("FAIL  GEMINI_API_KEY not found in environment/.env")
        print("HINT  set GEMINI_API_KEY in .env")
        return 1

    print(f"INFO  configured model: {model}")
    print(f"INFO  api key: {mask_api_key(GEMINI_API_KEY)}")

    if not args.skip_model_list:
        available_models = list_available_generate_models(GEMINI_API_KEY)
        if available_models:
            print(f"INFO  generateContent models available: {len(available_models)}")
            if model in available_models:
                print("INFO  selected model is listed for this key")
            else:
                print("WARN  selected model not present in listed models")

    success = test_key_for_model(GEMINI_API_KEY, model)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
