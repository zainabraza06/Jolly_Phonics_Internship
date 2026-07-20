import hashlib
import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
from torch.nn.functional import cosine_similarity
import os

# Configuration
MAX_FRAMES = 100
CACHE_ROOT = "landmark_cache"
RESULTS_ROOT = "classification_results"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Create directories
os.makedirs(CACHE_ROOT, exist_ok=True)
os.makedirs(RESULTS_ROOT, exist_ok=True)

# Initialize MediaPipe Holistic
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(
    static_image_mode=True,
    model_complexity=2,
    min_detection_confidence=0.75
)

def extract_landmarks(video_path, downscale=1):
    """
    Extract landmarks from a video using MediaPipe Holistic.
    Args:
        video_path (str): Path to the video file.
        downscale (float): Factor to downscale video frames (default: 1).
    Returns:
        np.ndarray: Array of shape (T, 225) containing landmarks for each frame.
    """
    h = hashlib.md5(video_path.encode()).hexdigest() + ".npy"
    cpath = os.path.join(CACHE_ROOT, h)
    if os.path.exists(cpath):
        return np.load(cpath)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video {video_path}")
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) * downscale)
    hgt = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) * downscale)
    feats = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        small = cv2.resize(frame, (w, hgt))
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        res = holistic.process(rgb)
        arr = np.zeros(225, dtype=np.float32)
        off = 0
        for lm_list, cnt in zip(
            (res.pose_landmarks, res.left_hand_landmarks, res.right_hand_landmarks),
            (33, 21, 21)
        ):
            if lm_list:
                for i, lm in enumerate(lm_list.landmark):
                    arr[off + 3*i] = lm.x
                    arr[off + 3*i+1] = lm.y
                    arr[off + 3*i+2] = lm.z
            off += cnt * 3
        feats.append(arr)
    cap.release()
    if not feats:
        feats = [np.zeros(225, dtype=np.float32)]
    feats = np.stack(feats)
    np.save(cpath, feats)
    return feats

class TemporalBlock(nn.Module):
    """
    Temporal Convolutional Network block with residual connection.
    """
    def __init__(self, n_inputs, n_outputs, kernel_size, dilation, dropout=0.2):
        super(TemporalBlock, self).__init__()
        self.conv1 = nn.Conv1d(n_inputs, n_outputs, kernel_size,
                               padding=0, dilation=dilation)
        self.bn1 = nn.BatchNorm1d(n_outputs)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(dropout)
     
        self.conv2 = nn.Conv1d(n_outputs, n_outputs, kernel_size,
                               padding=0, dilation=dilation)
        self.bn2 = nn.BatchNorm1d(n_outputs)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(dropout)
     
        self.net = nn.Sequential(self.conv1, self.bn1, self.relu1, self.dropout1,
                                 self.conv2, self.bn2, self.relu2, self.dropout2)
        self.downsample = nn.Conv1d(n_inputs, n_outputs, 1) if n_inputs != n_outputs else None
        self.relu = nn.ReLU()
 
    def forward(self, x):
        out = self.net(x)
        res = x if self.downsample is None else self.downsample(x)
     
        t_res = res.size(2)
        t_out = out.size(2)
        if t_out > t_res:
            start = (t_out - t_res) // 2
            out = out[:, :, start:start + t_res]
        elif t_out < t_res:
            pad_left = (t_res - t_out) // 2
            pad_right = t_res - t_out - pad_left
            out = torch.nn.functional.pad(out, (pad_left, pad_right))
     
        return self.relu(out + res)

class TCN(nn.Module):
    """
    Temporal Convolutional Network for video classification and feature extraction.
    """
    def __init__(self, input_size, output_size, num_channels, kernel_size=7, dropout=0.2):
        super(TCN, self).__init__()
        layers = []
        for i in range(len(num_channels)):
            dilation_size = 2 ** i
            in_ch = input_size if i == 0 else num_channels[i-1]
            out_ch = num_channels[i]
            layers.append(TemporalBlock(in_ch, out_ch, kernel_size, dilation_size, dropout))
        self.network = nn.Sequential(*layers)
        self.linear = nn.Linear(num_channels[-1], output_size)
 
    def forward(self, x):
        x = self.network(x)
        x = x.mean(dim=2)
        return self.linear(x)
    
    def extract_features(self, x):
        with torch.no_grad():
            h = self.network(x)
            return h.mean(dim=2)

