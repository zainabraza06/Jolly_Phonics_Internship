"""
retrain_final_checkpoints.py — regenerate ONLY the checkpoints the app
pipeline (unified_pipeline.py) actually needs, instead of rerunning the
full 25-ablation + 5-seed sweep.

Produces, in MODEL_SAVE_ROOT:
  1. checkpoint_cmp_ablation20_fp32_cross_attn_bce_bilstm_attn_epoch30.pth
     -> the fusion model unified_pipeline.py loads (CHECKPOINT_NAME).
  2. ablation9_fp32_audio_only_bce_best.pth
     -> the audio-only baseline (used for the audio-only confusion matrix
        comparison in your original ablation script's Step 4).

Uses the exact same data pipeline, model architecture, hyperparameters,
and normalization as the full ablation script, so the resulting checkpoint
is state-dict-compatible with model_def.py / inference.py / unified_pipeline.py.
"""

import subprocess, sys, os
subprocess.run([sys.executable, "-m", "pip", "install", "-q",
                "transformers", "torchaudio", "hf_transfer",
                "scikit-learn", "pandas", "tqdm"])
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"

from google.colab import drive
drive.mount('/content/drive')

import re, random, hashlib, pickle, time
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchaudio
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from collections import Counter
from sklearn.model_selection import train_test_split
from transformers import WhisperProcessor, WhisperModel
from tqdm import tqdm

# =============================================================================
# CONFIG
# =============================================================================
def seed_everything(seed=42):
    random.seed(seed); np.random.seed(seed)
    torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

seed_everything(42)

ALIGNED_ROOT = "/content/drive/MyDrive/aligned_dataset"
ALIGNED_MANIFEST_PATH = os.path.join(ALIGNED_ROOT, "aligned_manifest.pkl")

OUTPUT_ROOT = "/content/drive/MyDrive/phoneme_gesture_ablations"
CACHE_ROOT = os.path.join(OUTPUT_ROOT, "cache")
AUDIO_CACHE_FP32 = os.path.join(CACHE_ROOT, "whisper_fp32")
HF_CACHE_DIR = "/content/hf_cache"           # local disk, not Drive (see notes in original script)
RESULTS_ROOT = os.path.join(OUTPUT_ROOT, "ablation_results")
MODEL_SAVE_ROOT = os.path.join(OUTPUT_ROOT, "ablation_checkpoints")
for d in [CACHE_ROOT, AUDIO_CACHE_FP32, HF_CACHE_DIR, RESULTS_ROOT, MODEL_SAVE_ROOT]:
    os.makedirs(d, exist_ok=True)

MAX_VIDEO_FRAMES = 64
VIDEO_FEAT_DIM = 234
MAX_AUDIO_FRAMES = 200
NUM_WORKERS = 0   # must stay 0 — Whisper holds native handles unsafe to fork

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# what we're regenerating
FUSION_CONFIG = {"id": 20, "whisper": "fp32", "fusion": "cross_attn",
                  "loss": "bce", "video_arch": "bilstm_attn"}
FUSION_EPOCHS = 30   # fixed epochs, no early stopping (matches original run)

AUDIO_ONLY_CONFIG = {"id": 9, "whisper": "fp32", "fusion": "audio_only",
                      "loss": "bce", "video_arch": "bilstm_attn"}
AUDIO_ONLY_HP = dict(batch_size=32, lr=1e-3, epochs=50, patience=10,
                      optimizer="adamw", weight_decay=1e-4)
FUSION_HP = dict(batch_size=4, lr=5e-4, optimizer="adamw", weight_decay=1e-4)


# =============================================================================
# DATA PAIRING
# =============================================================================
def load_aligned_samples(split):
    with open(ALIGNED_MANIFEST_PATH, "rb") as f:
        data = pickle.load(f)
    manifest = data["manifest"]
    samples = []
    for row in manifest:
        if row["split"] != split:
            continue
        lm_path = os.path.join(ALIGNED_ROOT, split, "landmarks", row["label"], row["landmark_file"])
        au_path = os.path.join(ALIGNED_ROOT, split, "audio", row["label"], row["audio_file"])
        if os.path.exists(lm_path) and os.path.exists(au_path):
            samples.append((au_path, lm_path, row["label"]))
    return samples

