"""
Inference-only PhonemeClassifier model architecture.
Stripped of all training utilities (no seaborn/matplotlib/tqdm needed at runtime).
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


# ========== CONFIG ==========
class Config:
    hidden_size = 512
    num_layers = 2
    dropout = 0.5
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ========== MODEL ==========
class PhonemeClassifier(nn.Module):
    def __init__(self, input_dim, num_classes, config):
        super().__init__()
        self.config = config

        self.bilstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=config.hidden_size,
            num_layers=config.num_layers,
            bidirectional=True,
            batch_first=True,
            dropout=config.dropout if config.num_layers > 1 else 0
        )
        self.ln = nn.LayerNorm(config.hidden_size * 2)

        self.attention = nn.Sequential(
            nn.Linear(config.hidden_size * 2, config.hidden_size),
            nn.Tanh(),
            nn.Linear(config.hidden_size, 1, bias=False)
        )

        self.fc = nn.Sequential(
            nn.Linear(config.hidden_size * 2, config.hidden_size),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_size, num_classes)
        )

    def forward(self, x, lengths):
        packed = nn.utils.rnn.pack_padded_sequence(
            x, lengths.cpu(), batch_first=True, enforce_sorted=False
        )
        packed_out, _ = self.bilstm(packed)
        out, _ = nn.utils.rnn.pad_packed_sequence(packed_out, batch_first=True)
        out = self.ln(out)

        attn_weights = F.softmax(self.attention(out).squeeze(-1), dim=1)
        context = torch.bmm(attn_weights.unsqueeze(1), out).squeeze(1)

        return self.fc(context)
