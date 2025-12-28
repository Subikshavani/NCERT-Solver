import requests
import json

def test_api():
    url = "http://localhost:8000/chat"
    payload = {
        "query": "What is photosynthesis?",
        "grade": "10"
    }
    
    print(f"Connecting to {url}...")
    try:
        response = requests.post(url, json=payload, timeout=60)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
