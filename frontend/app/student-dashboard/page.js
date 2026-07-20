'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { icon: '🏠', label: 'Dashboard', path: '/student-dashboard' },
  { icon: '📋', label: 'Tasks', path: '/tasks' },
  { icon: '📤', label: 'Upload Video', path: '/upload-video' },
  { icon: '📊', label: 'Progress', path: '/progress' },
  { icon: '👤', label: 'Profile', path: '/profile' },
  { icon: '🚪', label: 'Sign Out', path: '/welcome', action: 'signout' },
];

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Learner';

  const handleMenu = (item) => {
    setSidebarOpen(false);
    if (item.action === 'signout') { signOut(); router.push('/welcome'); return; }
    router.push(item.path);
  };

  return (
    <div className="mobile-container" style={{ background: '#F5F5F5' }}>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '0 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.2)', marginBottom: '8px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🦜</div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{displayName}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{user?.email || ''}</div>
            </div>
            {menuItems.map(item => (
              <button key={item.label} className="sidebar-item" onClick={() => handleMenu(item)}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)} id="btn-menu">
          <div className="hamburger-line" />
          <div className="hamburger-line" />
          <div className="hamburger-line" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '17px', fontWeight: '700', color: '#fff' }}>Hi! {displayName}</span>
          <span style={{ fontSize: '18px' }}>👋</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>🔔</span>
          <button className="profile-icon-btn" onClick={() => router.push('/profile')}>👤</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px 20px 30px' }}>
        <div className="dash-grid">
          {/* Row 1 - Left */}
          <div className="dash-row">
            <button id="btn-record" className="dash-card" onClick={() => router.push('/upload-video')}>
              <div className="dash-icon-circle">🎥</div>
              <span className="dash-card-text">Record Video</span>
            </button>
          </div>

          {/* Row 2 - Right */}
          <div className="dash-row right">
            <button id="btn-tasks" className="dash-card" onClick={() => router.push('/tasks')}>
              <div className="dash-icon-circle">📋</div>
              <span className="dash-card-text">Tasks</span>
            </button>
          </div>

          {/* Row 3 - Left */}
          <div className="dash-row">
            <button id="btn-progress" className="dash-card" onClick={() => router.push('/progress')}>
              <div className="dash-icon-circle">📊</div>
              <span className="dash-card-text">Progress</span>
            </button>
          </div>

          {/* Row 4 - Right */}
          <div className="dash-row right">
            <button id="btn-upload" className="dash-card" onClick={() => router.push('/upload-video')}>
              <div className="dash-icon-circle">📤</div>
              <span className="dash-card-text">Upload Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
