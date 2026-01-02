import requests, json

url = 'http://127.0.0.1:8001/chat'
payload = {
    'query': 'What is photosynthesis? Explain simply for grade 6 and give one real-life example.',
    'grade': '6',
    'subject': 'science'
}

try:
    r = requests.post(url, json=payload, timeout=30)
    print('STATUS', r.status_code)
    try:
        print(json.dumps(r.json(), indent=2, ensure_ascii=False))
    except Exception:
        print('NON-JSON RESPONSE:\n', r.text)
except Exception as e:
    print('ERROR:', e)
