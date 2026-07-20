"""
PhonemeGesturePredictor -- the single entry point the API talks to.

Loads the exported fusion checkpoint once and serves classify + score from
one feature-extraction pass. The previous exported inference.py exposed
predict() and score() as independent calls that each re-ran MediaPipe and
Whisper, so grading one upload paid the extraction cost twice; analyse()
below does the work once and derives both results from it.
"""

import json
import logging
import pickle

import numpy as np
import torch

from . import labels as label_map
from .architecture import FusionClassifier
from .config import (LABEL_MAP_PATH, MODEL_WEIGHTS, REF_STATS_PATH,
                     load_model_config)
from .features import (AudioEncoder, ensure_tmp_dir, extract_video_sequence,
                       extract_wav, load_landmark_npy)
from .scoring import Scores, score_against_reference

log = logging.getLogger(__name__)


class Analysis:
    """Everything derived from one upload."""

    def __init__(self, predicted_label, confidence, class_probabilities,
                 audio_pooled, video_pooled):
        self.predicted_label = predicted_label
        self.confidence = confidence
        self.class_probabilities = class_probabilities
        self.audio_pooled = audio_pooled
        self.video_pooled = video_pooled

    @property
    def predicted_phoneme(self):
        return label_map.to_phoneme(self.predicted_label)


class PhonemeGesturePredictor:
    def __init__(self, device=None):
        self.device = torch.device(
            device or ("cuda" if torch.cuda.is_available() else "cpu"))
        load_model_config()   # raises if the export disagrees with our constants

        with open(LABEL_MAP_PATH) as fh:
            maps = json.load(fh)
        self.id_to_label = {int(k): v for k, v in maps["id_to_label"].items()}
        self.num_classes = len(self.id_to_label)

        self.reference_stats = {}
        if REF_STATS_PATH.exists():
            with open(REF_STATS_PATH, "rb") as fh:
                self.reference_stats = pickle.load(fh)
        else:
            log.warning("no reference_stats.pkl at %s -- scoring disabled, "
                        "predictions still work", REF_STATS_PATH)

        self.model = FusionClassifier(num_classes=self.num_classes).to(self.device)
        state = torch.load(MODEL_WEIGHTS, map_location=self.device)
        # Training saved a bare state_dict, but older checkpoints wrapped it.
        if isinstance(state, dict) and "model_state_dict" in state:
            state = state["model_state_dict"]
        self.model.load_state_dict(state)
        self.model.eval()

        self.audio_encoder = AudioEncoder(self.device)
        ensure_tmp_dir()
        log.info("fusion model ready on %s (%d classes)", self.device, self.num_classes)

    # -- feature extraction ---------------------------------------------------
    def _sequences(self, media_path, video_path=None):
        """-> (audio (T,768) tensor, video (64,234) array, true video length)."""
        wav = extract_wav(media_path, ensure_tmp_dir() / "upload.wav")
        audio_seq = self.audio_encoder.extract(wav)

        source = video_path or media_path
        if str(source).lower().endswith(".npy"):
            video_seq, video_len = load_landmark_npy(source)
        else:
            video_seq, video_len = extract_video_sequence(source)
        return audio_seq, video_seq, video_len

    # -- inference ------------------------------------------------------------
    def analyse(self, media_path, video_path=None) -> Analysis:
        """Run one extraction pass and classify. Scoring reuses the result."""
        audio_seq, video_seq, video_len = self._sequences(media_path, video_path)

        audio_x = audio_seq.float().unsqueeze(0).to(self.device)
        video_x = torch.from_numpy(video_seq).float().unsqueeze(0).to(self.device)
        audio_lengths = torch.tensor([audio_x.shape[1]])
        video_lengths = torch.tensor([video_len])   # true length, not the pad width

        with torch.no_grad():
            logits = self.model(video_x, video_lengths, audio_x, audio_lengths)
            probs = torch.sigmoid(logits).squeeze(0).cpu().numpy()

        pred_id = int(probs.argmax())
        return Analysis(
            predicted_label=self.id_to_label[pred_id],
            confidence=round(float(probs[pred_id]) * 100, 2),
            class_probabilities={self.id_to_label[i]: round(float(p) * 100, 2)
                                 for i, p in enumerate(probs)},
            audio_pooled=audio_seq.numpy().mean(axis=0),
            video_pooled=video_seq[:video_len].mean(axis=0),
        )

    def score(self, analysis: Analysis, label: str, group: str = "child") -> Scores:
        """Score a completed analysis against `group`'s reference for `label`."""
        reference = self.reference_stats.get(group, {}).get(label)
        if reference is None:
            log.warning("no %s reference for %r -- scores unavailable", group, label)
        return score_against_reference(
            analysis.audio_pooled, analysis.video_pooled, reference)

    def available_references(self, group: str = "child") -> list[str]:
        return sorted(self.reference_stats.get(group, {}))
