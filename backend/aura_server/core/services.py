import httpx
import logging
import random
import string
import hashlib
import time
import xml.etree.ElementTree as ET
from typing import Optional, Dict
from aura_server.core.config import settings

logger = logging.getLogger(__name__)

# In-memory storage for WeChat login sessions
# Key: scene_id (ticket), Value: {"openid": str, "status": "scanned"|"confirmed", "timestamp": float}
wechat_sessions: Dict[str, dict] = {}

class EmailService:
    @staticmethod
    def generate_code(length=6) -> str:
        return ''.join(random.choices(string.digits, k=length))

    @staticmethod
    async def send_verification_code(email: str, code: str):
        # Mock sending email
        logger.info(f"============================================")
        logger.info(f"MOCK EMAIL SEND TO {email}: {code}")
        logger.info(f"============================================")
        print(f"MOCK EMAIL SEND TO {email}: {code}") # Print to stdout for visibility
        return True

class WeChatService:
    access_token: Optional[str] = None
    token_expires_at: float = 0

    @classmethod
    async def get_access_token(cls) -> str:
        if cls.access_token and time.time() < cls.token_expires_at:
            return cls.access_token
        
        # Mock or Real implementation
        if settings.WECHAT_APP_ID == "wx_test_appid":
             # If using dummy credentials, return dummy token
             return "dummy_access_token"

        url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={settings.WECHAT_APP_ID}&secret={settings.WECHAT_APP_SECRET}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            data = resp.json()
            if "access_token" in data:
                cls.access_token = data["access_token"]
                cls.token_expires_at = time.time() + data["expires_in"] - 60
                return cls.access_token
            else:
                logger.error(f"Failed to get wechat access token: {data}")
                raise Exception("Failed to get wechat access token")

    @classmethod
    async def get_qr_code(cls, scene_id: str) -> str:
        # User requested 6 digit scene_id, let's ensure we use that or pass it through
        if settings.WECHAT_APP_ID == "wx_test_appid":
            # Return a dummy QR code url or a placeholder
            return f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:8000/api/v1/auth/wechat-mock-scan/{scene_id}"

        token = await cls.get_access_token()
        url = f"https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token={token}"
        
        # Test accounts often only support integer scene_id (QR_SCENE) for temporary QR codes
        # and strict 32-bit integer limits. 
        # User requested 6 digit random number, which fits in integer.
        # But if it is a string (like from uuid), we might need QR_STR_SCENE (if supported) or hash it.
        # Since we generate scene_id as random int in endpoints, it's fine.
        
        payload = {
            "expire_seconds": 600,
            "action_name": "QR_SCENE",
            "action_info": {"scene": {"scene_id": int(scene_id) if scene_id.isdigit() else 123456}}
        }
        
        # If user passes non-digit, try QR_STR_SCENE but test accounts might not support it well.
        if not scene_id.isdigit():
             payload = {
                "expire_seconds": 600,
                "action_name": "QR_STR_SCENE",
                "action_info": {"scene": {"scene_str": scene_id}}
            }
            
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload)
            data = resp.json()
            if "ticket" in data:
                return f"https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket={data['ticket']}"
            else:
                 logger.error(f"Failed to create QR code: {data}")
                 # Fallback for error (e.g. invalid appid) - return a placeholder to avoid frontend crash during debug
                 if "invalid appid" in str(data) or "40013" in str(data):
                     logger.warning("Using invalid AppID, returning mock QR for debug")
                     return f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MockQR_InvalidAppID_{scene_id}"
                 raise Exception(f"Failed to create QR code: {data}")

    @staticmethod
    def verify_signature(signature: str, timestamp: str, nonce: str) -> bool:
        token = settings.WECHAT_TOKEN
        tmp_list = [token, timestamp, nonce]
        tmp_list.sort()
        tmp_str = "".join(tmp_list)
        hash_str = hashlib.sha1(tmp_str.encode('utf-8')).hexdigest()
        return hash_str == signature

    @staticmethod
    def handle_scan(scene_id: str, openid: str):
        wechat_sessions[scene_id] = {
            "openid": openid,
            "status": "scanned",
            "timestamp": time.time()
        }
        logger.info(f"Updated session for scene_id {scene_id}: {wechat_sessions[scene_id]}")

    @staticmethod
    def check_status(scene_id: str) -> Optional[dict]:
        return wechat_sessions.get(scene_id)

    @staticmethod
    def parse_xml(xml_data: str) -> dict:
        root = ET.fromstring(xml_data)
        return {child.tag: child.text for child in root}

    @staticmethod
    def handle_xml_message(xml_data: str):
        try:
            data = WeChatService.parse_xml(xml_data)
            msg_type = data.get("MsgType")
            event = data.get("Event")
            
            logger.info(f"Received WeChat message: {data}")

            if msg_type == "event":
                openid = data.get("FromUserName")
                event_key = data.get("EventKey") # qrscene_123 or 123
                
                scene_id = None
                if event == "subscribe":
                    # When subscribing via QR, EventKey is qrscene_SCENEID
                    if event_key and event_key.startswith("qrscene_"):
                        scene_id = event_key.split("_")[1]
                elif event == "SCAN":
                    # When already subscribed, EventKey is SCENEID (int) or SCENE_STR
                    scene_id = event_key
                
                if scene_id and openid:
                    WeChatService.handle_scan(scene_id, openid)
                    logger.info(f"WeChat scan handled: scene_id={scene_id}, openid={openid}")
        except Exception as e:
            logger.error(f"Error handling WeChat XML message: {e}")
