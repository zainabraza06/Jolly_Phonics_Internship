# JollyPhonics Backend & Evaluation API

This repository contains the backend service and machine learning pipeline for JollyPhonics, an interactive phonics learning and pronunciation grading application for children.

The system processes video or audio recordings of children pronouncing phonemes, predicts the spoken phoneme using a custom BiLSTM model, and grades pronunciation accuracy by comparing features against high-quality reference recordings.

---

## 🚀 Features & Architecture

1. **Dual Run Modes**:
   - **Local Mode**: Runs instantly out-of-the-box by loading assets (`best_model.pth` and accuracy evaluation tensors) locally from the filesystem. No internet connection or remote downloads needed.
   - **Remote/Production Mode (Render)**: Automatically detects when running in cloud environments (via environment variable `HF_REPO_ID`), then dynamically downloads and caches model files on demand from Hugging Face Hub.

2. **Combined Audio Pronunciation Scoring**:
   Rather than comparing pronunciation to a single "incorrect" sample (which varies from child to child), we evaluate pronunciation quality through a weighted composite metric:
   - **Reference Similarity (60% weight)**: Cosine similarity between the child's mean-pooled Whisper features and the ideal target reference recording (scaled from `[0.5, 1.0]` to `[0, 100]`).
   - **Model Prediction Confidence (40% weight)**: The BiLSTM classifier's softmax probability for the correct phoneme class (scaled from `[0.5, 1.0]` to `[0, 100]`).
   - **Mismatch Protection**: If the predicted phoneme does not match the user's selected phoneme, the score drops to `0` and a mismatch message is returned.

3. **Robust Media Processing**:
   Accepts standard audio formats as well as video file inputs (`.mp4`, `.mov`), extracting and normalizing the audio track to 16 kHz mono WAV via MoviePy and PyDub prior to feature extraction.

---

## 📁 Repository Structure

```
Phenome_Classification_model/
├── backend/                       # FastAPI application
│   ├── main.py                    # Main API entrypoint & endpoints
│   ├── sound_model.py             # Inference-only BiLSTM model architecture
│   ├── feature_extractor.py       # Whisper feature extractor wrapper
│   ├── render.yaml                # Render Infrastructure-as-Code config
│   ├── requirements.txt           # Python dependencies
│   ├── config.py                  # API settings configuration
│   ├── run.py                     # Uvicorn bootrunner
│   └── utils/
│       └── extract.py             # Media extraction helpers (video -> audio)
├── Model_API/                     # Local model directory (contains best_model.pth)
├── accuracy/                      # Local evaluation data
│   ├── Reference/                 # Ideal target phoneme feature tensors (.pt)
│   └── Incorrect/                 # Baseline incorrect phoneme tensors (.pt)
├── start_backend.bat              # Local Windows boot helper
└── README.md                      # Comprehensive guide
```

---

## 🛠️ Local Setup Instructions

### Prerequisites
- Python 3.8 - 3.10 (Recommended: **3.10**)
- **FFmpeg** installed and added to your System PATH (required for MoviePy and PyDub)

### Setup Steps
1. **Unzip/Clone** the repository and open a terminal inside the project root directory.
2. Change directory into the backend folder:
   ```bash
   cd backend
   ```
3. Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
4. Upgrade pip and install all required libraries:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
5. Start the backend locally:
   ```bash
   python main.py
   ```
   The application will start on `http://127.0.0.1:8000`. You can test the health check endpoint:
   ```bash
   curl http://127.0.0.1:8000/health
   ```
   Response: `{"status":"healthy","message":"JollyPhonics backend is running"}`

---

## ☁️ Deployment Guide (Render)

We use **Hugging Face Hub** to host the heavy model assets (~105MB total) so that they do not bloat our Git repository size or exceed Render's slug limit constraints.

### 1. Model Repository (Hugging Face)
All necessary assets are hosted at:
👉 **[zainabraza06/phenome_classfication](https://huggingface.co/zainabraza06/phenome_classfication)**

Files structure inside the HF repository:
```
best_model.pth
accuracy/Reference/C.pt
accuracy/Reference/G.pt
... (other Reference/Incorrect .pt files)
```

### 2. Render Deployment Setup
We use the Infrastructure-as-Code configuration file `backend/render.yaml` to deploy to Render:
1. Push this code repository to your GitHub account.
2. Go to your **Render Dashboard** → **Blueprints** → **New Blueprint Instance**.
3. Select your repository.
4. Render will automatically detect `render.yaml` and configure:
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `HF_REPO_ID` = `zainabraza06/phenome_classfication` (preconfigured)
     - `HF_TOKEN` = (Optional: only needed if the Hugging Face repo is set to private)

---

## 📊 API Endpoint Documentation

### `POST /predict/`
Submits a pronunciation video or audio file for prediction and grading.

- **Parameters (Multipart Form)**:
  - `file`: The media file (e.g., child's recorded speech video `.mp4` or audio `.wav`).
  - `user_phenome`: The expected phoneme the child was trying to say (e.g., `G`, `ai`, `qu`).

- **Example Request (cURL)**:
  ```bash
  curl -X POST "http://127.0.0.1:8000/predict/" \
       -F "file=@child_pronunciation.mp4" \
       -F "user_phenome=G"
  ```

- **Example Response (Success / Match)**:
  ```json
  {
    "predicted_phoneme": "G",
    "user_phoneme": "G",
    "audio_score": 84,
    "is_correct": true
  }
  ```

- **Example Response (Mismatch)**:
  ```json
  {
    "predicted_phoneme": "C",
    "user_phoneme": "G",
    "audio_score": 0,
    "is_correct": false,
    "mismatch_message": "You selected 'G' but your pronunciation sounded more like 'C'"
  }
  ```

---

## 🔧 Troubleshooting

- **ModuleNotFoundError: No module named 'torchaudio'**:
  Ensure you have activated your virtual environment before running the installation or boot commands.
- **FFmpeg not found**:
  Make sure FFmpeg is installed and added to the environment variables on the host machine.
- **Render deployment timeout/cold-start**:
  Because we are using the free tier of Render, the server goes to sleep after 15 minutes of inactivity. When it wakes up, it must re-download the model from Hugging Face Hub, which takes about 30-45 seconds for the very first request. This is normal on free-tier hosting.
