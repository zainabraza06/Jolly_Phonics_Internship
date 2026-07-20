'use client';
import { useRouter } from 'next/navigation';

const topStats = [
  { label: 'New Students', value: '12', icon: '🆕', color: '#4CAF50' },
  { label: 'Total Students', value: '248', icon: '👥', color: '#2D479D' },
];

const smallActions = [
  { id: 'requests', label: 'Requests', icon: '📨', badge: '3' },
  { id: 'suggestions', label: 'Suggestions', icon: '💡', badge: '7' },
  { id: 'students-list', label: "Students' List", icon: '📋' },
  { id: 'teachers-list', label: "Teachers' List", icon: '👩‍🏫' },
];

const recentUsers = [
  { name: 'Emma Thompson', role: 'Student', date: 'Jan 15, 2024', emoji: '👩‍🎓' },
  { name: 'James Carter', role: 'Instructor', date: 'Jan 14, 2024', emoji: '👨‍🏫' },
  { name: 'Sophia Lee', role: 'Student', date: 'Jan 13, 2024', emoji: '👩‍🎓' },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="mobile-container" style={{ background: '#F5F5F5' }}>
      {/* Header */}
      <div className="header">
        <button className="hamburger" style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }} onClick={() => alert('Menu coming soon')}>
          <div className="hamburger-line" />
          <div className="hamburger-line" />
          <div className="hamburger-line" />
        </button>
        <span className="header-title">Admin Dashboard</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>🔔</span>
          <button className="profile-icon-btn">👤</button>
        </div>
      </div>

      <div className="scroll-content">
        {/* Back to roles */}
        <button
          id="btn-back"
          onClick={() => router.push('/roles')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#2D479D', fontWeight: '600', fontSize: '14px', padding: '0' }}
        >
          ← Back to Roles
        </button>

        {/* Top stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {topStats.map(s => (
            <button
              key={s.label}
              id={`btn-${s.label.toLowerCase().replace(' ', '-')}`}
              onClick={() => alert('Will be available in a future version')}
              style={{
                background: s.color, color: '#fff', border: 'none', borderRadius: '16px',
                padding: '22px 16px', textAlign: 'center', cursor: 'pointer',
                boxShadow: `0 4px 15px ${s.color}55`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: '900' }}>{s.value}</div>
              <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Small action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {smallActions.map(a => (
            <button
              key={a.id}
              id={`btn-${a.id}`}
              className="card"
              onClick={() => alert('Will be available in a future version')}
              style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', textAlign: 'left', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '24px' }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e' }}>{a.label}</div>
                {a.badge && (
                  <div style={{ fontSize: '11px', color: '#F44336', fontWeight: '700', marginTop: '2px' }}>
                    {a.badge} pending
                  </div>
                )}
              </div>
              <span style={{ color: '#2D479D', fontWeight: '800', fontSize: '16px' }}>›</span>
            </button>
          ))}
        </div>

        {/* Recent registrations */}
        <div className="card">
          <p className="card-title">Recent Registrations</p>
          {recentUsers.map(u => (
            <div key={u.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: '#EEF0FF', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '22px',
                }}>{u.emoji}</div>
                <div>
                  <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: '#2D479D', fontWeight: '600', marginTop: '2px' }}>{u.role}</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>{u.date}</div>
            </div>
          ))}
        </div>

        {/* System status */}
        <div className="card">
          <p className="card-title">System Status</p>
          {[
            { label: 'Backend API', status: 'Online', color: '#4CAF50' },
            { label: 'Firebase DB', status: 'Online', color: '#4CAF50' },
            { label: 'ML Model', status: 'Ready', color: '#2196F3' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '14px', color: '#555' }}>{s.label}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: s.color }}>● {s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
