#!/usr/bin/env python
import requests

url = "http://localhost:8000/api/v1/login/access-token"
data = {
    "username": "admin@aura.com",
    "password": "admin123"
}

try:
    response = requests.post(url, data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