def print_class_distribution(samples, title=""):
    cnt = Counter(label for _, _, label in samples)
    print(f"Class distribution {title}:")
    for L in sorted(cnt):
        print(f"  {L}: {cnt[L]}")
    print(f"  Total: {len(samples)}")


# =============================================================================
# VIDEO FEATURES (landmarks pre-extracted, just load + normalize)
# =============================================================================
def load_landmarks(landmark_path):
    return np.load(landmark_path).astype(np.float32)

def normalize_landmarks_sequence(arr):
    T, D = arr.shape
    out = arr.copy()
    pose = arr[:, 126:144].reshape(T, 6, 3)
    l_sh, r_sh = pose[:, 0, :], pose[:, 1, :]
    mid = (l_sh + r_sh) / 2.0
    width = np.linalg.norm((l_sh - r_sh)[:, :2], axis=1)
    width = np.clip(width, 1e-4, None)
    reshaped = out.reshape(T, D // 3, 3)
    reshaped = (reshaped - mid[:, None, :]) / width[:, None, None]
    return reshaped.reshape(T, D).astype(np.float32)


# =============================================================================
# WHISPER AUDIO FEATURES (fp32 only — that's all these two checkpoints need)
# =============================================================================
WHISPER_LOCAL_DIR = os.path.join(HF_CACHE_DIR, "whisper-small-manual")
WHISPER_FILES = [
    "config.json", "generation_config.json", "model.safetensors",
    "preprocessor_config.json", "tokenizer_config.json", "vocab.json",
    "tokenizer.json", "merges.txt", "normalizer.json",
    "added_tokens.json", "special_tokens_map.json",
]

def ensure_whisper_downloaded_manually():
    local_dir = WHISPER_LOCAL_DIR
    drive_backup_dir = os.path.join(CACHE_ROOT, "whisper-small-manual")
    os.makedirs(local_dir, exist_ok=True)
    os.makedirs(drive_backup_dir, exist_ok=True)
    base_url = "https://huggingface.co/openai/whisper-small/resolve/main/"
    for fname in WHISPER_FILES:
        dest = os.path.join(local_dir, fname)
        drive_copy = os.path.join(drive_backup_dir, fname)
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            continue
        if os.path.exists(drive_copy) and os.path.getsize(drive_copy) > 0:
            print(f"  Found {fname} in Drive backup, copying locally...")
            import shutil; shutil.copy(drive_copy, dest); continue
        url = base_url + fname
        print(f"  Downloading {fname} ...")
        result = subprocess.run(["wget", "-q", url, "-O", dest], capture_output=True, text=True)
        if result.returncode != 0 or not os.path.exists(dest) or os.path.getsize(dest) == 0:
            print(f"    WARNING: could not fetch {fname} (often fine, not all models have every file)")
            if os.path.exists(dest) and os.path.getsize(dest) == 0:
                os.remove(dest)
            continue
        import shutil; shutil.copy(dest, drive_copy)
    return local_dir

class WhisperFeatureExtractor:
    def __init__(self, layer_indices=(1, 3, 5, 7, 9)):
        self.layer_indices = list(layer_indices)
        whisper_dir = ensure_whisper_downloaded_manually()
        self.processor = WhisperProcessor.from_pretrained(whisper_dir)
        model = WhisperModel.from_pretrained(whisper_dir, output_hidden_states=True)
        model.eval().to(device)
        self.model = model
        self.run_device = device
        self.feature_dim = 768
        self.layer_weights = nn.Parameter(torch.ones(len(self.layer_indices)), requires_grad=False)
        self.norm = nn.LayerNorm(self.feature_dim)

    def extract(self, audio_path):
        waveform, sr = torchaudio.load(audio_path)
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)
        if sr != 16000:
            waveform = torchaudio.functional.resample(waveform, orig_freq=sr, new_freq=16000)
        inputs = self.processor(waveform.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")
        input_features = inputs.input_features.to(self.run_device)
        with torch.no_grad():
            outputs = self.model.encoder(input_features=input_features)
            hidden_states = outputs.hidden_states
        selected = [hidden_states[i].squeeze(0).cpu() for i in self.layer_indices]
        stacked = torch.stack(selected, dim=0)
        weights = F.softmax(self.layer_weights, dim=0)
        feats = torch.sum(weights[:, None, None] * stacked, dim=0)
        return self.norm(feats)

def get_cached_audio_features(audio_path, extractor, cache_dir):
    h = hashlib.md5(audio_path.encode()).hexdigest() + ".pt"
    cpath = os.path.join(cache_dir, h)
    if os.path.exists(cpath):
        return torch.load(cpath)
    feats = extractor.extract(audio_path)
    torch.save(feats, cpath)
    return feats

def precompute_audio_cache(all_samples, extractor, cache_dir):
    print(f"\nPrecomputing whisper features for {len(all_samples)} unique clips...")
    for audio_path, _, _ in tqdm(all_samples, desc="Whisper-fp32"):
        get_cached_audio_features(audio_path, extractor, cache_dir)


# =============================================================================
# DATASET
# =============================================================================
class FusionDataset(Dataset):
    def __init__(self, samples, label_to_id, audio_extractor, audio_cache_dir):
        self.samples = samples
        self.label_to_id = label_to_id
        self.audio_extractor = audio_extractor
        self.audio_cache_dir = audio_cache_dir

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        audio_path, landmark_path, label = self.samples[idx]
        lm = load_landmarks(landmark_path)
        lm = normalize_landmarks_sequence(lm)
        T, D = lm.shape
        if T > MAX_VIDEO_FRAMES:
            lm = lm[:MAX_VIDEO_FRAMES]; v_len = MAX_VIDEO_FRAMES
        else:
            v_len = T
            if T < MAX_VIDEO_FRAMES:
                pad = np.zeros((MAX_VIDEO_FRAMES - T, D), dtype=np.float32)
                lm = np.vstack([lm, pad])
        video_x = torch.from_numpy(lm).float()

        af = get_cached_audio_features(audio_path, self.audio_extractor, self.audio_cache_dir)
        if af.shape[0] > MAX_AUDIO_FRAMES:
            af = af[:MAX_AUDIO_FRAMES]
        audio_x = af.float()

        y = torch.tensor(self.label_to_id[label], dtype=torch.long)
        return video_x, v_len, audio_x, y, (audio_path, landmark_path)

def fusion_collate_fn(batch):
    video_xs, v_lens, audio_xs, ys, paths = zip(*batch)
    video_x = torch.stack(video_xs)
    v_len = torch.tensor(v_lens)
    a_lens = torch.tensor([a.shape[0] for a in audio_xs])
    max_a = int(a_lens.max())
    audio_x = torch.zeros(len(audio_xs), max_a, audio_xs[0].shape[1])
    for i, a in enumerate(audio_xs):
        audio_x[i, :a.shape[0]] = a
    y = torch.stack(ys)
    return video_x, v_len, audio_x, a_lens, y, paths


# =============================================================================
# MODEL — identical to model_def.py / inference.py
# =============================================================================
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
        pooled = torch.bmm(w.unsqueeze(1), seq).squeeze(1)
        return seq, pooled

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
        if lengths is not None:
            packed = nn.utils.rnn.pack_padded_sequence(x, lengths.cpu(), batch_first=True, enforce_sorted=False)
            out, _ = self.bilstm(packed)
            out, _ = nn.utils.rnn.pad_packed_sequence(out, batch_first=True)
        else:
            out, _ = self.bilstm(x)
        seq = self.ln(out)
        w = F.softmax(self.attention(seq).squeeze(-1), dim=1)
        pooled = torch.bmm(w.unsqueeze(1), seq).squeeze(1)
        return seq, pooled

class CrossAttentionFusion(nn.Module):
    def __init__(self, audio_dim, video_dim, proj_dim=256, dropout=0.2):
        super().__init__()
        self.a_proj = nn.Linear(audio_dim, proj_dim)
        self.v_proj = nn.Linear(video_dim, proj_dim)
        self.a2v_attn = nn.MultiheadAttention(proj_dim, num_heads=4, dropout=dropout, batch_first=True)
        self.v2a_attn = nn.MultiheadAttention(proj_dim, num_heads=4, dropout=dropout, batch_first=True)
        self.ln_a = nn.LayerNorm(proj_dim)
        self.ln_v = nn.LayerNorm(proj_dim)
        self.out_dim = proj_dim * 2

    def forward(self, audio_seq, audio_mask, video_seq, video_mask):
        a = self.a_proj(audio_seq); v = self.v_proj(video_seq)
        v_ctx, _ = self.v2a_attn(query=v, key=a, value=a, key_padding_mask=audio_mask)
        v_ctx = self.ln_v(v_ctx + v)
        a_ctx, _ = self.a2v_attn(query=a, key=v, value=v, key_padding_mask=video_mask)
        a_ctx = self.ln_a(a_ctx + a)
        a_pooled = _masked_mean(a_ctx, audio_mask)
        v_pooled = _masked_mean(v_ctx, video_mask)
        return torch.cat([a_pooled, v_pooled], dim=-1)

def _masked_mean(x, pad_mask):
    valid = (~pad_mask).unsqueeze(-1).float()
    return (x * valid).sum(dim=1) / valid.sum(dim=1).clamp(min=1)

def build_key_padding_mask(lengths, max_len):
    ar = torch.arange(max_len, device=lengths.device).unsqueeze(0)
    return ar >= lengths.unsqueeze(1)

class FusionClassifier(nn.Module):
    """fusion_type: 'cross_attn' or 'audio_only'."""
    def __init__(self, num_classes, fusion_type="cross_attn", video_arch="bilstm_attn", dropout=0.3):
        super().__init__()
        self.fusion_type = fusion_type
        self.video_enc = VideoBiLSTMEncoder()          # only bilstm_attn needed here
        self.audio_enc = AudioBiLSTMEncoder(hidden_size=512, num_layers=2, dropout=0.5)

        if fusion_type == "cross_attn":
            self.cross_attn = CrossAttentionFusion(self.audio_enc.out_dim, self.video_enc.out_dim,
                                                    proj_dim=256, dropout=dropout)
            fused_dim = self.cross_attn.out_dim
        elif fusion_type == "audio_only":
            fused_dim = self.audio_enc.out_dim
        else:
            raise ValueError(fusion_type)

        self.classifier = nn.Sequential(
            nn.Linear(fused_dim, 256), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(256, num_classes))

    def forward(self, video_x, video_len, audio_x, audio_len):
        if self.fusion_type == "audio_only":
            _, a_pooled = self.audio_enc(audio_x, audio_len)
            return self.classifier(a_pooled)

        v_seq, v_pooled = self.video_enc(video_x, video_len)
        a_seq, a_pooled = self.audio_enc(audio_x, audio_len)
        v_mask = build_key_padding_mask(video_len.to(video_x.device), v_seq.shape[1])
        a_mask = build_key_padding_mask(audio_len.to(audio_x.device), a_seq.shape[1])
        fused = self.cross_attn(a_seq, a_mask, v_seq, v_mask)
        return self.classifier(fused)


# =============================================================================
# LOSS
# =============================================================================
def compute_class_weights(samples, label_to_id):
    counts = Counter(label_to_id[label] for _, _, label in samples)
    num_classes = len(label_to_id)
    total = sum(counts.values())
    weights = torch.zeros(num_classes)
    for cid in range(num_classes):
        weights[cid] = total / (num_classes * counts.get(cid, 1))
    return weights

class MultiClassBCELoss(nn.Module):
    def __init__(self, num_classes, class_weights=None):
        super().__init__()
        self.num_classes = num_classes
        self.register_buffer("class_weights", class_weights)

    def forward(self, logits, targets):
        one_hot = F.one_hot(targets, self.num_classes).float()
        bce = F.binary_cross_entropy_with_logits(logits, one_hot, reduction="none")
        if self.class_weights is not None:
            bce = bce * self.class_weights.to(logits.device)[None, :]
        return bce.mean()


# =============================================================================
# TRAIN / EVAL LOOPS
# =============================================================================
def train_epoch(model, loader, optimizer, criterion, clip_grad=True):
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for video_x, v_len, audio_x, a_len, y, _ in tqdm(loader, desc="Train", leave=False):
        video_x, v_len = video_x.to(device), v_len.to(device)
        audio_x, a_len = audio_x.to(device), a_len.to(device)
        y = y.to(device)
        optimizer.zero_grad()
        logits = model(video_x, v_len, audio_x, a_len)
        loss = criterion(logits, y)
        loss.backward()
        if clip_grad:
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        total_loss += loss.item()
        correct += (logits.argmax(1) == y).sum().item()
        total += y.size(0)
    return total_loss / len(loader), correct / total

@torch.no_grad()
def evaluate(model, loader, criterion):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    for video_x, v_len, audio_x, a_len, y, _ in tqdm(loader, desc="Eval", leave=False):
        video_x, v_len = video_x.to(device), v_len.to(device)
        audio_x, a_len = audio_x.to(device), a_len.to(device)
        y = y.to(device)
        logits = model(video_x, v_len, audio_x, a_len)
        loss = criterion(logits, y)
        total_loss += loss.item()
        correct += (logits.argmax(1) == y).sum().item()
        total += y.size(0)
    return total_loss / len(loader), correct / total


# =============================================================================
# TRAIN ROUTINES
# =============================================================================
def train_fusion_fixed_epochs(train_samples, val_samples, label_to_id, extractor, epochs=30):
    """Trains cross-attn + BiLSTM+attn + fp32 + BCE for a FIXED number of
    epochs (no early stopping), saving the checkpoint at the final epoch —
    reproduces checkpoint_cmp_ablation20_fp32_cross_attn_bce_bilstm_attn_epoch30.pth
    """
    seed_everything(42)
    tag = "checkpoint_cmp_ablation20_fp32_cross_attn_bce_bilstm_attn"
    print(f"\n{'='*80}\nTraining {tag} for {epochs} epochs (fixed, no early stop)\n{'='*80}")

    train_ds = FusionDataset(train_samples, label_to_id, extractor, AUDIO_CACHE_FP32)
    val_ds = FusionDataset(val_samples, label_to_id, extractor, AUDIO_CACHE_FP32)

    counts = Counter(label for _, _, label in train_samples)
    sample_weights = [1.0 / counts[label] for _, _, label in train_samples]
    sampler = WeightedRandomSampler(sample_weights, len(sample_weights), replacement=True)

    train_loader = DataLoader(train_ds, batch_size=FUSION_HP["batch_size"], sampler=sampler,
                               num_workers=NUM_WORKERS, collate_fn=fusion_collate_fn)
    val_loader = DataLoader(val_ds, batch_size=FUSION_HP["batch_size"], shuffle=False,
                             num_workers=NUM_WORKERS, collate_fn=fusion_collate_fn)

    num_classes = len(label_to_id)
    model = FusionClassifier(num_classes=num_classes, fusion_type="cross_attn",
                              video_arch="bilstm_attn").to(device)
    class_weights = compute_class_weights(train_samples, label_to_id)
    criterion = MultiClassBCELoss(num_classes, class_weights).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=FUSION_HP["lr"],
                                   weight_decay=FUSION_HP["weight_decay"])
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.7, patience=3)

    history = []
    for epoch in range(1, epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, clip_grad=True)
        val_loss, val_acc = evaluate(model, val_loader, criterion)
        scheduler.step(val_acc)
        history.append({"epoch": epoch, "train_loss": train_loss, "train_acc": train_acc,
                         "val_loss": val_loss, "val_acc": val_acc})
        print(f"[{tag}] Epoch {epoch}/{epochs} TrainLoss={train_loss:.4f} TrainAcc={train_acc:.2%} "
              f"ValLoss={val_loss:.4f} ValAcc={val_acc:.2%} time={time.time()-t0:.1f}s")

    ckpt_path = os.path.join(MODEL_SAVE_ROOT, f"{tag}_epoch{epochs}.pth")
    torch.save(model.state_dict(), ckpt_path)
    pd.DataFrame(history).to_csv(os.path.join(RESULTS_ROOT, f"{tag}_history.csv"), index=False)
    print(f"✓ Saved -> {ckpt_path}")
    return ckpt_path


