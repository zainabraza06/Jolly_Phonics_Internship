"""
Audio and video feature extraction.

Both extractors reproduce the training pipeline exactly:

  audio  -- Whisper-small encoder, a softmax-weighted sum over hidden
            layers [1,3,5,7,9], then LayerNorm. The layer weights and the
            LayerNorm were *frozen at their initial values* during training
            (nn.Parameter(..., requires_grad=False) and a LayerNorm on a
            plain non-Module class that never reached the optimizer), so
            reconstructing them from defaults here is exact, not an
            approximation.

  video   -- MediaPipe hand/pose/face landmarks -> 234-dim per frame,
            body-relative normalisation, then truncate-or-zero-pad to 64
            frames while reporting the TRUE frame count.

That last point matters. Training (FusionDataset) truncated long clips to
the first 64 frames and zero-padded short ones, passing the real length so
the attention mask covered the padding. The previously exported
inference.py instead resampled the whole clip onto 64 frames with
np.interp and always claimed a length of 64 -- time-warping the gesture and
disabling the mask, so the model saw a distribution it was never trained
on. extract_video_sequence() below follows training.
"""

import subprocess
import urllib.request

import cv2
import mediapipe as mp
import noisereduce as nr
import numpy as np
import soundfile as sf
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchaudio
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from transformers import WhisperModel, WhisperProcessor

from .config import (AUDIO_FEAT_DIM, HF_CACHE_DIR, MAX_AUDIO_FRAMES,
                     MAX_VIDEO_FRAMES, MEDIAPIPE_ASSETS, MOUTH_IDS,
                     MP_MODELS_DIR, POSE_IDS, TMP_DIR, VIDEO_FEAT_DIM,
                     WHISPER_LAYERS, WHISPER_MODEL)


# ---------------------------------------------------------------------------
# Audio
# ---------------------------------------------------------------------------
def extract_wav(media_path, out_wav):
    """Demux to 16 kHz mono PCM and denoise, as training did."""
    out_wav = str(out_wav)
    if str(media_path).lower().endswith(".wav"):
        audio, sr = sf.read(str(media_path))
    else:
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", str(media_path), "-vn", "-acodec", "pcm_s16le",
             "-ar", "16000", "-ac", "1", out_wav],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            raise RuntimeError(
                "ffmpeg failed to extract audio. Is ffmpeg installed and on "
                f"PATH?\n{result.stderr.decode(errors='replace')[-500:]}")
        audio, sr = sf.read(out_wav)
    audio = nr.reduce_noise(y=audio, sr=sr, stationary=True)
    sf.write(out_wav, audio, sr)
    return out_wav


class AudioEncoder:
    """Whisper feature extractor, matching training's WhisperFeatureExtractor."""

    def __init__(self, device):
        self.device = device
        cache = str(HF_CACHE_DIR)
        self.processor = WhisperProcessor.from_pretrained(WHISPER_MODEL, cache_dir=cache)
        model = WhisperModel.from_pretrained(
            WHISPER_MODEL, output_hidden_states=True, cache_dir=cache)
        model.eval().to(device)
        self.model = model
        # Frozen at initialisation during training -- see module docstring.
        self.layer_weights = torch.ones(len(WHISPER_LAYERS), device=device)
        self.norm = nn.LayerNorm(AUDIO_FEAT_DIM).to(device)

    def extract(self, wav_path) -> torch.Tensor:
        """-> (T, 768) float tensor on CPU, truncated to MAX_AUDIO_FRAMES."""
        wav, sr = torchaudio.load(str(wav_path))
        if wav.shape[0] > 1:
            wav = wav.mean(0, keepdim=True)
        if sr != 16000:
            wav = torchaudio.functional.resample(wav, sr, 16000)

        inputs = self.processor(wav.squeeze().numpy(), sampling_rate=16000,
                                return_tensors="pt")
        feats = inputs.input_features.to(self.device)
        with torch.no_grad():
            hidden = self.model.encoder(input_features=feats).hidden_states

        stacked = torch.stack([hidden[i].squeeze(0) for i in WHISPER_LAYERS])
        weights = F.softmax(self.layer_weights, dim=0)
        combined = torch.sum(weights[:, None, None] * stacked, dim=0)
        seq = self.norm(combined).detach()
        if seq.shape[0] > MAX_AUDIO_FRAMES:
            seq = seq[:MAX_AUDIO_FRAMES]
        return seq.cpu()


# ---------------------------------------------------------------------------
# Video
# ---------------------------------------------------------------------------
def ensure_mediapipe_assets():
    MP_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in MEDIAPIPE_ASSETS.items():
        dest = MP_MODELS_DIR / name
        if not dest.exists() or dest.stat().st_size == 0:
            urllib.request.urlretrieve(url, dest)
    return MP_MODELS_DIR


