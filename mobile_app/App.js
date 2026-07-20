import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, SafeAreaView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Svg, { Circle } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';

// ── Config ────────────────────────────────────────────────────────────────────
// Auto-detect the Metro dev server host so the API call goes to the same
// machine that is serving the JS bundle (works on both Android emulator and
// physical device over LAN).
const getBackendURL = () => {
  try {
    const Constants = require('expo-constants').default;
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest?.hostUri ||
      '';
    const match = /^(\d+\.\d+\.\d+\.\d+)/.exec(hostUri);
    if (match) return `http://${match[1]}:8000`;
  } catch (_) {}
  return 'http://127.0.0.1:8000';
};

const BACKEND = getBackendURL();

const PHONEMES = ['ai', 'Y', 'Z', 'G', 'S', 'C', 'qu'];

// ── Circular progress ring ────────────────────────────────────────────────────
const ScoreRing = ({ score = 0, label = '', size = 90, stroke = 9 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ * (1 - pct / 100);
  const color = pct >= 80 ? '#4CAF50' : pct >= 60 ? '#FF9800' : pct >= 40 ? '#FFC107' : '#F44336';

  return (
    <View style={ring.wrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EAEAEA" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90} origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      <View style={[ring.center, { width: size - stroke * 2, height: size - stroke * 2 }]}>
        <Text style={[ring.pct, { color }]}>{pct}</Text>
        <Text style={ring.pctSymbol}>%</Text>
      </View>
      <Text style={ring.label}>{label}</Text>
    </View>
  );
};

const ring = StyleSheet.create({
  wrap: { alignItems: 'center', marginHorizontal: 16 },
  center: {
    position: 'absolute', top: 0, left: 0,
    marginLeft: 0, marginTop: 0,
    justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', alignSelf: 'center',
    // center inside the svg
    top: '5%', left: '5%',
  },
  pct: { fontSize: 18, fontWeight: '800' },
  pctSymbol: { fontSize: 11, fontWeight: '600', color: '#888', marginTop: 4 },
  label: { fontSize: 12, color: '#555', fontWeight: '600', marginTop: 6 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function App() {
  const [video, setVideo] = useState(null);
  const [phoneme, setPhoneme] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [serverOk, setServerOk] = useState(null);

  // health check on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/health`, { method: 'GET' });
        setServerOk(res.ok);
      } catch {
        setServerOk(false);
      }
    })();
  }, []);

  const pickVideo = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (!picked.canceled) {
      setVideo(picked.assets[0]);
      setResult(null);
    }
  };

  const submit = async () => {
    if (!video) return Alert.alert('Select a video first');
    if (!phoneme) return Alert.alert('Select a phoneme first');
    if (!serverOk) return Alert.alert('Backend not reachable', `Make sure the backend is running.\nURL: ${BACKEND}`);

    setLoading(true);
    setProgress(0);

    // fake progress while waiting
    const tick = setInterval(() => setProgress(p => Math.min(p + 8, 88)), 400);

    try {
      const form = new FormData();
      form.append('file', { uri: video.uri, type: video.mimeType || 'video/mp4', name: video.name || 'video.mp4' });
      form.append('user_phenome', phoneme);

      const res = await fetch(`${BACKEND}/predict/`, {
        method: 'POST',
        body: form,
        headers: { Accept: 'application/json' },
      });

      const data = await res.json();
      clearInterval(tick);
      setProgress(100);
      setResult(data);
    } catch (err) {
      clearInterval(tick);
      Alert.alert('Upload failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setVideo(null); setPhoneme(''); setResult(null); setProgress(0); };

  const progressMsg =
    progress < 25 ? 'Extracting audio…' :
    progress < 55 ? 'Running Whisper features…' :
    progress < 80 ? 'Classifying phoneme…' : 'Scoring pronunciation…';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>JollyPhonics</Text>
        <View style={[s.dot, { backgroundColor: serverOk === null ? '#aaa' : serverOk ? '#4CAF50' : '#F44336' }]} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Server status banner if down */}
        {serverOk === false && (
          <View style={s.banner}>
            <Text style={s.bannerText}>Backend offline — {BACKEND}</Text>
          </View>
        )}

        {/* Video picker card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>1. Select Video</Text>
          <TouchableOpacity style={s.dropzone} onPress={pickVideo}>
            <Text style={s.dropzoneIcon}>{video ? '🎬' : '📁'}</Text>
            <Text style={s.dropzoneName} numberOfLines={1}>
              {video ? video.name : 'Tap to choose a video…'}
            </Text>
            {video && (
              <Text style={s.dropzoneSize}>{(video.size / 1024 / 1024).toFixed(2)} MB</Text>
            )}
          </TouchableOpacity>
          {video && (
            <TouchableOpacity onPress={() => setVideo(null)} style={s.clearBtn}>
              <Text style={s.clearBtnText}>✕ Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Phoneme picker card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>2. Select Phoneme</Text>
          <View style={s.chips}>
            {PHONEMES.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.chip, phoneme === p && s.chipActive]}
                onPress={() => setPhoneme(p)}
              >
                <Text style={[s.chipText, phoneme === p && s.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, (!video || !phoneme || loading) && s.submitBtnDisabled]}
          onPress={submit}
          disabled={!video || !phoneme || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitBtnText}>Analyze Pronunciation</Text>}
        </TouchableOpacity>

        {/* Progress bar */}
        {loading && (
          <View style={s.card}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={s.progressMsg}>{progressMsg}</Text>
          </View>
        )}

        {/* Results card */}
        {result && !loading && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Results</Text>

            {/* Correct / Mismatch badge */}
            <View style={[s.badge, result.is_correct ? s.badgeOk : s.badgeFail]}>
              <Text style={s.badgeText}>
                {result.is_correct
                  ? `Correct! You said "${result.predicted_phoneme}"`
                  : result.mismatch_message || `Expected "${result.user_phoneme}", heard "${result.predicted_phoneme}"`}
              </Text>
            </View>

            {/* Score ring */}
            <View style={s.rings}>
              <ScoreRing score={result.audio_score} label="Audio Score" />
            </View>

            {/* Detail rows */}
            <View style={s.detail}>
              <DetailRow label="Selected" value={result.user_phoneme} />
              <DetailRow label="Predicted" value={result.predicted_phoneme} />
              <DetailRow label="Score" value={`${result.audio_score} / 100`} />
            </View>

            <TouchableOpacity style={s.resetBtn} onPress={reset}>
              <Text style={s.resetBtnText}>Try Another</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={s.detailRow}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={s.detailValue}>{value}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F2F8' },
  header: {
    backgroundColor: '#2D479D', paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  banner: {
    backgroundColor: '#FFEBEE', borderColor: '#FFCDD2', borderWidth: 1,
    borderRadius: 8, padding: 12, margin: 16, marginBottom: 0,
  },
  bannerText: { color: '#C62828', fontSize: 13, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    marginBottom: 16, shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },

  dropzone: {
    borderWidth: 2, borderColor: '#C5CAE9', borderStyle: 'dashed',
    borderRadius: 10, padding: 24, alignItems: 'center', backgroundColor: '#F8F9FF',
  },
  dropzoneIcon: { fontSize: 36, marginBottom: 8 },
  dropzoneName: { fontSize: 14, color: '#444', fontWeight: '500', maxWidth: '90%' },
  dropzoneSize: { fontSize: 12, color: '#999', marginTop: 4 },
  clearBtn: { alignSelf: 'flex-end', marginTop: 10 },
  clearBtnText: { fontSize: 13, color: '#F44336', fontWeight: '600' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#EEF0FF', borderWidth: 1.5, borderColor: '#C5CAE9',
  },
  chipActive: { backgroundColor: '#2D479D', borderColor: '#2D479D' },
  chipText: { fontSize: 15, fontWeight: '600', color: '#5C6BC0' },
  chipTextActive: { color: '#fff' },

  submitBtn: {
    backgroundColor: '#2D479D', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#2D479D', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: '#B0BEC5', shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  progressTrack: {
    height: 8, backgroundColor: '#EEF0FF', borderRadius: 4, overflow: 'hidden', marginBottom: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#2D479D', borderRadius: 4 },
  progressMsg: { fontSize: 13, color: '#666', textAlign: 'center' },

  badge: { borderRadius: 10, padding: 14, marginBottom: 18, alignItems: 'center' },
  badgeOk: { backgroundColor: '#E8F5E9' },
  badgeFail: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' },

  rings: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },

  detail: { backgroundColor: '#F8F9FF', borderRadius: 10, padding: 12, marginBottom: 18 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#2D479D' },

  resetBtn: {
    backgroundColor: '#F0F2F8', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: '#2D479D' },
});
