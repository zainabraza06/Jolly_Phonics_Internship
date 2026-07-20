"""
inference.py — self-contained inference + scoring module for the
phoneme-gesture recognition model. Copy this file and the model_export/
folder into your app backend.

Usage:
    from inference import PhonemeGesturePredictor
    predictor = PhonemeGesturePredictor("/path/to/model_export")

    result = predictor.predict(wav_path, mp4_or_landmark_path)
    # {"predicted_class": str, "confidence": float, "class_probabilities": {...}}

    scores = predictor.score(wav_path, mp4_or_landmark_path, true_label, group)
    # {"audio_score": int|None, "gesture_score": int|None, "combined_score": int|None}
    # group must be "elder" or "child"
"""

import os, json, pickle
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchaudio
import cv2
import soundfile as sf
import noisereduce as nr
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from transformers import WhisperProcessor, WhisperModel

WHISPER_LAYERS   = [1, 3, 5, 7, 9]
VIDEO_FRAMES     = 64
MAX_AUDIO_FRAMES = 200
VIDEO_FEAT_DIM   = 234
MOUTH_IDS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 185, 40, 39, 37, 0, 267, 269, 270, 409]


class AudioBiLSTMEncoder(nn.Module):
    def __init__(self, input_dim=768, hidden_size=512, num_layers=2, dropout=0.5):
        super().__init__()
        self.bilstm = nn.LSTM(input_dim, hidden_size, num_layers, bidirectional=True,
                               batch_first=True, dropout=dropout if num_layers > 1 else 0)
        self.ln = nn.LayerNorm(hidden_size * 2)
        self.attention = nn.Sequential(nn.Linear(hidden_size * 2, hidden_size), nn.Tanh(),
                                        nn.Linear(hidden_size, 1, bias=False))
        self.out_dim = hidden_size * 2

    def forward(self, x, lengths):
        packed = nn.utils.rnn.pack_padded_sequence(x, lengths.cpu(), batch_first=True, enforce_sorted=False)
        out, _ = self.bilstm(packed)
        out, _ = nn.utils.rnn.pad_packed_sequence(out, batch_first=True)
        seq = self.ln(out)
        w = F.softmax(self.attention(seq).squeeze(-1), dim=1)
        return seq, torch.bmm(w.unsqueeze(1), seq).squeeze(1)


class VideoBiLSTMEncoder(nn.Module):
    def __init__(self, input_dim=VIDEO_FEAT_DIM, hidden_size=128, num_layers=1, dropout=0.3):
        super().__init__()
        self.bilstm = nn.LSTM(input_dim, hidden_size, num_layers, bidirectional=True,
                               batch_first=True, dropout=dropout if num_layers > 1 else 0)
        self.ln = nn.LayerNorm(hidden_size * 2)
        self.attention = nn.Sequential(nn.Linear(hidden_size * 2, hidden_size), nn.Tanh(),
                                        nn.Linear(hidden_size, 1, bias=False))
        self.out_dim = hidden_size * 2

    def forward(self, x, lengths=None):
        out, _ = self.bilstm(x)
        seq = self.ln(out)
        w = F.softmax(self.attention(seq).squeeze(-1), dim=1)
        return seq, torch.bmm(w.unsqueeze(1), seq).squeeze(1)


class CrossAttentionFusion(nn.Module):
    def __init__(self, audio_dim, video_dim, proj_dim=256, num_heads=4, dropout=0.2):
        super().__init__()
        self.a_proj = nn.Linear(audio_dim, proj_dim)
        self.v_proj = nn.Linear(video_dim, proj_dim)
        self.a2v_attn = nn.MultiheadAttention(proj_dim, num_heads, dropout=dropout, batch_first=True)
        self.v2a_attn = nn.MultiheadAttention(proj_dim, num_heads, dropout=dropout, batch_first=True)
        self.ln_a = nn.LayerNorm(proj_dim)
        self.ln_v = nn.LayerNorm(proj_dim)
        self.out_dim = proj_dim * 2

    @staticmethod
    def _masked_mean(x, mask):
        valid = (~mask).unsqueeze(-1).float()
        return (x * valid).sum(1) / valid.sum(1).clamp(min=1)

    def forward(self, audio_seq, audio_mask, video_seq, video_mask):
        a = self.a_proj(audio_seq); v = self.v_proj(video_seq)
        v_ctx, _ = self.v2a_attn(query=v, key=a, value=a, key_padding_mask=audio_mask)
        a_ctx, _ = self.a2v_attn(query=a, key=v, value=v, key_padding_mask=video_mask)
        v_ctx = self.ln_v(v_ctx + v); a_ctx = self.ln_a(a_ctx + a)
        return torch.cat([self._masked_mean(a_ctx, audio_mask), self._masked_mean(v_ctx, video_mask)], dim=-1)


