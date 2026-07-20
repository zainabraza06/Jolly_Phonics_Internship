import os
from typing import List

class Settings:
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Phonics Backend"
    VERSION: str = "2.0.0"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8081",  # Expo development server
        "http://localhost:19006",  # Expo web
        "exp://localhost:19000",   # Expo Go
        "exp://10.7.40.174:19000",  # Expo Go on local network
        "*"  # Allow all origins for development (remove in production)
    ]
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_VIDEO_EXTENSIONS: List[str] = [".mp4", ".mov", ".avi", ".mkv"]
    
    # Model Settings
    AUDIO_MODEL_PATH: str = "ai_models/audio_model/best_model.pth"
    VIDEO_MODEL_PATH: str = "ai_models/video_model/model_checkpoints/Groups_best_model.pth"
    
    @classmethod
    def get_cors_origins(cls) -> List[str]:
        return cls.BACKEND_CORS_ORIGINS

settings = Settings()