def train_audio_only_early_stop(train_samples, val_samples, label_to_id, extractor):
    """Reproduces ablation9_fp32_audio_only_bce_best.pth (early stopping)."""
    seed_everything(42)
    tag = "ablation9_fp32_audio_only_bce"
    print(f"\n{'='*80}\nTraining {tag} (early stopping)\n{'='*80}")

    train_ds = FusionDataset(train_samples, label_to_id, extractor, AUDIO_CACHE_FP32)
    val_ds = FusionDataset(val_samples, label_to_id, extractor, AUDIO_CACHE_FP32)

    counts = Counter(label for _, _, label in train_samples)
    sample_weights = [1.0 / counts[label] for _, _, label in train_samples]
    sampler = WeightedRandomSampler(sample_weights, len(sample_weights), replacement=True)

    train_loader = DataLoader(train_ds, batch_size=AUDIO_ONLY_HP["batch_size"], sampler=sampler,
                               num_workers=NUM_WORKERS, collate_fn=fusion_collate_fn)
    val_loader = DataLoader(val_ds, batch_size=AUDIO_ONLY_HP["batch_size"], shuffle=False,
                             num_workers=NUM_WORKERS, collate_fn=fusion_collate_fn)

    num_classes = len(label_to_id)
    model = FusionClassifier(num_classes=num_classes, fusion_type="audio_only").to(device)
    class_weights = compute_class_weights(train_samples, label_to_id)
    criterion = MultiClassBCELoss(num_classes, class_weights).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=AUDIO_ONLY_HP["lr"],
                                   weight_decay=AUDIO_ONLY_HP["weight_decay"])
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.7, patience=3)

    best_val_acc, patience_counter = 0.0, 0
    best_model_path = os.path.join(MODEL_SAVE_ROOT, f"{tag}_best.pth")
    history = []

    for epoch in range(1, AUDIO_ONLY_HP["epochs"] + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, clip_grad=True)
        val_loss, val_acc = evaluate(model, val_loader, criterion)
        scheduler.step(val_acc)
        history.append({"epoch": epoch, "train_loss": train_loss, "train_acc": train_acc,
                         "val_loss": val_loss, "val_acc": val_acc})
        print(f"[{tag}] Epoch {epoch}/{AUDIO_ONLY_HP['epochs']} TrainLoss={train_loss:.4f} "
              f"TrainAcc={train_acc:.2%} ValLoss={val_loss:.4f} ValAcc={val_acc:.2%} "
              f"time={time.time()-t0:.1f}s")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), best_model_path)
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= AUDIO_ONLY_HP["patience"]:
                print(f"[{tag}] Early stopping at epoch {epoch}")
                break

    pd.DataFrame(history).to_csv(os.path.join(RESULTS_ROOT, f"{tag}_history.csv"), index=False)
    print(f"✓ Saved -> {best_model_path} (best val acc={best_val_acc:.2%})")
    return best_model_path


