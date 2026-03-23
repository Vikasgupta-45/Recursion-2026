from pydantic import BaseModel, HttpUrl
from typing import Optional

class ChannelInputRequest(BaseModel):
    youtube_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    twitter_handle: Optional[str] = None

def validate_input(data: ChannelInputRequest) -> bool:
    """Validates that at least one platform input is provided."""
    if not (data.youtube_url or data.instagram_handle or data.twitter_handle):
        raise ValueError("At least one platform input is required.")
    return True
