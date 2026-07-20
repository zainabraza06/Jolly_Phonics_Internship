# JollyPhonics

An interactive phonics learning platform for children. A learner records themselves saying a phoneme; the system predicts which phoneme was actually spoken and grades both the **pronunciation** and the accompanying **Jolly Phonics hand/body gesture**, returning a 0–100 score.

The project is a monorepo with one backend and three clients:

| Component | Stack | Purpose |
|---|---|---|
| [backend/](backend/) | FastAPI + PyTorch | Model serving, feature extraction, scoring |
| [frontend/](frontend/) | Next.js 16 + React 19 + Firebase | Web app (students, instructors, admins) |
| [mobile_app/](mobile_app/) | Expo / React Native 0.79 | Mobile app |
| [colab/](colab/) | Python scripts | Model training and export |

---

## Table of contents

- [How it works](#how-it-works)
- [The model](#the-model)
- [Scoring](#scoring)
- [Repository layout](#repository-layout)
- [Backend setup](#backend-setup)
- [Frontend setup](#frontend-setup)
- [Mobile app setup](#mobile-app-setup)
- [API reference](#api-reference)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Training and export](#training-and-export)
- [Troubleshooting](#troubleshooting)

---

## How it works

1. A client uploads a short video (or audio file) plus the phoneme the learner *intended* to say.
2. The backend extracts the audio track with ffmpeg and resamples it to 16 kHz mono, then applies stationary noise reduction.
3. **Audio features**: hidden states from layers `[1, 3, 5, 7, 9]` of `openai/whisper-small` (768-dim, up to 200 frames).
4. **Video features**: MediaPipe face-mesh mouth contour (30 landmarks) plus pose landmarks for shoulders, elbows and wrists (234-dim, up to 64 frames).
5. A fusion classifier consumes both streams and predicts one of seven phoneme classes.
6. If the prediction matches the learner's selection, the attempt is scored against calibrated reference statistics. If not, the score is zero and a mismatch message is returned.

All extraction runs **once per upload** — `PhonemeGesturePredictor.analyse()` produces both the classification and the pooled vectors used for scoring, so Whisper and MediaPipe are never run twice for one request.

### Phoneme vocabulary

Seven classes, matching the first letter of Jolly Phonics groups 1–7:

`s` · `c/k` · `g` · `ai` · `z` · `y` · `qu`

Clients send short chip names; the model was trained on verbose folder-derived labels (`"s first letter of gp 01"`). All translation lives in [backend/phonics/labels.py](backend/phonics/labels.py), so the model's vocabulary never leaks into the API surface. Input aliases `c-k`, `ck`, `c` and `k` all resolve to `c/k`.

Clients can fetch the list at runtime from `GET /phonemes` instead of hardcoding it.

---

## The model

A two-branch fusion network ([backend/phonics/architecture.py](backend/phonics/architecture.py)):

- **Audio branch** — 2-layer bidirectional LSTM (hidden 512, dropout 0.5) over Whisper features, with layer norm and additive attention pooling. Output dim 1024.
- **Video branch** — encoder over the MediaPipe landmark sequence (234-dim per frame).
- **Fusion head** — combines both pooled representations and classifies into the seven phoneme classes.

The architecture must stay **byte-compatible with the training script**: the checkpoint is loaded by `state_dict` key, so any rename or shape change silently breaks loading.

Feature geometry constants (Whisper layers, frame caps, landmark indices) live in [backend/phonics/config.py](backend/phonics/config.py) and are duplicated in `models/model_config.json`. `load_model_config()` reads that file and **warns on divergence** rather than letting the two drift apart silently.

### Model assets

Loaded from `backend/models/` (override with `PHONICS_MODEL_DIR`):

```
models/
├── model.pth             # fusion checkpoint
├── label_map.json        # class index -> training label
├── model_config.json     # feature geometry, checked against phonics/config.py
├── reference_stats.pkl   # per-class reference vectors + score breakpoints
└── hf_cache/             # cached openai/whisper-small
```

`model.pth` and `reference_stats.pkl` are **not committed** — they are downloaded from Hugging Face Hub on first use by `ensure_model_assets()`. The model itself is also loaded lazily on the first request, so imports stay cheap and startup is fast. Set `PHONICS_EAGER_LOAD=1` to load at boot instead (better for a warm production instance).

---

## Scoring

Implemented in [backend/phonics/scoring.py](backend/phonics/scoring.py).

An attempt's mean-pooled audio and landmark vectors are compared against a reference recording of the same phoneme. The Euclidean distance is mapped onto 0–100 through a piecewise-linear curve whose breakpoints (`good` / `max` / `bad`) were calibrated **per class** at export time from the spread of the reference set:

| Distance band | Score range |
|---|---|
| ≤ good | 80–100 |
| ≤ max | 50–80 |
| ≤ bad | 20–50 |
| beyond | 1–20 |

The response carries three numbers:

- `audio_score` — pronunciation quality
- `gesture_score` — gesture accuracy (`null` if no face/pose was detected)
- `overall_score` — `0.5 × audio + 0.5 × gesture`, or just `audio_score` when there is no gesture signal

A **wrong phoneme scores zero** on all three regardless of delivery quality.

References are grouped: `child` (default) and `elder` (adult demonstrator recordings). Switch with `PHONICS_REFERENCE_GROUP`.

> **Known issue:** scores currently read low across the board. This is a faithful port of the original `model_export/inference.py` behaviour, kept unchanged so that a scoring refinement can be evaluated independently of the backend port.

---

## Repository layout

```
jollyphonics/
├── backend/
│   ├── main.py                  # FastAPI app — transport and orchestration only
│   ├── config.py                # API settings, CORS whitelist
│   ├── run.py                   # uvicorn bootrunner
│   ├── Dockerfile               # python:3.10-slim + ffmpeg
│   ├── render.yaml              # Render blueprint
│   ├── requirements.txt         # dependency ranges
│   ├── requirements-lock.txt    # exact resolved versions from a known-good env
│   ├── models/                  # model assets (weights gitignored)
│   └── phonics/                 # the model package
│       ├── predictor.py         # PhonemeGesturePredictor — single entry point
│       ├── architecture.py      # inference-time network definition
│       ├── features.py          # Whisper + MediaPipe extraction, ffmpeg helpers
│       ├── scoring.py           # distance -> score mapping
│       ├── labels.py            # chip name <-> training label
│       └── config.py            # feature geometry, paths, HF asset download
├── frontend/                    # Next.js web app
│   ├── app/                     # App Router pages
│   ├── services/api.js          # backend client
│   ├── services/firebase.js     # auth + Firestore
│   └── contexts/                # React context providers
├── mobile_app/                  # Expo / React Native app
│   ├── screens/                 # 17 screens
│   ├── services/api.js          # backend client
│   └── components/AppNavigator.js
├── colab/
│   ├── train.py                 # training script
│   └── evaluate_and_export.py   # evaluation + export of model/reference stats
├── render.yaml                  # root blueprint (baseDir: backend)
└── run.bat / start_*.bat        # Windows dev helpers
```

---

## Backend setup

### Prerequisites

- **Python 3.11 or 3.12** (the Docker image pins 3.10 for Render compatibility)
- **ffmpeg** on `PATH` — a system package, not a pip install
- ~2 GB free disk for Whisper and the checkpoint

### Steps

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt

python main.py
```

The API starts on `http://127.0.0.1:8000`. Verify:

```bash
curl http://127.0.0.1:8000/health
# {"status":"healthy","message":"JollyPhonics backend is running"}
```

Interactive docs are at `http://127.0.0.1:8000/docs`.

To reproduce an exact known-good environment, use `pip install -r requirements-lock.txt` instead.

On Windows, [run.bat](run.bat) and [start_backend.bat](start_backend.bat) wrap these steps.

---

## Frontend setup

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Point it at the backend with a `.env.local`:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

It defaults to `http://localhost:8000` when unset.

Firebase (auth + Firestore) is configured in [frontend/services/firebase.js](frontend/services/firebase.js). Pages: welcome, role selection, signup/login, student / instructor / admin dashboards, tasks, upload-video, progress, and profile editing.

Build for production with `npm run build && npm start`.

---

## Mobile app setup

```bash
cd mobile_app
npm install
npx expo start        # then press a / i, or scan the QR with Expo Go
```

The backend host is set in [mobile_app/services/networkConfig.js](mobile_app/services/networkConfig.js). On a physical device, `localhost` refers to the phone — use your machine's LAN IP (e.g. `http://192.168.1.20:8000`) and make sure that origin is allowed by the backend's CORS settings.

---

## API reference

### `GET /health`

```json
{ "status": "healthy", "message": "JollyPhonics backend is running" }
```

### `GET /phonemes`

Returns the phoneme vocabulary so clients need not hardcode the chip list.

```json
{ "phonemes": ["ai", "c/k", "g", "qu", "s", "y", "z"] }
```

### `POST /predict/`

Grades one recording against the phoneme the learner selected.

**Body** (`multipart/form-data`):

| Field | Type | Description |
|---|---|---|
| `file` | file | Video (`.mp4`, `.mov`, `.avi`, `.mkv`) or audio recording. Max 100 MB. |
| `user_phenome` | string | The phoneme the learner intended, e.g. `g`, `ai`, `c/k` |

> The `user_phenome` spelling is retained for backwards compatibility with the deployed clients.

**Request**

```bash
curl -X POST "http://127.0.0.1:8000/predict/" \
     -F "file=@child_pronunciation.mp4" \
     -F "user_phenome=g"
```

**200 — match**

```json
{
  "predicted_phoneme": "g",
  "user_phoneme": "g",
  "is_correct": true,
  "audio_score": 84,
  "gesture_score": 71,
  "overall_score": 78
}
```

**200 — mismatch**

```json
{
  "predicted_phoneme": "c/k",
  "user_phoneme": "g",
  "is_correct": false,
  "audio_score": 0,
  "gesture_score": 0,
  "overall_score": 0,
  "mismatch_message": "You selected 'g' but your pronunciation sounded more like 'c/k'"
}
```

**400 — unknown phoneme**

```json
{ "error": "unknown phoneme 'x'", "known_phonemes": ["ai", "c/k", "g", "qu", "s", "y", "z"] }
```

**500** — `{ "error": "<message>" }`. Uploads are written to a per-request temp directory that is always cleaned up, including on failure.

> **Response contract:** the `/predict/` shape is consumed by all three clients. Treat added fields as safe and removals or renames as breaking.

---

## Configuration

### Backend environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8000` | Listen port (Render injects this) |
| `HF_REPO_ID` | `zainabraza06/phenome_classfication` | Hugging Face repo holding the model assets |
| `HF_TOKEN` | — | Required only if that repo is private |
| `PHONICS_MODEL_DIR` | `backend/models` | Where model assets live |
| `PHONICS_REFERENCE_GROUP` | `child` | Reference set to score against (`child` / `elder`) |
| `PHONICS_EAGER_LOAD` | unset | `1`/`true`/`yes` loads the model at startup instead of on first request |
| `BACKEND_CORS_ORIGINS` | — | Extra allowed origins, comma-separated |

### CORS

Safe defaults are hardcoded in [backend/config.py](backend/config.py): `localhost:3000`, Expo dev ports (`8081`, `19006`, `19000`), and the deployed frontends. Additional origins are appended (never replaced) via `BACKEND_CORS_ORIGINS`.

### Frontend

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend base URL |

---

## Deployment

### Render (blueprint)

The root [render.yaml](render.yaml) defines the service with `baseDir: backend`:

1. Push the repo to GitHub.
2. Render dashboard → **Blueprints** → **New Blueprint Instance** → select the repo.
3. Render picks up `render.yaml`: Python runtime, `pip install -r requirements.txt`, `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Set `HF_TOKEN` manually in the dashboard if the model repo is private (it is marked `sync: false`).

### Docker

```bash
docker build -t jollyphonics-backend backend/
docker run -p 8000:8000 -e PORT=8000 jollyphonics-backend
```

The image is `python:3.10-slim` with `ffmpeg`, `libsm6` and `libxext6` installed for OpenCV and MoviePy.

### Frontend

The web app deploys to Vercel; `https://jolly-phonics-internship.vercel.app` is already in the backend CORS whitelist. Set `NEXT_PUBLIC_BACKEND_URL` to the deployed backend URL.

### Cold starts

On Render's free tier the service sleeps after 15 minutes of inactivity. The first request after a wake re-downloads model assets from Hugging Face — expect **30–45 seconds**. Subsequent requests are fast.

---

## Training and export

- [colab/train.py](colab/train.py) — trains the fusion model.
- [colab/evaluate_and_export.py](colab/evaluate_and_export.py) — evaluates the checkpoint and exports `model.pth`, `label_map.json`, `model_config.json` and `reference_stats.pkl` (including the per-class score breakpoints). Writes `.xlsx` reports, hence the `openpyxl` dependency.

Upload helpers for pushing assets to Hugging Face Hub: [upload_fusion_to_hf.py](upload_fusion_to_hf.py), [upload_audio_model_to_hf.py](upload_audio_model_to_hf.py).

**If you retrain**, keep [backend/phonics/architecture.py](backend/phonics/architecture.py) in sync with the training script's class definitions, and re-export `model_config.json` so the feature-geometry check keeps passing.

---

## Troubleshooting

**`FileNotFoundError` for `model.pth`** — the HF download failed. Check network access and, if the repo is private, that `HF_TOKEN` is set. The server cannot serve predictions without it.

**`ffmpeg not found` / audio extraction fails** — install ffmpeg and confirm it is on `PATH` (`ffmpeg -version`).

**`ModuleNotFoundError`** — the virtual environment isn't active. Activate it before installing or running.

**Model config divergence warning at startup** — `phonics/config.py` and `models/model_config.json` disagree on feature geometry. Re-export the config from the training run rather than editing one side by hand.

**`gesture_score` is `null`** — MediaPipe found no face or pose in the video (poor lighting, subject out of frame, or an audio-only upload). `overall_score` falls back to `audio_score`.

**CORS errors in the browser or mobile app** — add the origin to `BACKEND_CORS_ORIGINS`. Device testing needs your LAN IP, not `localhost`.

**Slow first request** — expected. The model loads lazily; set `PHONICS_EAGER_LOAD=1` to pay that cost at startup instead.
