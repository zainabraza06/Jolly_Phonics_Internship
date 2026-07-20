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
    BACKEND_DIR / "models"))

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


def ensure_model_assets():
    """Ensure model.pth and reference_stats.pkl are present.
    If missing, downloads them from Hugging Face Hub.
    """
    MODEL_EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    required_files = {
        "model.pth": MODEL_WEIGHTS,
        "reference_stats.pkl": REF_STATS_PATH,
    }
    missing = [name for name, path in required_files.items() if not path.exists() or path.stat().st_size == 0]
    if missing:
        repo_id = os.getenv("HF_REPO_ID", "zainabraza06/phenome_classfication")
        token = os.getenv("HF_TOKEN")
        print(f"Downloading missing model assets {missing} from Hugging Face Hub: {repo_id}...")
        try:
            from huggingface_hub import hf_hub_download
            import shutil
            for name in missing:
                dest = required_files[name]
                temp_path = hf_hub_download(
                    repo_id=repo_id,
                    filename=name,
                    token=token,
                    cache_dir=str(HF_CACHE_DIR)
                )
                shutil.copy(temp_path, dest)
                print(f"Successfully downloaded and copied {name} to {dest}")
        except Exception as e:
            print(f"Failed to download from Hugging Face Hub: {e}")
            if "model.pth" in missing:
                raise FileNotFoundError(
                    f"Could not load required model weights model.pth locally or from Hugging Face Hub. "
                    "Please verify HF_REPO_ID is correct and the file exists."
                ) from e


def load_model_config() -> dict:
    """Read the exported config and check it against the constants above.

    A mismatch means the checkpoint was trained with different feature
    geometry than this code produces, which yields confident nonsense
    rather than an error -- so it is worth surfacing loudly.
    """
    ensure_model_assets()
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
