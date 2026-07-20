"""
JollyPhonics backend API.

Serves the phoneme-gesture fusion model. The response contract of
/predict/ is consumed by three clients (nextjs_frontend, frontend/
phonicnest, mobile_app) and must stay stable:

    {predicted_phoneme, user_phoneme, is_correct,
     audio_score, gesture_score, overall_score, mismatch_message?}

Model architecture, feature extraction and scoring live in the `phonics`
package; this module is transport and orchestration only.
"""

import os
# Restrict PyTorch thread limits before loading any models
import torch
torch.set_num_threads(1)
torch.set_num_interop_threads(1)

import logging
import shutil
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from phonics import PhonemeGesturePredictor
from phonics import labels as label_map
from phonics.config import ensure_model_assets

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(name)s: %(message)s",
    datefmt="%H:%M:%S")
log = logging.getLogger("phonics.api")

# Weighting of audio vs gesture in the score shown to the learner.
AUDIO_WEIGHT = 0.5
GESTURE_WEIGHT = 0.5

# Which reference group to score against. Learners are children; "elder"
# holds the adult demonstrator recordings.
DEFAULT_REFERENCE_GROUP = os.getenv("PHONICS_REFERENCE_GROUP", "child")

_predictor: PhonemeGesturePredictor | None = None


def get_predictor() -> PhonemeGesturePredictor:
    """Load the model on first use so import stays cheap and startup fast."""
    global _predictor
    if _predictor is None:
        ensure_model_assets()   # downloads model.pth / reference_stats.pkl if missing
        log.info("loading fusion model ...")
        _predictor = PhonemeGesturePredictor()
    return _predictor


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("PHONICS_EAGER_LOAD", "").lower() in {"1", "true", "yes"}:
        get_predictor()
    yield


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION,
              lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "JollyPhonics backend is running"}


@app.get("/phonemes")
async def list_phonemes():
    """The phoneme vocabulary, so clients need not hardcode the chip list."""
    return {"phonemes": label_map.known_phonemes()}


@app.post("/predict/")
async def predict(file: UploadFile = File(...), user_phenome: str = Form(...)):
    """Grade one video against the phoneme the learner selected.

    `user_phenome` is the client's spelling and is kept in the field name
    for backwards compatibility with the deployed frontends.
    """
    expected_label = label_map.to_label(user_phenome)
    if expected_label is None:
        return JSONResponse(status_code=400, content={
            "error": f"unknown phoneme {user_phenome!r}",
            "known_phonemes": label_map.known_phonemes()})

    workdir = Path(tempfile.mkdtemp(prefix="phonics_upload_"))
    upload_path = workdir / (file.filename or "upload.mp4")
    try:
        with open(upload_path, "wb") as fh:
            shutil.copyfileobj(file.file, fh)
        log.info("scoring %s as %r", upload_path.name, user_phenome)

        predictor = get_predictor()
        analysis = predictor.analyse(upload_path)

        is_correct = analysis.predicted_label == expected_label
        log.info("predicted %r (%.1f%%) -- %s",
                 analysis.predicted_phoneme, analysis.confidence,
                 "match" if is_correct else "mismatch")

        if is_correct:
            scores = predictor.score(analysis, expected_label,
                                     group=DEFAULT_REFERENCE_GROUP)
            audio_score = scores.audio if scores.audio is not None else 0
            gesture_score = scores.gesture
            if gesture_score is not None:
                overall = int(round(AUDIO_WEIGHT * audio_score
                                    + GESTURE_WEIGHT * gesture_score))
            else:
                overall = audio_score
        else:
            # A wrong phoneme scores zero regardless of delivery quality.
            audio_score, gesture_score, overall = 0, 0, 0

        result = {
            "predicted_phoneme": analysis.predicted_phoneme,
            "user_phoneme": user_phenome,
            "is_correct": is_correct,
            "audio_score": audio_score,
            "gesture_score": gesture_score,
            "overall_score": overall,
        }
        if not is_correct:
            result["mismatch_message"] = (
                f"You selected '{user_phenome}' but your pronunciation "
                f"sounded more like '{analysis.predicted_phoneme}'")
        return JSONResponse(content=result)

    except Exception as exc:
        log.exception("prediction failed")
        return JSONResponse(status_code=500, content={"error": str(exc)})
    finally:
        file.file.close()
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST,
                port=int(os.getenv("PORT", settings.PORT)), reload=False)
