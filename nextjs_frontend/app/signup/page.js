'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/firebase';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setError('');
    setLoading(true);
    clearError();
    try {
      await signUp(email.trim(), displayName.trim());
      router.push('/signup-success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container" style={{ background: '#2D479D', position: 'relative' }}>
      {/* Decorative */}
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

      {/* Back button */}
      <div style={{ padding: '52px 20px 0', display: 'flex' }}>
        <button
          id="btn-back"
          className="back-btn-white"
          onClick={() => router.back()}
        >←</button>
      </div>

      {/* Top branding */}
      <div style={{ padding: '30px 28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '50px' }}>🦜</span>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>Join PhonicNest</p>
      </div>

      {/* Form card */}
      <div style={{
        flex: 1,
        background: '#F5F5F5',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        padding: '30px 24px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#000', textAlign: 'center', marginBottom: '20px' }}>Sign up</h2>

        {error && <div className="banner-error" style={{ marginBottom: '14px' }}>{error}</div>}

        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            id="input-email"
            type="email"
            className="input"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignUp()}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Display Name (Optional)</label>
          <input
            id="input-display-name"
            type="text"
            className="input"
            placeholder="Enter your display name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignUp()}
          />
        </div>

        <button
          id="btn-signup"
          className="btn-primary"
          onClick={handleSignUp}
          disabled={loading}
          style={{ marginTop: '10px' }}
        >
          {loading ? <span className="spinner" /> : 'Sign up'}
        </button>

        <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '18px', fontStyle: 'italic', lineHeight: 1.5 }}>
          Your email will be used as your unique identifier. No password required.
        </p>

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px', color: '#555' }}>
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            style={{ color: '#2D479D', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >Log in</button>
        </p>
      </div>
    </div>
  );
}
