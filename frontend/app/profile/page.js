'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Learner Name';
  const email = user?.email || 'learner@email.com';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    signOut();
    router.push('/welcome');
  };

  const infoRows = [
    { label: 'Full Name', value: displayName },
    { label: 'Email', value: email },
    { label: 'Phone', value: '+1 234 567 8900' },
    { label: 'Date of Birth', value: 'January 1, 2000' },
  ];

  const academicRows = [
    { label: 'Learner ID', value: 'LEA123456' },
    { label: 'Course', value: '—' },
    { label: 'Tasks Level', value: '—' },
  ];

  return (
    <div className="mobile-container" style={{ background: '#F5F5F5' }}>
      {/* Header */}
      <div className="header">
        <button id="btn-back" className="back-btn" onClick={() => router.push('/student-dashboard')}>←</button>
        <span className="header-title">Profile</span>
        <button
          id="btn-edit"
          onClick={() => router.push('/edit-profile')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
          title="Edit Profile"
        >✏️</button>
      </div>

      <div className="scroll-content">
        {/* Avatar section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingTop: '28px', paddingBottom: '28px' }}>
          <div style={{
            width: '84px', height: '84px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2D479D, #4A70E2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', fontWeight: '800', color: '#fff',
            border: '3px solid #EEF0FF',
            boxShadow: '0 4px 15px rgba(45,71,157,0.3)',
            position: 'relative',
          }}>
            {initial}
            <div style={{
              position: 'absolute', bottom: '-2px', right: '-2px',
              width: '26px', height: '26px', borderRadius: '50%',
              background: '#fff', border: '2px solid #EEF0FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', cursor: 'pointer',
            }}>📷</div>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a2e', marginTop: '8px' }}>{displayName}</h2>
          <p style={{ fontSize: '14px', color: '#666' }}>{email}</p>
        </div>

        {/* Personal Information */}
        <div className="card">
          <p className="card-title">Personal Information</p>
          {infoRows.map(r => (
            <div key={r.label} className="detail-row">
              <span className="detail-label">{r.label}</span>
              <span className="detail-value" style={{ fontSize: '13px', maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Academic Information */}
        <div className="card">
          <p className="card-title">Academic Information</p>
          {academicRows.map(r => (
            <div key={r.label} className="detail-row">
              <span className="detail-label">{r.label}</span>
              <span className="detail-value" style={{ fontSize: '13px' }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Account Settings */}
        <div className="card">
          <p className="card-title">Account Settings</p>
          <button
            id="btn-edit-profile"
            className="btn-outline"
            style={{ marginBottom: '12px' }}
            onClick={() => router.push('/edit-profile')}
          >
            ✏️ Edit Profile
          </button>
          <button
            id="btn-signout"
            onClick={handleSignOut}
            style={{
              background: '#FFEBEE', color: '#C62828', border: '1.5px solid #FFCDD2',
              borderRadius: '12px', padding: '13px', fontSize: '15px', fontWeight: '700',
              cursor: 'pointer', width: '100%',
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
