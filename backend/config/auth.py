"""
Authentication module for API key validation
"""
from fastapi import HTTPException, status
from fastapi.security import APIKeyHeader
from fastapi import Security
from backend.config.settings import API_KEY, REQUIRE_AUTH

# Use FastAPI's APIKeyHeader so OpenAPI can expose a security scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    """
    Verify API key using FastAPI's Security utilities.

    This uses `APIKeyHeader` so the OpenAPI docs will include a security
    scheme and show the lock icon for protected endpoints.
    """
    # If auth is disabled, skip validation
    if not REQUIRE_AUTH:
        return "auth-disabled"

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Authentication required",
                "message": "Missing X-API-Key header. Please provide a valid API key."
            }
        )

    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Invalid API key",
                "message": "The provided API key is incorrect. Please check your credentials."
            }
        )

    return api_key