def _open_landmarkers():
    ensure_mediapipe_assets()
    def opts(cls, opt_cls, filename, **kw):
        return cls.create_from_options(opt_cls(
            base_options=mp_python.BaseOptions(
                model_asset_path=str(MP_MODELS_DIR / filename)),
            running_mode=mp_vision.RunningMode.VIDEO, **kw))

    hands = opts(mp_vision.HandLandmarker, mp_vision.HandLandmarkerOptions,
                 "hand_landmarker.task", num_hands=2)
    pose = opts(mp_vision.PoseLandmarker, mp_vision.PoseLandmarkerOptions,
                "pose_landmarker_lite.task")
    face = opts(mp_vision.FaceLandmarker, mp_vision.FaceLandmarkerOptions,
                "face_landmarker.task")
    return hands, pose, face


def normalize_landmarks(arr: np.ndarray) -> np.ndarray:
    """Body-relative normalisation: recentre on the shoulder midpoint and
    scale by shoulder width, so the features are invariant to where the
    speaker stands and how far they are from the camera."""
    T, D = arr.shape
    pose = arr[:, 126:144].reshape(T, 6, 3)
    l_sh, r_sh = pose[:, 0, :], pose[:, 1, :]
    mid = (l_sh + r_sh) / 2.0
    width = np.clip(np.linalg.norm((l_sh - r_sh)[:, :2], axis=1), 1e-4, None)
    out = arr.reshape(T, D // 3, 3)
    out = (out - mid[:, None, :]) / width[:, None, None]
    return out.reshape(T, D).astype(np.float32)


def _fit_to_window(arr: np.ndarray) -> tuple[np.ndarray, int]:
    """Truncate to MAX_VIDEO_FRAMES or zero-pad up to it, exactly as
    training's FusionDataset did. Returns (padded, true_length) -- the true
    length drives the attention mask and must not be faked."""
    T, D = arr.shape
    if T > MAX_VIDEO_FRAMES:
        return arr[:MAX_VIDEO_FRAMES], MAX_VIDEO_FRAMES
    if T < MAX_VIDEO_FRAMES:
        pad = np.zeros((MAX_VIDEO_FRAMES - T, D), dtype=np.float32)
        return np.vstack([arr, pad]).astype(np.float32), T
    return arr, T


def extract_video_sequence(video_path) -> tuple[np.ndarray, int]:
    """-> ((64, 234) float32, true_frame_count)."""
    hands, pose, face = _open_landmarkers()
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"could not open video: {video_path}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    rows, idx = [], 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            ts = int(idx / fps * 1000)

            hand_vec = np.zeros((2, 21, 3), np.float32)
            for h, hand in enumerate(hands.detect_for_video(image, ts).hand_landmarks[:2]):
                for j, lm in enumerate(hand):
                    hand_vec[h, j] = (lm.x, lm.y, lm.z)

            pose_vec = np.zeros((6, 3), np.float32)
            pose_res = pose.detect_for_video(image, ts)
            if pose_res.pose_landmarks:
                for i, pid in enumerate(POSE_IDS):
                    lm = pose_res.pose_landmarks[0][pid]
                    pose_vec[i] = (lm.x, lm.y, lm.z)

            mouth_vec = np.zeros((len(MOUTH_IDS), 3), np.float32)
            face_res = face.detect_for_video(image, ts)
            if face_res.face_landmarks:
                for i, fid in enumerate(MOUTH_IDS):
                    lm = face_res.face_landmarks[0][fid]
                    mouth_vec[i] = (lm.x, lm.y, lm.z)

            rows.append(np.concatenate(
                [hand_vec.flatten(), pose_vec.flatten(), mouth_vec.flatten()]))
            idx += 1
    finally:
        cap.release()
        for landmarker in (hands, pose, face):
            landmarker.close()

    if not rows:
        raise RuntimeError(f"no frames decoded from {video_path}")

    arr = normalize_landmarks(np.stack(rows))
    return _fit_to_window(arr)


def load_landmark_npy(path) -> tuple[np.ndarray, int]:
    """Same treatment for pre-extracted (T, 234) landmark arrays."""
    arr = np.load(str(path)).astype(np.float32)
    if arr.ndim != 2 or arr.shape[1] != VIDEO_FEAT_DIM:
        raise ValueError(
            f"expected (T, {VIDEO_FEAT_DIM}) landmarks, got {arr.shape}")
    return _fit_to_window(normalize_landmarks(arr))


def ensure_tmp_dir():
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    return TMP_DIR
