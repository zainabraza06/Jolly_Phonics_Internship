import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchaudio
from transformers import WhisperProcessor, WhisperModel


import random
import numpy as np
import torch

def seed_everything(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True  
    torch.backends.cudnn.benchmark = False

seed_everything(42)



class WhisperFeatureExtractor:
    def __init__(self, layer_indices=[1, 3, 5, 7, 9]):
        self.layer_indices = layer_indices
        self.processor = WhisperProcessor.from_pretrained("openai/whisper-small")
        self.model = WhisperModel.from_pretrained("openai/whisper-small", output_hidden_states=True)
        self.model.eval()
        self.feature_dim = 768
        self.layer_weights = nn.Parameter(torch.ones(len(layer_indices)), requires_grad=False)
        self.norm = nn.LayerNorm(self.feature_dim)

    def _process_waveform(self, waveform: torch.Tensor, sr: int) -> torch.Tensor:
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)
        if sr != 16000:
            waveform = torchaudio.functional.resample(waveform, orig_freq=sr, new_freq=16000)
        inputs = self.processor(waveform.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")
        with torch.no_grad():
            outputs = self.model.encoder(input_features=inputs.input_features)
            hidden_states = outputs.hidden_states
        selected_layers = [hidden_states[i].squeeze(0) for i in self.layer_indices]
        stacked = torch.stack(selected_layers, dim=0)
        weights = F.softmax(self.layer_weights, dim=0)
        features = torch.sum(weights[:, None, None] * stacked, dim=0)
        return self.norm(features)

    def extract(self, audio_path):
        waveform, sr = torchaudio.load(audio_path)
        return self._process_waveform(waveform, sr)