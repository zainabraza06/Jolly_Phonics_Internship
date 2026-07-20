"""
Mapping between the model's training labels and the phoneme names the
clients send and display.

The model was trained on verbose folder-derived labels
("s first letter of gp 01"). Every client -- the Next.js frontend, the
phonicnest frontend, and the mobile app -- speaks the short chip names
("s", "c/k", ...). All translation lives here so the model's vocabulary
never leaks into the API surface.
"""

# Short client-facing name -> training label. This is a bijection: the
# seven chips in the UI correspond exactly to the seven model classes.
PHONEME_TO_LABEL = {
    "ai":  "ai first letter of gp 04",
    "c/k": "c-k first letter of group 02",
    "g":   "g first letter of gp 03",
    "qu":  "qu first letter of gp 07",
    "s":   "s first letter of gp 01",
    "y":   "y first letter of gp 06",
    "z":   "z first letter of gp 05",
}

LABEL_TO_PHONEME = {label: name for name, label in PHONEME_TO_LABEL.items()}

# Accepted spellings for each chip. Clients have historically sent "c-k",
# "ck" and "C" for the c/k chip, so those are tolerated on input.
_ALIASES = {
    "c-k": "c/k",
    "ck":  "c/k",
    "c":   "c/k",
    "k":   "c/k",
}


def to_label(phoneme: str) -> str | None:
    """Client phoneme name -> training label, or None if unrecognised."""
    if not phoneme:
        return None
    key = phoneme.strip().lower()
    key = _ALIASES.get(key, key)
    return PHONEME_TO_LABEL.get(key)


def to_phoneme(label: str | None) -> str | None:
    """Training label -> short client-facing name."""
    if label is None:
        return None
    return LABEL_TO_PHONEME.get(label, label)


def known_phonemes() -> list[str]:
    return sorted(PHONEME_TO_LABEL)
