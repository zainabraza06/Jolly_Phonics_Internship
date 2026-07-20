'use client';
import { useRouter } from 'next/navigation';

const actions = [
  { id: 'assign-tasks', label: 'Assign Tasks', icon: '📋' },
  { id: 'total-students', label: 'Total Students', icon: '👥' },
  { id: 'progress-overview', label: 'Progress Overview', icon: '📊' },
  { id: 'full-report', label: 'View Full Report', icon: '📄' },
];

const students = [
  { name: 'Alice Johnson', score: 87, status: 'Excellent', emoji: '🌟' },
  { name: 'Bob Smith', score: 72, status: 'Good', emoji: '👍' },
  { name: 'Carol Williams', score: 58, status: 'Needs Work', emoji: '💪' },
];

export default function InstructorDashboardPage() {
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
        <span className="header-title">Hi, Instructor! 👩‍🏫</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>🔔</span>
          <button className="profile-icon-btn">👤</button>
        </div>
      </div>

      <div className="scroll-content">
        {/* Back to roles */}
        <button
          id="btn-back"
          className="btn-ghost"
          onClick={() => router.push('/roles')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start', paddingLeft: '0', background: 'none', color: '#2D479D', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
        >
          ← Back to Roles
        </button>

        {/* Quick actions grid */}
        <div className="card">
          <p className="card-title">Quick Actions</p>
          <div className="mgmt-grid">
            {actions.map(a => (
              <button
                key={a.id}
                id={`btn-${a.id}`}
                className="mgmt-btn"
                onClick={() => alert('Will be available in a future version')}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{a.icon}</div>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#2D479D' }}>24</div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Total Students</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#4CAF50' }}>76%</div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Avg Progress</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '2px', background: '#EEF0FF', margin: '4px 0' }} />

        {/* Student highlights */}
        <div className="card">
          <p className="card-title">Student Highlights</p>
          {students.map(s => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: '#EEF0FF', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '22px',
                }}>{s.emoji}</div>
                <div>
                  <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{s.status}</div>
                </div>
              </div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: s.score >= 80 ? '#4CAF50' : s.score >= 60 ? '#FF9800' : '#F44336' }}>
                {s.score}%
              </div>
            </div>
          ))}
          <button
            id="btn-view-all"
            className="btn-outline"
            style={{ marginTop: '14px' }}
            onClick={() => alert('Full student list coming soon')}
          >
            View All Students
          </button>
        </div>
      </div>
    </div>
  );
}
