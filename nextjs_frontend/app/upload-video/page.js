'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { progressService } from '../../services/firebase';
import apiService from '../../services/api';

const PHONEMES = ['ai', 'y', 'z', 'g', 's', 'c/k', 'qu'];

// SVG circular progress ring
function ScoreRing({ score = 0, label = '', size = 90, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ * (1 - pct / 100);
  const color = pct >= 80 ? '#4CAF50' : pct >= 60 ? '#FF9800' : pct >= 40 ? '#FFC107' : '#F44336';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} stroke="#EAEAEA" strokeWidth={stroke} fill="none" />
          <circle
            cx={size/2} cy={size/2} r={r}
            stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'row', gap: '1px',
        }}>
          <span style={{ fontSize: size >= 110 ? '22px' : '18px', fontWeight: '800', color }}>{pct}</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#888', marginTop: '4px' }}>%</span>
        </div>
      </div>
      <span style={{ fontSize: '12px', color: '#555', fontWeight: '600', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

// Score bar for unavailable gesture score
function ScoreUnavailable({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: '#F5F5F5', border: '3px dashed #CCC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px',
      }}>🤚</div>
      <span style={{ fontSize: '12px', color: '#999', fontWeight: '600', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

const progressMessages = [
  { max: 20, msg: 'Extracting audio…' },
  { max: 45, msg: 'Running Whisper features…' },
  { max: 65, msg: 'Classifying phoneme…' },
  { max: 80, msg: 'Scoring pronunciation…' },
  { max: 95, msg: 'Analysing gesture…' },
  { max: 101, msg: 'Finalising results…' },
];

export default function UploadVideoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [phoneme, setPhoneme] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [serverOk, setServerOk] = useState(null);
  const [dragover, setDragover] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.testConnection().then(ok => setServerOk(ok));
  }, []);

  const handleFile = (file) => {
    if (!file?.type?.startsWith('video/') && !file?.name?.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
      setError('Please select a valid video file');
      return;
    }
    setVideo(file);
    setResult(null);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const submit = async () => {
    if (!video) { setError('Please select a video file first'); return; }
    if (!phoneme) { setError('Please select a phoneme first'); return; }
    if (!serverOk) { setError(`Backend not reachable. Make sure the backend is running at localhost:8000`); return; }

    setLoading(true);
    setProgress(0);
    setError('');
    setResult(null);

    const tick = setInterval(() => setProgress(p => Math.min(p + 5, 92)), 500);

    try {
      const data = await apiService.gradePronunciation(video, phoneme);
      clearInterval(tick);
      setProgress(100);
      setResult(data);

      if (user?.email) {
        try {
          await progressService.saveAttempt(
            user.email,
            data.user_phoneme,
            data.audio_score,
            data.gesture_score ?? 0,
            data.overall_score,
            data.is_correct,
            data.mismatch_message || null,
            data.predicted_phoneme || null
          );
        } catch {}
      }
    } catch (err) {
      clearInterval(tick);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setVideo(null); setPhoneme(''); setResult(null); setProgress(0); setError(''); };

  const progressMsg = progressMessages.find(m => progress < m.max)?.msg || 'Finalising…';

  return (
    <div className="mobile-container" style={{ background: '#F5F5F5' }}>
      {/* Header */}
      <div className="header">
        <button id="btn-back" className="back-btn" onClick={() => router.push('/student-dashboard')}>←</button>
        <span className="header-title">Upload Video</span>
        <button
          id="btn-analyze"
          onClick={submit}
          disabled={!video || !phoneme || loading}
          style={{
            background: (!video || !phoneme || loading) ? '#B0BEC5' : 'rgba(255,255,255,0.25)',
            color: '#fff',
            border: '1.5px solid rgba(255,255,255,0.5)',
            borderRadius: '20px',
            padding: '7px 16px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: (!video || !phoneme || loading) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Analyzing…' : 'Upload'}
        </button>
      </div>

      <div className="scroll-content">
        {/* Server status */}
        {serverOk === false && (
          <div className="banner-error">
            ⚠️ Backend offline — make sure the FastAPI server is running on port 8000
          </div>
        )}

        {error && <div className="banner-error">{error}</div>}

        {/* Video picker card */}
        <div className="card">
          <p className="card-title">1. Select Video</p>
          <div
            className={`drop-zone ${dragover ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
            id="drop-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
              id="input-file"
            />
            <div className="drop-zone-icon">{video ? '🎬' : '📁'}</div>
            <p className="drop-zone-name">
              {video ? video.name : 'Click or drag & drop a video…'}
            </p>
            {video && (
              <p className="drop-zone-size">{(video.size / 1024 / 1024).toFixed(2)} MB</p>
            )}
          </div>
          {video && (
            <button
              id="btn-clear"
              onClick={e => { e.stopPropagation(); setVideo(null); setResult(null); }}
              style={{ background: 'none', border: 'none', color: '#F44336', fontWeight: '600', fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-end', marginTop: '8px', display: 'block', marginLeft: 'auto' }}
            >✕ Clear</button>
          )}
        </div>

        {/* Phoneme picker card */}
        <div className="card">
          <p className="card-title">2. Select Phoneme</p>
          <div className="chips">
            {PHONEMES.map(p => (
              <button
                key={p}
                id={`chip-${p}`}
                className={`chip ${phoneme === p ? 'active' : ''}`}
                onClick={() => setPhoneme(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          id="btn-submit"
          className="btn-primary"
          onClick={submit}
          disabled={!video || !phoneme || loading}
        >
          {loading ? <span className="spinner" /> : 'Analyze Pronunciation'}
        </button>

        {/* Progress card */}
        {loading && (
          <div className="card">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '8px' }}>{progressMsg}</p>
          </div>
        )}

        {/* Results card */}
        {result && !loading && (
          <div className="card" style={{ animation: 'fadeIn 0.5s ease' }}>
            <p className="card-title">Results</p>

            {/* Correct / incorrect badge */}
            <div className={`badge ${result.is_correct ? 'badge-success' : 'badge-warning'}`} style={{ marginBottom: '16px' }}>
              {result.is_correct
                ? `✅ Correct! You said "${result.predicted_phoneme}"`
                : result.mismatch_message || `❌ Expected "${result.user_phoneme}", heard "${result.predicted_phoneme}"`}
            </div>

            {/* ── Score rings row ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px',
            }}>
              {/* Overall — largest ring */}
              <ScoreRing score={result.overall_score} label="Overall" size={110} stroke={11} />

              {/* Audio */}
              <ScoreRing score={result.audio_score} label="🎤 Audio" />

              {/* Gesture */}
              {result.gesture_score != null
                ? <ScoreRing score={result.gesture_score} label="🤚 Gesture" />
                : <ScoreUnavailable label="🤚 Gesture" />
              }
            </div>

            {/* Breakdown table */}
            <div style={{
              background: '#F8F9FF',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '14px',
            }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#2D479D', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Score Breakdown
              </p>
              {[
                { label: 'Selected Phoneme', value: result.user_phoneme },
                { label: 'Predicted Phoneme', value: result.predicted_phoneme },
                { label: '🎤 Audio Score', value: `${result.audio_score} / 100` },
                result.gesture_score != null
                  ? { label: '🤚 Gesture Score', value: `${result.gesture_score} / 100` }
                  : { label: '🤚 Gesture Score', value: 'N/A (no hand detected)' },
                { label: '⭐ Overall Score', value: `${result.overall_score} / 100` },
              ].map(({ label, value }) => (
                <div key={label} className="detail-row" style={{ borderBottom: '1px solid #EEF0F8', padding: '6px 0' }}>
                  <span className="detail-label" style={{ fontSize: '12px' }}>{label}</span>
                  <span className="detail-value" style={{ fontSize: '13px', fontWeight: '700' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Gesture note */}
            {result.gesture_score == null && (
              <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginBottom: '12px', fontStyle: 'italic' }}>
                💡 Gesture analysis requires MediaPipe hand landmarks to be visible in the video.
              </p>
            )}

            <button id="btn-try-another" className="btn-ghost" style={{ marginTop: '8px' }} onClick={reset}>
              Try Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
