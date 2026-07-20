import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import numpy as np
import os
from collections import Counter
import json
from pathlib import Path
import seaborn as sns
import matplotlib.pyplot as plt
from tqdm import tqdm
import time

# ========== CONFIG ==========
class Config:
    # Hyperparameters
    batch_size = 32
    learning_rate = 1e-3
    epochs = 50
    hidden_size = 512
    num_layers = 2
    dropout = 0.5
    early_stopping_patience = 10
    weight_decay = 1e-4
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🚀 Using device: {device}")

    # Fixed params
    test_size = 0.15
    val_size = 0.15
    random_state = 42
    num_workers = 0
    max_grad_norm = 1.0
    feature_dir = "whisper_features"

# ========== HELPER FUNCTIONS ==========
def load_feature_files_and_labels(feature_dir):
    print(f"\n🔍 Loading feature files from: {feature_dir}")
    feature_files = []
    labels = []

    for filename in os.listdir(feature_dir):
        if filename.endswith(".pt"):
            label = filename.split("_")[0]
            feature_files.append(os.path.join(feature_dir, filename))
            labels.append(label)

    print(f"✅ Loaded {len(feature_files)} feature files across {len(set(labels))} classes")
    print("📊 Class distribution:", Counter(labels))
    return feature_files, labels

def plot_confusion_matrix(y_true, y_pred, classes):
    print("\n📈 Generating confusion matrix...")
    cm = confusion_matrix(y_true, y_pred, normalize='true')
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='.2f', cmap='Blues',
                xticklabels=classes, yticklabels=classes)
    plt.title('Normalized Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    plt.close()
    print("✅ Confusion matrix saved as 'confusion_matrix.png'")

# ========== DATASET CLASS ==========
class PhonemeDataset(Dataset):
    def __init__(self, feature_files, labels, feature_norm=True):
        self.feature_files = feature_files
        self.labels = labels
        self.feature_norm = feature_norm

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        features = torch.load(self.feature_files[idx])
        if self.feature_norm:
            features = (features - features.mean(0)) / (features.std(0) + 1e-7)
        return features, self.labels[idx]

    @staticmethod
    def collate_fn(batch):
        features, labels = zip(*batch)
        lengths = torch.tensor([f.shape[0] for f in features])
        max_len = max(lengths)
        padded_features = torch.zeros(len(features), max_len, features[0].shape[1])
        for i, f in enumerate(features):
            padded_features[i, :lengths[i]] = f
        return padded_features, torch.LongTensor(labels), lengths

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
            nn.Linear(config.hidden_size, 1, bias=False))

        self.fc = nn.Sequential(
            nn.Linear(config.hidden_size * 2, config.hidden_size),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_size, num_classes))

    def forward(self, x, lengths):
        packed = nn.utils.rnn.pack_padded_sequence(
            x, lengths, batch_first=True, enforce_sorted=False)

        packed_out, _ = self.bilstm(packed)
        out, _ = nn.utils.rnn.pad_packed_sequence(packed_out, batch_first=True)
        out = self.ln(out)

        attn_weights = F.softmax(self.attention(out).squeeze(-1), dim=1)
        context = torch.bmm(attn_weights.unsqueeze(1), out).squeeze(1)

        return self.fc(context)

# ========== TRAINING UTILS ==========
def get_class_weights(labels):
    counts = torch.bincount(torch.LongTensor(labels))
    weights = (1.0 / (counts + 1e-7)) * (len(counts) / counts.sum())
    return weights

def create_sampler(labels):
    weights = get_class_weights(labels)
    sample_weights = weights[labels]
    return WeightedRandomSampler(sample_weights, len(sample_weights), replacement=True)

def train_epoch(model, loader, criterion, optimizer, config):
    model.train()
    total_loss, correct = 0.0, 0
    progress_bar = tqdm(loader, desc="Training", leave=False)

    for features, labels, lengths in progress_bar:
        features, labels = features.to(config.device), labels.to(config.device)

        optimizer.zero_grad()
        outputs = model(features, lengths)
        loss = criterion(outputs, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), config.max_grad_norm)
        optimizer.step()

        total_loss += loss.item()
        correct += (outputs.argmax(1) == labels).sum().item()

        progress_bar.set_postfix({
            'loss': f"{loss.item():.4f}",
            'acc': f"{(outputs.argmax(1) == labels).float().mean().item():.2f}"
        })

    return total_loss / len(loader), 100 * correct / len(loader.dataset)