class FusionClassifier(nn.Module):
    def __init__(self, num_classes, proj_dim=256, dropout=0.3):
        super().__init__()
        self.audio_enc = AudioBiLSTMEncoder(hidden_size=512, num_layers=2, dropout=0.5)
        self.video_enc = VideoBiLSTMEncoder(hidden_size=128, num_layers=1)
        self.cross_attn = CrossAttentionFusion(self.audio_enc.out_dim, self.video_enc.out_dim,
                                                proj_dim=proj_dim, dropout=dropout)
        fused_dim = self.cross_attn.out_dim
        self.classifier = nn.Sequential(nn.Linear(fused_dim, 256), nn.ReLU(), nn.Dropout(dropout),
                                         nn.Linear(256, num_classes))

    def forward(self, video_x, video_len, audio_x, audio_len):
        v_seq, _ = self.video_enc(video_x)
        a_seq, _ = self.audio_enc(audio_x, audio_len)
        Tv, Ta = v_seq.shape[1], a_seq.shape[1]
        v_mask = torch.arange(Tv, device=video_x.device).unsqueeze(0) >= video_len.to(video_x.device).unsqueeze(1)
        a_mask = torch.arange(Ta, device=audio_x.device).unsqueeze(0) >= audio_len.to(audio_x.device).unsqueeze(1)
        return self.classifier(self.cross_attn(a_seq, a_mask, v_seq, v_mask))