# =============================================================================
# MAIN
# =============================================================================
if __name__ == "__main__":
    print("Loading aligned train/test samples...")
    train_pairs = load_aligned_samples("train")
    test_pairs = load_aligned_samples("test")
    print_class_distribution(train_pairs, "TRAIN (aligned)")
    print_class_distribution(test_pairs, "TEST (aligned)")

    labels_all = [l for _, _, l in train_pairs]
    val_size = max(1, int(0.15 * len(train_pairs)))
    train_idx, val_idx = train_test_split(
        range(len(train_pairs)), test_size=val_size / len(train_pairs),
        stratify=labels_all, random_state=42)
    train_samples = [train_pairs[i] for i in train_idx]
    val_samples = [train_pairs[i] for i in val_idx]

    labels = sorted(set(l for _, _, l in train_samples + val_samples + test_pairs))
    label_to_id = {l: i for i, l in enumerate(labels)}
    print(f"\nClasses ({len(labels)}): {labels}")

    print("\nLoading Whisper fp32 feature extractor...")
    extractor_fp32 = WhisperFeatureExtractor()

    all_samples = train_samples + val_samples + test_pairs
    precompute_audio_cache(all_samples, extractor_fp32, AUDIO_CACHE_FP32)

    # ---- 1. fusion checkpoint (the one unified_pipeline.py needs) ----
    fusion_ckpt_path = train_fusion_fixed_epochs(
        train_samples, val_samples, label_to_id, extractor_fp32, epochs=FUSION_EPOCHS)

    # ---- 2. audio-only baseline checkpoint ----
    audio_ckpt_path = train_audio_only_early_stop(
        train_samples, val_samples, label_to_id, extractor_fp32)

    print("\n" + "=" * 80)
    print("DONE — checkpoints regenerated:")
    print(f"  {fusion_ckpt_path}")
    print(f"  {audio_ckpt_path}")
    print("=" * 80)
    print("\nCHECKPOINT_PATH for unified_pipeline.py / export_model.py:")
    print(f"  {fusion_ckpt_path}")