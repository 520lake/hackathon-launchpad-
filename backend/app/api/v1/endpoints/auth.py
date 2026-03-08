from datetime import timedelta, datetime
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select, SQLModel, Field
from pydantic import EmailStr
import uuid
import random
import logging

from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_session
from app.models.user import User, UserCreate, UserRead, VerificationCode, InvitationCode
from app.core.security import get_password_hash, verify_password
from app.core.services import WeChatService, EmailService

router = APIRouter()
logger = logging.getLogger(__name__)

class EmailCodeRequest(SQLModel):
    email: EmailStr

class EmailLoginRequest(SQLModel):
    email: EmailStr
    code: str

class VerifyCodeRequest(SQLModel):
    email: EmailStr
    code: str

class RegisterRequest(SQLModel):
    email: EmailStr
    password: str
    full_name: str
    code: str
    invitation_code: Optional[str] = None  # 邀请码（可选）

class ResetPasswordRequest(SQLModel):
    email: EmailStr
    code: str
    password: str

class GenerateInvitationCodeRequest(SQLModel):
    count: int = Field(default=1, ge=1, le=100)
    expires_days: Optional[int] = Field(default=None, ge=1)

class InvitationCodeResponse(SQLModel):
    code: str
    is_used: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

@router.post("/generate-invitation-codes", response_model=List[InvitationCodeResponse])
def generate_invitation_codes(
    req: GenerateInvitationCodeRequest,
    current_user: User = Depends(deps.get_current_active_superuser),
    session: Session = Depends(get_session)
):
    """
    生成邀请码（仅超级管理员可用）
    """
    import secrets
    
    codes = []
    for _ in range(req.count):
        # 生成 8 位随机邀请码
        code = secrets.token_urlsafe(6).upper()
        
        expires_at = None
        if req.expires_days:
            expires_at = datetime.utcnow() + timedelta(days=req.expires_days)
        
        invitation = InvitationCode(
            code=code,
            is_used=False,
            expires_at=expires_at
        )
        session.add(invitation)
        codes.append(invitation)
    
    session.commit()
    
    return codes

@router.get("/users", response_model=List[UserRead])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_superuser),
    session: Session = Depends(get_session)
):
    """
    获取所有用户列表（仅超级管理员可用）
    """
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return users

@router.get("/invitation-codes", response_model=List[InvitationCodeResponse])
def get_invitation_codes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_superuser),
    session: Session = Depends(get_session)
):
    """
    获取所有邀请码（仅超级管理员可用）
    """
    codes = session.exec(select(InvitationCode).offset(skip).limit(limit)).all()
    return codes

@router.post("/generate-invitation-codes", response_model=List[InvitationCodeResponse])
def generate_invitation_codes(
    req: GenerateInvitationCodeRequest,
    current_user: User = Depends(deps.get_current_active_superuser),
    session: Session = Depends(get_session)
):
    """
    生成邀请码（仅超级管理员可用）
    """
    import secrets
    
    codes = []
    for _ in range(req.count):
        # 生成 8 位随机邀请码
        code = secrets.token_urlsafe(6).upper()
        
        expires_at = None
        if req.expires_days:
            expires_at = datetime.utcnow() + timedelta(days=req.expires_days)
        
        invitation = InvitationCode(
            code=code,
            is_used=False,
            expires_at=expires_at
        )
        session.add(invitation)
        codes.append(invitation)
    
    session.commit()
    
    return codes

@router.post("/verify-code")
def verify_code(
    code_req: VerifyCodeRequest,
    session: Session = Depends(get_session)
):
    """
    验证邮箱验证码（用于注册流程）
    """
    # 查找验证码
    vc = session.exec(select(VerificationCode).where(
        VerificationCode.email == code_req.email,
        VerificationCode.code == code_req.code,
        VerificationCode.is_used == False,
        VerificationCode.expires_at > datetime.utcnow()
    )).first()
    
    if not vc:
        raise HTTPException(status_code=400, detail="验证码无效或已过期")
    
    # 验证码有效，但不立即标记为已使用，等注册完成后再标记
    return {"message": "验证码有效"}

