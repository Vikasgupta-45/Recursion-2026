import requests
import json

url = "http://localhost:5050/analyze"
payload = {
    "channel_url": "https://www.youtube.com/@ScientificAmerican",
    "genre": "Science",
    "content_focus": "Physics"
}

try:
    response = requests.post(url, json=payload, timeout=120)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