def build_reference_features(model, label_to_id, reference_paths, device):
    """
    Build and save reference embeddings for each class.
    Args:
        model (TCN): Trained TCN model.
        label_to_id (dict): Mapping of class labels to IDs.
        reference_paths (dict): Mapping of class labels to reference video paths.
        device (torch.device): Device to run the model on.
    """
    model.eval()
    refs = {}
    for label, path in reference_paths.items():
        vid = extract_landmarks(path)
        vid = vid[:MAX_FRAMES]
        pad = np.zeros((MAX_FRAMES - vid.shape[0], vid.shape[1]), dtype=np.float32)
        vid = np.vstack([vid, pad])[None]
        vid = torch.from_numpy(vid).permute(0, 2, 1).to(device)
        feat = model.extract_features(vid)
        refs[label_to_id[label]] = feat.squeeze(0).cpu()
    torch.save(refs, os.path.join(RESULTS_ROOT, "reference_features.pt"))
    print("✅ Saved reference features.")

def compare_with_references(model, results, reference_feats, id_to_label, device):
    """
    Compare test results with reference embeddings and print similarities.
    Args:
        model (TCN): Trained TCN model.
        results (list): List of (path, true_id, pred_id, probs) tuples.
        reference_feats (dict): Mapping of class IDs to reference embeddings.
        id_to_label (dict): Mapping of class IDs to labels.
        device (torch.device): Device to run the model on.
    """
    print("\n🔍 Reference similarities:")
    for path, true_id, pred_id, _ in results:
        lm = extract_landmarks(path)
        lm = lm[:MAX_FRAMES]
        pad = np.zeros((MAX_FRAMES-lm.shape[0], lm.shape[1]), dtype=np.float32)
        seq = np.vstack([lm, pad])[None]
        seq = torch.from_numpy(seq).permute(0, 2, 1).to(device)
        feat = model.extract_features(seq).squeeze(0).cpu()
        sims = {
            id_to_label[cid]: cosine_similarity(feat, ref_feat, dim=0).item()
            for cid, ref_feat in reference_feats.items()
        }
        top3 = sorted(sims.items(), key=lambda x: x[1], reverse=True)[:3]
        print(f"\n· {os.path.basename(path)} true={id_to_label[true_id]} pred={id_to_label[pred_id]}")
        for cls, sim in top3:
            print(f" {cls}: {sim:.4f}")

def get_video_similarity(video_path, model, label_to_id, id_to_label, ref_path, device):
    """
    Compute similarity of a single video to reference embeddings.
    Args:
        video_path (str): Path to the input video.
        model (TCN): Trained TCN model.
        label_to_id (dict): Mapping of class labels to IDs.
        id_to_label (dict): Mapping of class IDs to labels.
        ref_path (str): Path to reference_features.pt file.
        device (torch.device): Device to run the model on.
    Returns:
        dict: Top 3 class labels and their similarity scores.
    """
    if not os.path.exists(ref_path):
        raise FileNotFoundError(f"Reference features not found at {ref_path}")
    reference_feats = torch.load(ref_path, map_location="cpu")
    lm = extract_landmarks(video_path)
    lm = lm[:MAX_FRAMES]
    pad = np.zeros((MAX_FRAMES - lm.shape[0], lm.shape[1]), dtype=np.float32)
    seq = np.vstack([lm, pad])[None]
    seq = torch.from_numpy(seq).permute(0, 2, 1).to(device)
    feat = model.extract_features(seq).squeeze(0).cpu()
    sims = {id_to_label[cid]: cosine_similarity(feat, ref_feat, dim=0).item() for cid, ref_feat in reference_feats.items()}
    top3 = dict(sorted(sims.items(), key=lambda x: x[1], reverse=True)[:3])
    return top3