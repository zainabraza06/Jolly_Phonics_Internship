"""
Pronunciation and gesture scoring.

An attempt is scored by comparing its mean-pooled audio and landmark
vectors against a reference recording of the same phoneme, then mapping
the Euclidean distance onto 0-100 through a piecewise-linear curve whose
breakpoints (good / max / bad) were calibrated per class at export time
from the spread of the reference set itself.

NOTE: this is a faithful port of the scoring currently in
model_export/inference.py, so behaviour is unchanged for now. The known
issue that scores read too low is NOT addressed here -- see
docs/scoring-notes.md. Refining the distance metric is tracked separately
and deliberately kept out of the backend port so the two changes can be
evaluated independently.
"""

from dataclasses import dataclass

import numpy as np

# Weighting of audio vs gesture in the combined score.
AUDIO_WEIGHT = 0.6
GESTURE_WEIGHT = 0.4


@dataclass
class Scores:
    audio: int | None
    gesture: int | None
    combined: int | None

    def as_dict(self) -> dict:
        return {"audio_score": self.audio,
                "gesture_score": self.gesture,
                "combined_score": self.combined}


def distance_to_score(dist: float, good: float, max_: float, bad: float) -> int:
    """Piecewise-linear map from distance to a 1-100 score.

    Bands: <=good -> 80-100, <=max -> 50-80, <=bad -> 20-50, beyond -> 1-20.
    """
    if dist <= good:
        value = 80 + 20 * (1 - dist / good)
    elif dist <= max_:
        value = 50 + 30 * (1 - (dist - good) / (max_ - good))
    elif dist <= bad:
        value = 20 + 30 * (1 - (dist - max_) / (bad - max_))
    else:
        value = max(1, 20 * (1 - (dist - bad) / (bad + 1e-8)))
    return int(max(1, min(100, round(value))))


def score_against_reference(audio_pooled: np.ndarray,
                            video_pooled: np.ndarray,
                            reference: dict | None) -> Scores:
    """Score one attempt against a single class's reference stats.

    `reference` is the per-label entry from reference_stats.pkl. Either
    modality may be absent, in which case its score is None and the
    combined score falls back to whichever is available.
    """
    if not reference:
        return Scores(None, None, None)

    audio = gesture = None
    if reference.get("audio_vec") is not None:
        dist = float(np.linalg.norm(audio_pooled - reference["audio_vec"]))
        audio = distance_to_score(dist, reference["audio_good"],
                                  reference["audio_max"], reference["audio_bad"])
    if video_pooled is not None and reference.get("lm_vec") is not None:
        dist = float(np.linalg.norm(video_pooled - reference["lm_vec"]))
        gesture = distance_to_score(dist, reference["lm_good"],
                                    reference["lm_max"], reference["lm_bad"])

    if audio is not None and gesture is not None:
        combined = int(round(AUDIO_WEIGHT * audio + GESTURE_WEIGHT * gesture))
    else:
        combined = audio if audio is not None else gesture
    return Scores(audio, gesture, combined)
