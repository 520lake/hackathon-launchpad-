from datetime import timedelta, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select, SQLModel
from pydantic import EmailStr
import uuid
import random
import logging

from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_session
from app.models.user import User, UserCreate, UserRead, VerificationCode
from app.core.security import get_password_hash, verify_password
from app.core.services import WeChatService, EmailService

router = APIRouter()
logger = logging.getLogger(__name__)

class EmailCodeRequest(SQLModel):
    email: EmailStr

class EmailLoginRequest(SQLModel):
    email: EmailStr
    code: str

@router.post("/login/access-token")
def login_access_token(
    session: Session = Depends(get_session), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.hashed_password:
        raise HTTPException(status_code=400, detail="User has no password set (try WeChat/Email login)")

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserRead)
def register_user(
    *,
    session: Session = Depends(get_session),
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in
    """
    print(f"DEBUG: Registering user {user_in.email}")
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user_data = user_in.dict(exclude={"password"})
    hashed_password = get_password_hash(user_in.password) if user_in.password else None
    user = User(**user_data, hashed_password=hashed_password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

# --- Email Auth ---

@router.post("/email-code")
async def send_email_code(
    email_req: EmailCodeRequest,
    session: Session = Depends(get_session)
):
    # Rate limit check could go here
    code = EmailService.generate_code()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    vc = VerificationCode(email=email_req.email, code=code, expires_at=expires_at)
    session.add(vc)
    session.commit()
    
    await EmailService.send_verification_code(email_req.email, code)
    # For hackathon/demo purposes, return the code directly so user can login without checking logs
    return {"message": "Verification code sent", "code": code}

@router.post("/login/email")
def login_email(
    login_req: EmailLoginRequest,
    session: Session = Depends(get_session)
):
    # Verify code
    vc = session.exec(select(VerificationCode).where(
        VerificationCode.email == login_req.email,
        VerificationCode.code == login_req.code,
        VerificationCode.is_used == False,
        VerificationCode.expires_at > datetime.utcnow()
    )).first()
    
    if not vc:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    
    vc.is_used = True
    session.add(vc)
    
    # Check if user exists
    user = session.exec(select(User).where(User.email == login_req.email)).first()
    if not user:
        # Auto-register
        user = User(email=login_req.email, is_active=True, is_verified=False)
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        session.commit()
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email
    }

# --- WeChat Auth ---

@router.get("/wechat/callback")
async def wechat_callback_verify(
    signature: str,
    timestamp: str,
    nonce: str,
    echostr: str
):
    logger.info(f"WeChat verify: signature={signature}, timestamp={timestamp}, nonce={nonce}, echostr={echostr}")
    # Sort token, timestamp, nonce
    if WeChatService.verify_signature(signature, timestamp, nonce):
        logger.info("WeChat verify success")
        return Response(content=echostr, media_type="text/plain")
    else:
        logger.error("WeChat verify failed")
        raise HTTPException(status_code=403, detail="Signature verification failed")

@router.post("/wechat/callback")
async def wechat_callback_event(request: Request):
    signature = request.query_params.get("signature")
    timestamp = request.query_params.get("timestamp")
    nonce = request.query_params.get("nonce")
    
    if signature and timestamp and nonce:
        if not WeChatService.verify_signature(signature, timestamp, nonce):
             logger.warning("Signature verification failed for WeChat callback")
             # We might want to return 403, but for debugging/mock, we log it.
             # In production, strict verification is better.
    
    body = await request.body()
    xml_str = body.decode("utf-8")
    WeChatService.handle_xml_message(xml_str)
    return Response(content="success", media_type="text/plain")

@router.get("/test/login")
def test_login_scan(scene_id: str, openid: str):
    """
    Simulate a successful scan for debugging.
    """
    WeChatService.handle_scan(scene_id, openid)
    return {"message": "Scan simulated", "scene_id": scene_id, "openid": openid}

@router.get("/wechat/qr")
async def get_wechat_qr():
    # Generate a random scene_id (using int for test account compatibility)
    scene_id = str(random.randint(100000, 999999))
    try:
        qr_url = await WeChatService.get_qr_code(scene_id)
        return {"scene_id": scene_id, "qr_url": qr_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/wechat/poll")
def poll_wechat(scene_id: str, session: Session = Depends(get_session)):
    status_info = WeChatService.check_status(scene_id)
    if status_info and status_info["status"] == "scanned":
        openid = status_info["openid"]
        # Find or create user
        # Note: Using wx_test_openid for test account, but User model has wx_openid. 
        # For simplicity, we store it in wx_openid or wx_test_openid depending on env.
        # Here we map to wx_openid for generic usage.
        user = session.exec(select(User).where(User.wx_openid == openid)).first()
        if not user:
            # Try to find by test openid
             user = session.exec(select(User).where(User.wx_test_openid == openid)).first()
        
        if not user:
             # Create new user
             # If using test account, store in wx_test_openid?
             # Let's just use wx_openid for now to keep it simple, or distinguish based on config.
             user = User(wx_openid=openid, is_active=True)
             session.add(user)
             session.commit()
             session.refresh(user)
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return {
            "status": "success",
            "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
            "token_type": "bearer"
        }
    return {"status": "waiting"}

@router.get("/wechat-mock-scan/{scene_id}")
def mock_wechat_scan(scene_id: str):
    # Simulate a scan event
    fake_openid = f"test_openid_{uuid.uuid4().hex[:8]}"
    WeChatService.handle_scan(scene_id, fake_openid)
    return {"message": "Scanned", "openid": fake_openid}
