from main import analyze_channel
from channel_input.input_validator import ChannelInputRequest
import json

try:
    req = ChannelInputRequest(twitter_handle="@testaccount")
    res = analyze_channel(req)
    
    print("SUCCESS")
    print("performance_drivers:", res['intelligence_insights']['performance_drivers'])
    print("niche_trend:", res['content_metrics']['niche_trend'])
except Exception as e:
    print("ERROR:", str(e))
