"""
Inference-time model architecture for the phoneme-gesture fusion model.

These definitions must stay byte-compatible with the training script's
classes -- the checkpoint is loaded by state_dict key, so any rename or
shape change here silently breaks loading. Training utilities (loss,
schedulers, dataset) are deliberately absent; this module is import-cheap
and only builds the graph needed to run a forward pass.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

from .config import VIDEO_FEAT_DIM


class AudioBiLSTMEncoder(nn.Module):
    def __init__(self, input_dim=768, hidden_size=512, num_layers=2, dropout=0.5):
        super().__init__()
        self.bilstm = nn.LSTM(input_dim, hidden_size, num_layers,
                              bidirectional=True, batch_first=True,
                              dropout=dropout if num_layers > 1 else 0)
        self.ln = nn.LayerNorm(hidden_size * 2)
        self.attention = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size), nn.Tanh(),
            nn.Linear(hidden_size, 1, bias=False))
        self.out_dim = hidden_size * 2

    def forward(self, x, lengths):
        packed = nn.utils.rnn.pack_padded_sequence(
            x, lengths.cpu(), batch_first=True, enforce_sorted=False)
        out, _ = self.bilstm(packed)
        out, _ = nn.utils.rnn.pad_packed_sequence(out, batch_first=True)
        seq = self.ln(out)
        w = F.softmax(self.attention(seq).squeeze(-1), dim=1)
        return seq, torch.bmm(w.unsqueeze(1), seq).squeeze(1)


class VideoBiLSTMEncoder(nn.Module):
    def __init__(self, input_dim=VIDEO_FEAT_DIM, hidden_size=128, num_layers=1, dropout=0.3):
        super().__init__()
        self.bilstm = nn.LSTM(input_dim, hidden_size, num_layers,
                              bidirectional=True, batch_first=True,
                              dropout=dropout if num_layers > 1 else 0)
        self.ln = nn.LayerNorm(hidden_size * 2)
        self.attention = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size), nn.Tanh(),
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
        a = self.a_proj(audio_seq)
        v = self.v_proj(video_seq)
        v_ctx, _ = self.v2a_attn(query=v, key=a, value=a, key_padding_mask=audio_mask)
        a_ctx, _ = self.a2v_attn(query=a, key=v, value=v, key_padding_mask=video_mask)
        v_ctx = self.ln_v(v_ctx + v)
        a_ctx = self.ln_a(a_ctx + a)
        return torch.cat([self._masked_mean(a_ctx, audio_mask),
                          self._masked_mean(v_ctx, video_mask)], dim=-1)


def build_key_padding_mask(lengths, max_len):
    """True at positions that are padding and must be ignored by attention."""
    device = lengths.device
    return torch.arange(max_len, device=device).unsqueeze(0) >= lengths.unsqueeze(1)


class FusionClassifier(nn.Module):
    """Cross-attention fusion of the audio and video BiLSTM encoders.

    Mirrors the training class with fusion_type="cross_attn" and
    video_arch="bilstm_attn" -- the configuration that produced the
    current best checkpoint.
    """

    def __init__(self, num_classes, proj_dim=256, dropout=0.3):
        super().__init__()
        self.audio_enc = AudioBiLSTMEncoder(hidden_size=512, num_layers=2, dropout=0.5)
        self.video_enc = VideoBiLSTMEncoder(hidden_size=128, num_layers=1)
        self.cross_attn = CrossAttentionFusion(
            self.audio_enc.out_dim, self.video_enc.out_dim,
            proj_dim=proj_dim, dropout=dropout)
        self.classifier = nn.Sequential(
            nn.Linear(self.cross_attn.out_dim, 256), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(256, num_classes))

    def forward(self, video_x, video_len, audio_x, audio_len):
        v_seq, _ = self.video_enc(video_x, video_len)
        a_seq, _ = self.audio_enc(audio_x, audio_len)
        v_mask = build_key_padding_mask(video_len.to(video_x.device), v_seq.shape[1])
        a_mask = build_key_padding_mask(audio_len.to(audio_x.device), a_seq.shape[1])
        return self.classifier(self.cross_attn(a_seq, a_mask, v_seq, v_mask))
