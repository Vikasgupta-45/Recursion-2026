import requests
import json
import traceback

def test_api():
    url = "http://127.0.0.1:8000/api/analyze"
    payload = {
        "twitter_handle": "@testaccount"
    }
    print("Sending request to:", url)
    try:
        response = requests.post(url, json=payload, timeout=120)
        print("Status Code:", response.status_code)
        
        try:
            data = response.json()
            with open("test_api_response.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print("Successfully wrote response to test_api_response.json")
        except Exception as e:
            print("Failed to parse JSON. Raw response:")
            print(response.text[:1000])
            
    except Exception as e:
        print("Exception occurred:")
        traceback.print_exc()

if __name__ == "__main__":
    test_api()
