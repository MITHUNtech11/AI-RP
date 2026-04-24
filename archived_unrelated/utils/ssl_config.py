import ssl
import httpx


def get_http_client_insecure():
    """Create HTTP client that bypasses SSL verification"""
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    return httpx.Client(verify=ssl_context)
