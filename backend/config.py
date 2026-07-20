import os
from typing import List


class Settings:
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Phonics Backend"
    VERSION: str = "2.0.0"

    # CORS Settings — hardcoded safe defaults.
    # Add extra origins at runtime via the BACKEND_CORS_ORIGINS env var
    # (comma-separated, e.g. "https://example.com,https://other.com").
    _DEFAULT_CORS_ORIGINS: List[str] = [
        # Local development
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
        "exp://localhost:19000",
        "exp://10.7.40.174:19000",
        # Production frontends
        "https://jolly-phonics-internship.vercel.app",
        "https://medwalee.com",
        "https://www.medwalee.com",
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
        """Merge hardcoded defaults with any origins set via env var."""
        origins = list(cls._DEFAULT_CORS_ORIGINS)
        env_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
        if env_origins.strip():
            for origin in env_origins.split(","):
                origin = origin.strip()
                if origin and origin not in origins:
                    origins.append(origin)
        return origins


settings = Settings()

