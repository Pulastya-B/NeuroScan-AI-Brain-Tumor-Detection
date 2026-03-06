from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database (SQLite by default – works everywhere, no external DB needed)
    DATABASE_URL: str = "sqlite:///./neuroscan.db"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # YOLO Model
    MODEL_PATH: str = "model.pt"
    CONFIDENCE_THRESHOLD: float = 0.25
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = ["jpg", "jpeg", "png", "dcm"]
    
    # App
    APP_NAME: str = "NeuroScan AI"
    DEBUG: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