@router.post("/register", response_model=UserRead)
def register_user(
    *,
    session: Session = Depends(get_session),
    user_in: RegisterRequest,
) -> Any:
    """
    用户注册（需要验证码）
    """
    print(f"DEBUG: Registering user {user_in.email}")
    
    # 验证验证码
    vc = session.exec(select(VerificationCode).where(
        VerificationCode.email == user_in.email,
        VerificationCode.code == user_in.code,
        VerificationCode.is_used == False,
        VerificationCode.expires_at > datetime.utcnow()
    )).first()
    
    if not vc:
        raise HTTPException(status_code=400, detail="验证码无效或已过期")
    
    # 检查用户是否已存在
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="该邮箱已被注册",
        )
    
    # 验证邀请码（如果提供）
    can_create = False
    if user_in.invitation_code:
        invitation = session.exec(select(InvitationCode).where(
            InvitationCode.code == user_in.invitation_code,
            InvitationCode.is_used == False
        )).first()
        
        if invitation:
            # 邀请码有效，标记为已使用
            invitation.is_used = True
            invitation.used_by_user_id = None  # 先不绑定，等用户创建后再绑定
            session.add(invitation)
            can_create = True
            print(f"DEBUG: Valid invitation code: {user_in.invitation_code}")
        else:
            print(f"DEBUG: Invalid invitation code: {user_in.invitation_code}")
    
    # 创建用户
    user_data = user_in.dict(exclude={"password", "code", "invitation_code"})
    hashed_password = get_password_hash(user_in.password)
    user = User(
        **user_data,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=False,
        can_create_hackathon=can_create,
        invitation_code=user_in.invitation_code if can_create else None
    )
    session.add(user)
    
    # 标记验证码为已使用
    vc.is_used = True
    session.add(vc)
    
    # 如果有邀请码，绑定到用户
    if can_create and user_in.invitation_code:
        invitation = session.exec(select(InvitationCode).where(
            InvitationCode.code == user_in.invitation_code
        )).first()
        if invitation:
            invitation.used_by_user_id = user.id
            session.add(invitation)
    
    session.commit()
    session.refresh(user)
    return user

@router.post("/reset-password")
def reset_password(
    reset_req: ResetPasswordRequest,
    session: Session = Depends(get_session)
):
    """
    重置密码（通过邮箱验证码）
    """
    # 验证验证码
    vc = session.exec(select(VerificationCode).where(
        VerificationCode.email == reset_req.email,
        VerificationCode.code == reset_req.code,
        VerificationCode.is_used == False,
        VerificationCode.expires_at > datetime.utcnow()
    )).first()
    
    if not vc:
        raise HTTPException(status_code=400, detail="验证码无效或已过期")
    
    # 查找用户
    user = session.exec(select(User).where(User.email == reset_req.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 重置密码
    user.hashed_password = get_password_hash(reset_req.password)
    session.add(user)
    
    # 标记验证码为已使用
    vc.is_used = True
    session.add(vc)
    
    session.commit()
    return {"message": "密码重置成功"}

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
        # New user, return user_id without token, frontend will prompt to set password
        return {
            "user_id": user.id,
            "email": user.email,
            "has_password": False
        }
    else:
        session.commit()
        # Existing user, check if has password
        has_password = user.hashed_password is not None and len(user.hashed_password) > 0
        
        # If user already has password, return token directly
        if has_password:
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            return {
                "access_token": security.create_access_token(
                    user.id, expires_delta=access_token_expires
                ),
                "token_type": "bearer",
                "user_id": user.id,
                "email": user.email,
                "has_password": True
            }
        else:
            # User exists but no password set
            return {
                "user_id": user.id,
                "email": user.email,
                "has_password": False
            }

class SetPasswordRequest(SQLModel):
    user_id: str
    password: str

@router.post("/user/set-password")
def set_password(
    password_req: SetPasswordRequest,
    session: Session = Depends(get_session)
):
    user = session.get(User, password_req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.hashed_password and len(user.hashed_password) > 0:
        raise HTTPException(status_code=400, detail="Password already set")
    
    user.hashed_password = get_password_hash(password_req.password)
    session.add(user)
    session.commit()
    
    return {"message": "Password set successfully"}

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

# --- GitHub Auth ---

@router.get("/github")
def github_login():
    """
    Redirect to GitHub OAuth authorization page
    """
    client_id = settings.GITHUB_CLIENT_ID
    redirect_uri = f"{settings.FRONTEND_URL}/auth/github/callback"
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=user:email"
    return {"auth_url": github_auth_url}

class GitHubCallbackRequest(SQLModel):
    code: str

@router.post("/github/callback")
def github_callback(
    callback_req: GitHubCallbackRequest,
    session: Session = Depends(get_session)
):
    """
    Handle GitHub OAuth callback
    """
    import requests
    
    # Exchange code for access token
    token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": callback_req.code,
        }
    )
    
    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get access token from GitHub")
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token received")
    
    # Get user info from GitHub
    user_response = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"token {access_token}"}
    )
    
    if user_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info from GitHub")
    
    github_user = user_response.json()
    github_id = str(github_user.get("id"))
    github_email = github_user.get("email")
    github_name = github_user.get("name") or github_user.get("login")
    github_avatar = github_user.get("avatar_url")
    
    # Get email if not public
    if not github_email:
        emails_response = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"token {access_token}"}
        )
        if emails_response.status_code == 200:
            emails = emails_response.json()
            for email in emails:
                if email.get("primary"):
                    github_email = email.get("email")
                    break
    
    # Find or create user
    user = session.exec(select(User).where(User.github_id == github_id)).first()
    
    if not user:
        # Check if user exists with same email
        if github_email:
            user = session.exec(select(User).where(User.email == github_email)).first()
        
        if not user:
            # Create new user
            user = User(
                github_id=github_id,
                email=github_email,
                full_name=github_name,
                nickname=github_user.get("login"),
                avatar_url=github_avatar,
                is_active=True
            )
        else:
            # Link GitHub to existing user
            user.github_id = github_id
            if not user.avatar_url and github_avatar:
                user.avatar_url = github_avatar
        
        session.add(user)
        session.commit()
        session.refresh(user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email
    }
