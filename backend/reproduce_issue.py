import sys
import os
sys.path.append(os.getcwd())

from datetime import timedelta
from app.core.config import settings
from app.core import security
from jose import jwt, JWTError

print("--- REPRODUCTION SCRIPT ---")
print(f"SECRET_KEY: {settings.SECRET_KEY}")
print(f"ALGORITHM: {security.ALGORITHM}")

# 1. Simulate Token Creation (like poll_wechat)
user_id = 13
access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
token = security.create_access_token(user_id, expires_delta=access_token_expires)
print(f"Generated Token: {token}")

# 2. Simulate Token Validation (like deps.py)
try:
    payload = jwt.decode(
        token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
    )
    token_data = payload.get("sub")
    print(f"Decoded sub: {token_data} (Type: {type(token_data)})")
    
    user_id_decoded = int(token_data)
    print(f"Converted user_id: {user_id_decoded}")
    
    if user_id_decoded == user_id:
        print("SUCCESS: Token logic is valid.")
    else:
        print("FAILURE: ID mismatch.")

except Exception as e:
    print(f"FAILURE: Exception: {e}")
