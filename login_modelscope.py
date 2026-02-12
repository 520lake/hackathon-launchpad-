from modelscope.hub.api import HubApi

token = "ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5"
api = HubApi()
try:
    api.login(token)
    print("ModelScope login successful!")
except Exception as e:
    print(f"ModelScope login failed: {e}")
