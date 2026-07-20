"""
PhonemeGesturePredictor -- the single entry point the API talks to.

Loads the exported fusion checkpoint once and serves classify + score from
one feature-extraction pass. The previous exported inference.py exposed
predict() and score() as independent calls that each re-ran MediaPipe and
Whisper, so grading one upload paid the extraction cost twice; analyse()
below does the work once and derives both results from it.

Audio-only mode (MODEL_TYPE="audio_only")
-----------------------------------------
Uses best_model.pth / audio_model.pth: a Whisper-small encoder followed by
a BiLSTM + attention + classifier head trained on audio only.  MediaPipe
video extraction is skipped entirely, so predictions work even when the
uploaded file has no useful visual content.

Audio is always passed through noisereduce before feature extraction,
matching the training pipeline.

Fusion mode (MODEL_TYPE="fusion")
----------------------------------
Uses model.pth: full audio + video cross-attention pipeline.  Both Whisper
and MediaPipe run on every upload.
"""

import json
import logging
import pickle

import numpy as np
import torch

from . import labels as label_map
from .architecture import FusionClassifier
from .config import (AUDIO_MODEL_WEIGHTS, LABEL_MAP_PATH, MODEL_TYPE,
                     MODEL_WEIGHTS, REF_STATS_PATH, load_model_config)
from .features import AudioEncoder, ensure_tmp_dir, extract_video_sequence, extract_wav
from .scoring import Scores, score_against_reference

log = logging.getLogger(__name__)


class Analysis:
    """Everything derived from one upload."""

    def __init__(self, predicted_label, confidence, class_probabilities,
                 audio_pooled, video_pooled=None):
        self.predicted_label = predicted_label
        self.confidence = confidence
        self.class_probabilities = class_probabilities
        self.audio_pooled = audio_pooled
        self.video_pooled = video_pooled  # None in audio-only mode

    @property
    def predicted_phoneme(self):
        return label_map.to_phoneme(self.predicted_label)


class PhonemeGesturePredictor:
    def __init__(self, device=None):
        self.device = torch.device(
            device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.mode = MODEL_TYPE   # "audio_only" or "fusion"

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

        self._load_model()
        self.audio_encoder = AudioEncoder(self.device)
        ensure_tmp_dir()
        log.info("predictor ready [mode=%s] on %s (%d classes)",
                 self.mode, self.device, self.num_classes)

    # -- model loading --------------------------------------------------------
    def _load_model(self):
        if self.mode == "audio_only":
            weights_path = AUDIO_MODEL_WEIGHTS
            fusion_type = "audio_only"
            strict = False   # checkpoint also has video_enc.* keys; ignore them
        else:
            weights_path = MODEL_WEIGHTS
            fusion_type = "cross_attn"
            strict = True

        self.model = FusionClassifier(
            num_classes=self.num_classes,
            fusion_type=fusion_type,
        ).to(self.device)

        state = torch.load(weights_path, map_location=self.device, weights_only=False)
        # Training saved a bare state_dict, but older checkpoints wrapped it.
        if isinstance(state, dict) and "model_state_dict" in state:
            state = state["model_state_dict"]

        missing, unexpected = self.model.load_state_dict(state, strict=strict)
        if missing:
            log.warning("Missing keys when loading %s: %s", weights_path.name, missing)
        if unexpected and strict:
            log.warning("Unexpected keys: %s", unexpected)

        self.model.eval()
        log.info("loaded %s from %s", fusion_type, weights_path.name)

    # -- feature extraction ---------------------------------------------------
    def _extract_audio(self, media_path):
        """Extract noise-reduced audio features. Always runs."""
        wav = extract_wav(media_path, ensure_tmp_dir() / "upload.wav")
        return self.audio_encoder.extract(wav)   # (T, 768) on CPU

    def _extract_video(self, media_path, video_path=None):
        """Extract MediaPipe landmark features. Only called in fusion mode."""
        source = video_path or media_path
        return extract_video_sequence(str(source))   # (64, 234), true_len

    # -- inference ------------------------------------------------------------
    def analyse(self, media_path, video_path=None) -> Analysis:
        """Run one extraction pass and classify. Scoring reuses the result."""
        audio_seq = self._extract_audio(media_path)

        audio_x = audio_seq.float().unsqueeze(0).to(self.device)
        audio_lengths = torch.tensor([audio_x.shape[1]])

        if self.mode == "audio_only":
            # Dummy video tensors — FusionClassifier.forward() never reads them
            # when fusion_type="audio_only", but the signature still expects them.
            video_x = torch.zeros(1, 1, 234, device=self.device)
            video_lengths = torch.tensor([1])
            video_pooled = None
        else:
            video_seq, video_len = self._extract_video(media_path, video_path)
            video_x = torch.from_numpy(video_seq).float().unsqueeze(0).to(self.device)
            video_lengths = torch.tensor([video_len])
            video_pooled = video_seq[:video_len].mean(axis=0)

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
            video_pooled=video_pooled,
        )

    def score(self, analysis: Analysis, label: str, group: str = "child") -> Scores:
        """Score a completed analysis against `group`'s reference for `label`."""
        reference = self.reference_stats.get(group, {}).get(label)
        if reference is None:
            log.warning("no %s reference for %r -- scores unavailable", group, label)
        return score_against_reference(
            analysis.audio_pooled,
            analysis.video_pooled,  # None is handled gracefully in scoring
            reference)

    def available_references(self, group: str = "child") -> list[str]:
        return sorted(self.reference_stats.get(group, {}))
