from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import torch
import torch.nn.functional as F
import numpy as np
import os
from sklearn.preprocessing import LabelEncoder

from sound_model import PhonemeClassifier, Config
from feature_extractor import WhisperFeatureExtractor,seed_everything

# ==== Initialize FastAPI ====
app = FastAPI()

# ==== Set seeds for reproducibility ====
import random


seed_everything(42)

# ==== Load Feature Extractor ====
feature_extractor = WhisperFeatureExtractor()

# ==== Load Model ====
model_path = "best_model.pth"
checkpoint = torch.load(model_path, map_location=Config.device,weights_only=False)
label_encoder: LabelEncoder = checkpoint["label_encoder"]

model = PhonemeClassifier(
    input_dim=768,
    num_classes=len(label_encoder.classes_),
    config=Config
).to(Config.device)

model.load_state_dict(checkpoint["model_state_dict"])
model.eval()

print(f"🚀 Model loaded with {len(label_encoder.classes_)} classes.")
print(f"🔠 Classes: {label_encoder.classes_}")

# ==== Helper prediction function ====
def predict_single_audio(feature_tensor):
    try:
        # Normalize features
        feature_tensor = (feature_tensor - feature_tensor.mean(0)) / (feature_tensor.std(0) + 1e-7)
        features = feature_tensor.unsqueeze(0).to(Config.device)
        lengths = torch.tensor([feature_tensor.shape[0]]).to(Config.device)

        with torch.no_grad():
            logits = model(features, lengths)
            probs = F.softmax(logits, dim=1).cpu().numpy().squeeze()

        top_idx = np.argmax(probs)
        top_label = label_encoder.inverse_transform([top_idx])[0]
        top_prob = float(probs[top_idx])

        # Console output
        print(f"\n🎙️ Predicted phoneme: **{top_label}** with probability: {top_prob:.4f}")
        print("📊 All class probabilities:")
        for i, prob in enumerate(probs):
            label = label_encoder.inverse_transform([i])[0]
            print(f"  {label}: {prob:.4f}")

        all_probs_dict = {
            label_encoder.inverse_transform([i])[0]: float(prob)
            for i, prob in enumerate(probs)
        }

        return top_label, top_prob, all_probs_dict

    except Exception as e:
        print(f"❌ Inference failed: {e}")
        return None, None, None

# ==== API Endpoint ====
@app.post("/predict/")
async def predict_audio(file: UploadFile = File(...)):
    try:
        UPLOAD_DIR = "uploaded_audios"
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as f:
            f.write(await file.read())

        print(f"✅ File saved at: {file_path}")

        # Feature extraction
        features = feature_extractor.extract(file_path)
        print(f"✅ Features extracted. Shape: {features.shape}")

        # Prediction
        top_label, top_prob, all_probs = predict_single_audio(features)

        if top_label is None:
            return JSONResponse(status_code=500, content={"error": "Model prediction failed."})

        result = {
            "predicted_phoneme": top_label,
            "confidence": top_prob,
            "all_probabilities": all_probs
        }

        return JSONResponse(content=result)

    except Exception as e:
        print(f"❌ Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# ==== Run the app ====
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
