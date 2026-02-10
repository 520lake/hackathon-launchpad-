
import secrets
from typing import List, Union
from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, validator
from pydantic_settings import BaseSettings

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
    DATABASE_URL: Union[str, None] = "sqlite:///./vibebuild.db"

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Union[str, None], values: dict[str, any]) -> any:
        if isinstance(v, str):
            return v
        # Fallback to SQLite if Postgres credentials aren't sufficient or if explicitly desired
        # For now, we default to the SQLite URL defined above
        return v 
        
        # Original Postgres logic preserved but commented out for local dev without Docker
        # return PostgresDsn.build(
        #     scheme="postgresql",
        #     username=values.get("POSTGRES_USER"),
        #     password=values.get("POSTGRES_PASSWORD"),
        #     host=values.get("POSTGRES_SERVER"),
        #     path=f"{values.get('POSTGRES_DB') or ''}",
        # ).unicode_string()

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # WeChat
    WECHAT_APP_ID: str = "wx_test_appid"
    WECHAT_APP_SECRET: str = "wx_test_secret"
    WECHAT_TOKEN: str = "vibebuild_token"

    # ModelScope AI
    MODELSCOPE_API_KEY: str = "ms-0767c073-e36b-4ad9-af59-eeb9e4889c16"
    MODELSCOPE_BASE_URL: str = "https://api-inference.modelscope.cn/v1"
    MODELSCOPE_MODEL_NAME: str = "Qwen/Qwen2.5-72B-Instruct"

    # DeepSeek AI (Optional)
    USE_DEEPSEEK: bool = True
    DEEPSEEK_API_KEY: str = "sk-f6d2ee81c3b9426e94f8254c874489d4"
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL_NAME: str = "deepseek-chat"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
# FORCE the key to be this string, ignoring env vars for stability in this demo environment
settings.SECRET_KEY = "aura_hackathon_stable_secret_key_2026_FIXED"
print(f"DEBUG: Config loaded. SECRET_KEY={settings.SECRET_KEY}")