def evaluate(model, loader, criterion, config):
    model.eval()
    total_loss, correct = 0.0, 0
    all_preds, all_labels = [], []
    progress_bar = tqdm(loader, desc="Evaluating", leave=False)

    with torch.no_grad():
        for features, labels, lengths in progress_bar:
            features, labels = features.to(config.device), labels.to(config.device)

            outputs = model(features, lengths)
            loss = criterion(outputs, labels)

            total_loss += loss.item()
            preds = outputs.argmax(1)
            correct += (preds == labels).sum().item()

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

            progress_bar.set_postfix({
                'loss': f"{loss.item():.4f}",
                'acc': f"{(preds == labels).float().mean().item():.2f}"
            })

    return (total_loss / len(loader),
            100 * correct / len(loader.dataset),
            all_preds, all_labels)

# ========== MAIN TRAINING ==========
def main():
    print("\n🚀 Starting phoneme classification training")
    start_time = time.time()
    config = Config()

    feature_files, phoneme_labels = load_feature_files_and_labels(config.feature_dir)
    label_encoder = LabelEncoder()
    encoded_labels = label_encoder.fit_transform(phoneme_labels)

    X_trainval, X_test, y_trainval, y_test = train_test_split(
        feature_files, encoded_labels,
        test_size=config.test_size,
        stratify=encoded_labels,
        random_state=config.random_state
    )

    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval,
        test_size=config.val_size/(1-config.test_size),
        stratify=y_trainval,
        random_state=config.random_state
    )

    train_dataset = PhonemeDataset(X_train, y_train)
    val_dataset = PhonemeDataset(X_val, y_val)
    test_dataset = PhonemeDataset(X_test, y_test)

    print("\n📊 Dataset Statistics:")
    print(f"  Train set: {len(X_train)} samples")
    print(f"  Validation set: {len(X_val)} samples")
    print(f"  Test set: {len(X_test)} samples")
    print("  Class distribution:", Counter(label_encoder.inverse_transform(y_train)))

    print("\n💪 Initializing model...")
    model = PhonemeClassifier(
        input_dim=768,
        num_classes=len(label_encoder.classes_),
        config=config).to(config.device)

    print(f"  Model parameters: {sum(p.numel() for p in model.parameters()):,}")

    weights = get_class_weights(torch.LongTensor(y_train)).to(config.device)
    criterion = nn.CrossEntropyLoss(weight=weights)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay)

    train_loader = DataLoader(
        train_dataset,
        batch_size=config.batch_size,
        sampler=create_sampler(torch.LongTensor(y_train)),
        num_workers=config.num_workers,
        collate_fn=PhonemeDataset.collate_fn)

    val_loader = DataLoader(
        val_dataset,
        batch_size=config.batch_size,
        shuffle=False,
        num_workers=config.num_workers,
        collate_fn=PhonemeDataset.collate_fn)

    best_val_loss = float('inf')
    patience = 0
    best_epoch = 0

    print("\n🔥 Starting training...")
    for epoch in range(config.epochs):
        print(f"\n⏳ Epoch {epoch+1}/{config.epochs}")
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, config)
        val_loss, val_acc, _, _ = evaluate(model, val_loader, criterion, config)

        print(f"  ↳ Train Loss: {train_loss:.4f} | Acc: {train_acc:.2f}%")
        print(f"  ↳ Val Loss: {val_loss:.4f} | Acc: {val_acc:.2f}%")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience = 0
            best_epoch = epoch + 1
            torch.save({
                'model_state_dict': model.state_dict(),
                'config': vars(config),
                'label_encoder': label_encoder,
                'best_epoch': best_epoch,
            }, "best_model.pth")
            print("  🎯 New best model saved!")
        else:
            patience += 1
            if patience >= config.early_stopping_patience:
                print(f"\n🚩 Early stopping triggered at epoch {epoch+1}")
                break

    print("\n🥺 Running final evaluation...")
    checkpoint = torch.load("best_model.pth", map_location=config.device, weights_only=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    label_encoder = checkpoint['label_encoder']
    best_epoch = checkpoint.get('best_epoch', 'N/A')

    test_loader = DataLoader(
        test_dataset,
        batch_size=config.batch_size,
        num_workers=config.num_workers,
        collate_fn=PhonemeDataset.collate_fn)

    test_loss, test_acc, test_preds, test_labels = evaluate(
        model, test_loader, criterion, config)

    total_time = time.time() - start_time
    print("\n📊 Final Results:")
    print(f"  Best epoch: {best_epoch}")
    print(f"  Test Accuracy: {test_acc:.2f}%")
    print(f"  Test Loss: {test_loss:.4f}")
    print(f"  Total training time: {total_time/60:.2f} minutes")

    print("\n📜 Classification Report:")
    print(classification_report(test_labels, test_preds, target_names=label_encoder.classes_))
    plot_confusion_matrix(test_labels, test_preds, label_encoder.classes_)

    print("\n🎉 Training complete! Best model saved to 'best_model.pth'")

if __name__ == "__main__":
    config = Config()
    main()