"""
Feature-extraction constants and filesystem paths.

Every value here must match what the model was trained on. They are
duplicated in model_export/model_config.json; load_model_config() reads
that file and warns on divergence rather than letting the two drift
apart silently.
"""

import json
import os
from pathlib import Path

# --- feature geometry (must match training) ---------------------------------
WHISPER_MODEL     = "openai/whisper-small"
WHISPER_LAYERS    = [1, 3, 5, 7, 9]
AUDIO_FEAT_DIM    = 768
MAX_AUDIO_FRAMES  = 200
MAX_VIDEO_FRAMES  = 64          # training's MAX_VIDEO_FRAMES
VIDEO_FEAT_DIM    = 234

# MediaPipe face-mesh indices for the mouth contour, in training order.
MOUTH_IDS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308,
             324, 318, 402, 317, 14, 87, 178, 88, 95, 185, 40, 39, 37,
             0, 267, 269, 270, 409]

# Pose landmarks kept: shoulders, elbows, wrists.
POSE_IDS = [11, 12, 13, 14, 15, 16]

# --- paths ------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BACKEND_DIR.parent

MODEL_EXPORT_DIR = Path(os.getenv(
    "PHONICS_MODEL_DIR",
    PROJECT_DIR / "app_integration" / "model_export"))

MODEL_WEIGHTS   = MODEL_EXPORT_DIR / "model.pth"
LABEL_MAP_PATH  = MODEL_EXPORT_DIR / "label_map.json"
REF_STATS_PATH  = MODEL_EXPORT_DIR / "reference_stats.pkl"
MODEL_CONFIG    = MODEL_EXPORT_DIR / "model_config.json"
HF_CACHE_DIR    = MODEL_EXPORT_DIR / "hf_cache"
MP_MODELS_DIR   = MODEL_EXPORT_DIR / "mp_models"

# Scratch space for ffmpeg output. Uses the OS temp dir so this works on
# Windows as well as Linux containers.
import tempfile
TMP_DIR = Path(tempfile.gettempdir()) / "phonics"

MEDIAPIPE_ASSETS = {
    "hand_landmarker.task":
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
        "hand_landmarker/float16/1/hand_landmarker.task",
    "pose_landmarker_lite.task":
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
        "pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    "face_landmarker.task":
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
        "face_landmarker/float16/1/face_landmarker.task",
}


def load_model_config() -> dict:
    """Read the exported config and check it against the constants above.

    A mismatch means the checkpoint was trained with different feature
    geometry than this code produces, which yields confident nonsense
    rather than an error -- so it is worth surfacing loudly.
    """
    if not MODEL_CONFIG.exists():
        return {}
    with open(MODEL_CONFIG) as fh:
        cfg = json.load(fh)

    expected = {
        "whisper_layers":    WHISPER_LAYERS,
        "audio_max_frames":  MAX_AUDIO_FRAMES,
        "video_frames":      MAX_VIDEO_FRAMES,
        "video_feat_dim":    VIDEO_FEAT_DIM,
    }
    for key, ours in expected.items():
        theirs = cfg.get(key)
        if theirs is not None and theirs != ours:
            raise RuntimeError(
                f"model_config.json says {key}={theirs!r} but this backend is "
                f"built for {ours!r}. The checkpoint and the feature extractor "
                f"disagree -- predictions would be meaningless. Re-export the "
                f"model or update phonics/config.py.")
    return cfg
