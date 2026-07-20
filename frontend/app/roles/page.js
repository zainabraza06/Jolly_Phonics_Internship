'use client';
import { useRouter } from 'next/navigation';

const roles = [
  { id: 'admin', icon: '👨‍💼', name: 'Admin', desc: 'Manage system & users', path: '/admin-dashboard' },
  { id: 'learner', icon: '🎓', name: 'Learner', desc: 'Learn & practice skills', path: '/student-dashboard' },
  { id: 'instructor', icon: '👩‍🏫', name: 'Instructor', desc: 'Teach & guide students', path: '/instructor-dashboard' },
];

export default function RolesPage() {
  const router = useRouter();

  return (
    <div className="mobile-container" style={{ background: '#2D479D', position: 'relative' }}>
      {/* Back button */}
      <div style={{ padding: '52px 20px 0' }}>
        <button id="btn-back" className="back-btn-white" onClick={() => router.back()}>←</button>
      </div>

      {/* Decorative circles */}
      <div style={{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
        ))}
      </div>

      {/* Title */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 20px 30px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: '10px', lineHeight: 1.2 }}>
          Choose Your Role
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.5, marginBottom: '40px' }}>
          Select the role that best describes you
        </p>

        {/* Role cards */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {roles.map(r => (
            <button
              key={r.id}
              id={`btn-role-${r.id}`}
              className="role-card"
              onClick={() => router.push(r.path)}
            >
              <div className="role-icon-circle">{r.icon}</div>
              <div className="role-text">
                <div className="role-name">{r.name}</div>
                <div className="role-desc">{r.desc}</div>
              </div>
              <div className="role-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
