
import os
import secrets
from typing import List, Union
from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, validator
from pydantic_settings import BaseSettings

# Resolve backend/ root relative to this file (config.py → core/ → app/ → backend/)
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DEFAULT_SQLITE_URL = f"sqlite:///{os.path.join(_BACKEND_DIR, 'data', 'vibebuild.db')}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aura API"
    API_V1_STR: str = "/api/v1"
    # Use a stable key for hackathon demo to persist sessions across restarts
    # FORCE the key to be this string, ignoring env vars for stability in this demo environment
    SECRET_KEY: str = "aura_hackathon_stable_secret_key_2026_FIXED"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "changethis"
    POSTGRES_DB: str = "vibebuild"
    DATABASE_URL: Union[str, None] = None

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Union[str, None], values: dict[str, any]) -> any:
        if isinstance(v, str):
            return v

        # Only build PostgreSQL URL if POSTGRES_SERVER is a real host (not the Docker default "db")
        pg_server = values.get("POSTGRES_SERVER")
        if pg_server and pg_server != "db" and values.get("POSTGRES_USER") and values.get("POSTGRES_PASSWORD"):
            return PostgresDsn.build(
                scheme="postgresql",
                username=values.get("POSTGRES_USER"),
                password=values.get("POSTGRES_PASSWORD"),
                host=pg_server,
                path=f"/{values.get('POSTGRES_DB') or ''}",
            ).unicode_string()

        return _DEFAULT_SQLITE_URL

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # WeChat
    WECHAT_APP_ID: str = "wx_test_appid"
    WECHAT_APP_SECRET: str = "wx_test_secret"
    WECHAT_TOKEN: str = "vibebuild_token"

    # ModelScope AI — set keys via environment variables or .env file
    MODELSCOPE_API_KEY: str = ""
    MODELSCOPE_BASE_URL: str = "https://api-inference.modelscope.cn/v1"
    MODELSCOPE_MODEL_NAME: str = "Qwen/Qwen2.5-72B-Instruct"

    # DeepSeek AI (Optional)
    USE_DEEPSEEK: bool = True
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL_NAME: str = "deepseek-chat"
    
    # SiliconFlow (硅基流动) AI - Image Generation
    SILICONFLOW_API_KEY: str = ""
    SILICONFLOW_BASE_URL: str = "https://api.siliconflow.cn/v1"
    SILICONFLOW_IMAGE_MODEL: str = "black-forest-labs/FLUX.1-schnell"
    
    # GitHub OAuth
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        case_sensitive = True
        env_file = "../.env"

settings = Settings()