class PhonemeGesturePredictor:
    def __init__(self, export_dir, device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.export_dir = export_dir

        with open(os.path.join(export_dir, "label_map.json")) as f:
            maps = json.load(f)
        self.label_to_id = maps["label_to_id"]
        self.id_to_label = {int(k): v for k, v in maps["id_to_label"].items()}

        ref_path = os.path.join(export_dir, "reference_stats.pkl")
        self.reference_stats = {}
        if os.path.exists(ref_path):
            with open(ref_path, "rb") as f:
                self.reference_stats = pickle.load(f)  # {"elder": {...}, "child": {...}}

        self.processor = WhisperProcessor.from_pretrained(
            "openai/whisper-small", cache_dir=os.path.join(export_dir, "hf_cache"))
        whisper = WhisperModel.from_pretrained(
            "openai/whisper-small", output_hidden_states=True,
            cache_dir=os.path.join(export_dir, "hf_cache"))
        whisper.eval()
        self.whisper = whisper.to(self.device)
        self.layer_weights = torch.ones(len(WHISPER_LAYERS), device=self.device)
        self.layer_norm = nn.LayerNorm(768).to(self.device)

        self.model = FusionClassifier(num_classes=len(self.label_to_id)).to(self.device)
        ckpt = torch.load(os.path.join(export_dir, "model.pth"), map_location=self.device)
        self.model.load_state_dict(ckpt)
        self.model.eval()

        self._mp_dir = os.path.join(export_dir, "mp_models")
        os.makedirs(self._mp_dir, exist_ok=True)
        self._ensure_mp_models()
        print(f"Model loaded on {self.device} — {len(self.label_to_id)} classes")

    def _ensure_mp_models(self):
        import urllib.request
        files = {
            "hand_landmarker.task": "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            "pose_landmarker_lite.task": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            "face_landmarker.task": "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        }
        for name, url in files.items():
            p = os.path.join(self._mp_dir, name)
            if not os.path.exists(p):
                urllib.request.urlretrieve(url, p)

    # ---- audio ----
    def _clean_wav(self, mp4_or_wav_path, tmp_wav):
        if mp4_or_wav_path.lower().endswith(".wav"):
            audio, sr = sf.read(mp4_or_wav_path)
        else:
            import subprocess
            subprocess.run(["ffmpeg", "-y", "-i", mp4_or_wav_path, "-vn", "-acodec", "pcm_s16le",
                             "-ar", "16000", "-ac", "1", tmp_wav],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            audio, sr = sf.read(tmp_wav)
        audio = nr.reduce_noise(y=audio, sr=sr, stationary=True)
        sf.write(tmp_wav, audio, sr)
        return tmp_wav

    def _extract_audio_sequence(self, wav_path):
        wav, sr = torchaudio.load(wav_path)
        if wav.shape[0] > 1:
            wav = wav.mean(0, keepdim=True)
        if sr != 16000:
            wav = torchaudio.functional.resample(wav, sr, 16000)
        inputs = self.processor(wav.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")
        feats = inputs.input_features.to(self.device)
        with torch.no_grad():
            out = self.whisper.encoder(input_features=feats)
            hidden = out.hidden_states
        selected = [hidden[i].squeeze(0) for i in WHISPER_LAYERS]
        w = F.softmax(self.layer_weights, dim=0)
        combined = torch.sum(w[:, None, None] * torch.stack(selected), dim=0)
        seq = self.layer_norm(combined).detach()
        if seq.shape[0] > MAX_AUDIO_FRAMES:
            seq = seq[:MAX_AUDIO_FRAMES]
        return seq.cpu()

    # ---- video ----
    def _extract_video_sequence(self, video_path):
        hl = mp_vision.HandLandmarker.create_from_options(
            mp_vision.HandLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=os.path.join(self._mp_dir, "hand_landmarker.task")),
                running_mode=mp_vision.RunningMode.VIDEO, num_hands=2))
        pl = mp_vision.PoseLandmarker.create_from_options(
            mp_vision.PoseLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=os.path.join(self._mp_dir, "pose_landmarker_lite.task")),
                running_mode=mp_vision.RunningMode.VIDEO))
        fl = mp_vision.FaceLandmarker.create_from_options(
            mp_vision.FaceLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=os.path.join(self._mp_dir, "face_landmarker.task")),
                running_mode=mp_vision.RunningMode.VIDEO))

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        rows, idx = [], 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            ts = int(idx / fps * 1000)
            hr = hl.detect_for_video(mp_img, ts); pr = pl.detect_for_video(mp_img, ts); fr = fl.detect_for_video(mp_img, ts)
            hv = np.zeros((2, 21, 3), np.float32)
            for i, h_ in enumerate(hr.hand_landmarks[:2]):
                for j, lm in enumerate(h_):
                    hv[i, j] = [lm.x, lm.y, lm.z]
            pv = np.zeros((6, 3), np.float32)
            if pr.pose_landmarks:
                for i, pid in enumerate([11, 12, 13, 14, 15, 16]):
                    lm = pr.pose_landmarks[0][pid]; pv[i] = [lm.x, lm.y, lm.z]
            mv = np.zeros((len(MOUTH_IDS), 3), np.float32)
            if fr.face_landmarks:
                for i, fid in enumerate(MOUTH_IDS):
                    lm = fr.face_landmarks[0][fid]; mv[i] = [lm.x, lm.y, lm.z]
            rows.append(np.concatenate([hv.flatten(), pv.flatten(), mv.flatten()]))
            idx += 1
        cap.release()
        for x in [hl, pl, fl]:
            x.close()

        arr = np.stack(rows) if rows else np.zeros((1, VIDEO_FEAT_DIM), np.float32)
        T, D = arr.shape
        if T != VIDEO_FRAMES:
            src = np.linspace(0, T - 1, T); tgt = np.linspace(0, T - 1, VIDEO_FRAMES)
            out = np.zeros((VIDEO_FRAMES, D), np.float32)
            for d in range(D):
                out[:, d] = np.interp(tgt, src, arr[:, d])
            arr = out
        pose = arr[:, 126:144].reshape(VIDEO_FRAMES, 6, 3)
        mid = (pose[:, 0] + pose[:, 1]) / 2.0
        width = np.linalg.norm((pose[:, 0] - pose[:, 1])[:, :2], axis=1).clip(1e-4)
        out = arr.reshape(VIDEO_FRAMES, D // 3, 3)
        out = (out - mid[:, None, :]) / width[:, None, None]
        return out.reshape(VIDEO_FRAMES, D).astype(np.float32)

    def _load_landmarks_npy(self, lm_path):
        lm = np.load(lm_path).astype(np.float32)
        T, D = lm.shape
        pose = lm[:, 126:144].reshape(T, 6, 3)
        mid = (pose[:, 0] + pose[:, 1]) / 2.0
        width = np.linalg.norm((pose[:, 0] - pose[:, 1])[:, :2], axis=1).clip(1e-4)
        out = lm.reshape(T, D // 3, 3)
        out = (out - mid[:, None, :]) / width[:, None, None]
        lm = out.reshape(T, D).astype(np.float32)
        if T > VIDEO_FRAMES:
            lm = lm[:VIDEO_FRAMES]
        elif T < VIDEO_FRAMES:
            lm = np.vstack([lm, np.zeros((VIDEO_FRAMES - T, D), np.float32)])
        return lm

    def _get_sequences(self, audio_path, video_path_or_npy):
        tmp_wav = os.path.join("/tmp", "predict_tmp.wav")
        wav_path = self._clean_wav(audio_path, tmp_wav)
        audio_seq = self._extract_audio_sequence(wav_path)
        if video_path_or_npy.lower().endswith(".npy"):
            video_seq = self._load_landmarks_npy(video_path_or_npy)
        else:
            video_seq = self._extract_video_sequence(video_path_or_npy)
        return audio_seq, video_seq

    def predict(self, audio_path, video_path_or_npy):
        """audio_path: .wav or .mp4 (audio extracted). video_path_or_npy: .mp4 or pre-extracted (T,234) .npy"""
        audio_seq, video_seq = self._get_sequences(audio_path, video_path_or_npy)
        audio_x = audio_seq.unsqueeze(0).to(self.device)
        video_x = torch.from_numpy(video_seq).float().unsqueeze(0).to(self.device)
        audio_len = torch.tensor([audio_x.shape[1]])
        video_len = torch.tensor([video_x.shape[1]])
        with torch.no_grad():
            logits = self.model(video_x, video_len, audio_x, audio_len)
            probs = torch.sigmoid(logits).squeeze(0).cpu().numpy()
        pred_id = int(probs.argmax())
        class_probs = {self.id_to_label[i]: round(float(p) * 100, 2) for i, p in enumerate(probs)}
        return {
            "predicted_class": self.id_to_label[pred_id],
            "confidence": round(float(probs[pred_id]) * 100, 2),
            "class_probabilities": class_probs,
        }

    @staticmethod
    def _score_one(dist, good, max_, bad):
        if dist <= good:
            v = 80 + 20 * (1 - dist / good)
        elif dist <= max_:
            v = 50 + 30 * (1 - (dist - good) / (max_ - good))
        elif dist <= bad:
            v = 20 + 30 * (1 - (dist - max_) / (bad - max_))
        else:
            v = max(1, 20 * (1 - (dist - bad) / (bad + 1e-8)))
        return max(1, min(100, round(v)))

    def score(self, audio_path, video_path_or_npy, true_label, group="child"):
        """group: 'elder' or 'child'. Returns audio/gesture/combined 0-100 scores
        against that group's reference recordings for true_label."""
        group_stats = self.reference_stats.get(group, {})
        if true_label not in group_stats:
            return {"audio_score": None, "gesture_score": None, "combined_score": None}
        audio_seq, video_seq = self._get_sequences(audio_path, video_path_or_npy)
        audio_pooled = audio_seq.numpy().mean(axis=0)
        video_pooled = video_seq.mean(axis=0)
        s = group_stats[true_label]
        a = g = None
        if s.get("audio_vec") is not None:
            a = self._score_one(float(np.linalg.norm(audio_pooled - s["audio_vec"])),
                                 s["audio_good"], s["audio_max"], s["audio_bad"])
        if s.get("lm_vec") is not None:
            g = self._score_one(float(np.linalg.norm(video_pooled - s["lm_vec"])),
                                 s["lm_good"], s["lm_max"], s["lm_bad"])
        c = round(0.6 * a + 0.4 * g) if (a is not None and g is not None) else (a or g)
        return {"audio_score": a, "gesture_score": g, "combined_score": c}
