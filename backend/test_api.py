import requests
import random
import string

def random_string(length=10):
    return ''.join(random.choices(string.ascii_letters, k=length))

email = f"user_{random_string()}@example.com"
password = "password123"
full_name = f"User {random_string()}"

base_url = "http://localhost:8000/api/v1"

print(f"Testing registration with email: {email}")

try:
    # 1. Register
    reg_response = requests.post(f"{base_url}/register", json={
        "email": email,
        "password": password,
        "full_name": full_name
    })
    
    if reg_response.status_code == 200:
        print("✅ Registration successful")
        print(reg_response.json())
    else:
        print(f"❌ Registration failed: {reg_response.status_code}")
        print(reg_response.text)
        exit(1)

    # 2. Login
    login_response = requests.post(f"{base_url}/login/access-token", data={
        "username": email,
        "password": password
    })

    if login_response.status_code == 200:
        print("✅ Login successful")
        token = login_response.json()["access_token"]
        print(f"Token received: {token[:10]}...")
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        exit(1)

except Exception as e:
    print(f"❌ Error: {e}")
