'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { progressService } from '../../services/firebase';

function CircularRing({ size = 100, stroke = 10, percent = 0, color = '#2D479D' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circ * (1 - clamped / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#F0F0F0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: '800', color }}>{clamped}%</span>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.email) { setLoading(false); return; }
        const [stats, recent] = await Promise.all([
          progressService.getUserProgress(user.email),
          progressService.getUserAttempts(user.email, 30),
        ]);
        setUserStats(stats);
        setAttempts(recent);
      } catch (e) {
        console.error('Failed to load progress:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.email]);

  const averageScore = useMemo(() => userStats?.averageScore ?? 0, [userStats]);
  const last5 = attempts.slice(0, 5);
  const audioAvg = last5.length > 0
    ? Math.round(last5.reduce((s, a) => s + (Number(a.audioScore) || 0), 0) / last5.length)
    : 0;
  const videoAvg = last5.length > 0
    ? Math.round(last5.reduce((s, a) => s + (Number(a.videoScore) || 0), 0) / last5.length)
    : 0;

  const statCards = [
    { label: 'Total Attempts', value: userStats?.totalAttempts ?? 0, icon: '🎯' },
    { label: 'Avg Score', value: `${averageScore}%`, icon: '⭐' },
    { label: 'Best Score', value: `${userStats?.bestScore ?? 0}%`, icon: '🏆' },
    { label: 'Current Streak', value: `${userStats?.currentStreak ?? 0}🔥`, icon: '🔥' },
  ];

  return (
    <div className="mobile-container" style={{ background: '#F5F5F5' }}>
      {/* Header */}
      <div className="header">
        <button id="btn-back" className="back-btn" onClick={() => router.push('/student-dashboard')}>←</button>
        <span className="header-title">Progress</span>
        <span style={{ fontSize: '22px', cursor: 'pointer' }} title="Share">📤</span>
      </div>

      <div className="scroll-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '40px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #EEF0FF', borderTop: '4px solid #2D479D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#666', fontSize: '15px' }}>Loading your progress…</p>
          </div>
        ) : !user?.email ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '50px', marginBottom: '12px' }}>🔒</div>
            <p style={{ color: '#666', marginBottom: '16px' }}>Please log in to view your progress</p>
            <button className="btn-primary" onClick={() => router.push('/login')}>Log In</button>
          </div>
        ) : (
          <>
            {/* Skills Progress Rings */}
            <div className="card">
              <p className="card-title">Skills Progress</p>
              <div className="skills-row">
                <div className="skill-card">
                  <CircularRing percent={audioAvg} color="#2D479D" />
                  <span className="skill-label">Phonics</span>
                </div>
                <div className="skill-card">
                  <CircularRing percent={videoAvg} color="#1E88E5" />
                  <span className="skill-label">Gestures</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {statCards.map(s => (
                <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{s.icon}</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#2D479D' }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Phonemes completed */}
            {userStats?.phonemesCompleted?.length > 0 && (
              <div className="card">
                <p className="card-title">Phonemes Practiced</p>
                <div className="chips">
                  {userStats.phonemesCompleted.map(p => (
                    <span key={p} className="chip active">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="card">
              <p className="card-title">Recent Activity</p>
              {attempts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                  <p>No activity yet. Start practicing!</p>
                </div>
              ) : (
                <div>
                  {attempts.slice(0, 10).map((a, i) => {
                    const date = a.timestamp?.toDate
                      ? a.timestamp.toDate().toLocaleDateString()
                      : a.timestamp?.seconds
                        ? new Date(a.timestamp.seconds * 1000).toLocaleDateString()
                        : '';
                    const scoreColor = a.combinedScore >= 80 ? '#4CAF50' : a.combinedScore >= 60 ? '#FF9800' : '#F44336';
                    return (
                      <div key={a.id || i} className="activity-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span className="activity-text">
                              {a.isCorrect ? '✅' : '❌'} Phoneme: <strong>{a.phoneme}</strong>
                            </span>
                            <div className="activity-date">{date}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '800', fontSize: '16px', color: scoreColor }}>
                              {a.combinedScore ?? a.audioScore}%
                            </div>
                            <div style={{ fontSize: '11px', color: '#999' }}>combined</div>
                          </div>
                        </div>
                        {a.mismatchMessage && (
                          <p style={{ fontSize: '12px', color: '#E65100', marginTop: '4px', lineHeight: 1.4 }}>
                            {a.mismatchMessage}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
