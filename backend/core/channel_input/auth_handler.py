import os

def check_internal_api_auth(bearer_token: str) -> bool:
    """Validates the dashboard's internal request token."""
    secret = os.getenv("INTERNAL_DASHBOARD_SECRET", "default-dev-secret")
    
    if not bearer_token or bearer_token != f"Bearer {secret}":
        return False
    return True
