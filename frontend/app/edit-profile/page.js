'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.displayName || 'Learner Name',
    email: user?.email || 'learner@email.com',
    phone: '+1 234 567 8900',
    dateOfBirth: 'January 1, 2000',
    studentId: 'LEA123456',
    course: 'Gesture informatives',
    yearLevel: 'Intermediate',
  });
  const [saved, setSaved] = useState(false);

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); router.push('/profile'); }, 1500);
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'Your email', disabled: true },
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 234 567 8900' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'text', placeholder: 'January 1, 2000' },
  ];

  const academicFields = [
    { key: 'studentId', label: 'Student ID', type: 'text', placeholder: 'LEA123456', disabled: true },
    { key: 'course', label: 'Course', type: 'text', placeholder: 'Your course' },
    { key: 'yearLevel', label: 'Year Level', type: 'text', placeholder: 'Beginner / Intermediate / Advanced' },
  ];

  return (
    <div className="mobile-container" style={{ background: '#F5F5F5' }}>
      {/* Header */}
      <div className="header">
        <button id="btn-back" className="back-btn" onClick={() => router.push('/student-dashboard')}>←</button>
        <span className="header-title">Edit Profile</span>
        <button
          id="btn-save"
          onClick={handleSave}
          style={{
            background: saved ? '#4CAF50' : 'rgba(255,255,255,0.2)',
            border: '1.5px solid rgba(255,255,255,0.5)',
            borderRadius: '20px', padding: '7px 16px',
            color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
            transition: 'background 0.3s',
          }}
        >
          {saved ? '✅ Saved' : 'Save'}
        </button>
      </div>

      <div className="scroll-content">
        {saved && (
          <div className="badge badge-success" style={{ animation: 'fadeIn 0.3s ease' }}>
            ✅ Profile updated successfully!
          </div>
        )}

        {/* Avatar section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px' }}>
          <div style={{
            width: '84px', height: '84px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2D479D, #4A70E2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', fontWeight: '800', color: '#fff',
            position: 'relative',
          }}>
            {formData.fullName.charAt(0).toUpperCase()}
            <div style={{
              position: 'absolute', bottom: '-4px', right: '-4px',
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#fff', border: '2px solid #EEF0FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}>📷</div>
          </div>
          <p style={{ fontSize: '13px', color: '#999' }}>Tap the camera to change photo</p>
        </div>

        {/* Personal Information */}
        <div className="card">
          <p className="card-title">Personal Information</p>
          {fields.map(f => (
            <div key={f.key} className="input-group">
              <label className="input-label">{f.label}</label>
              <input
                id={`input-${f.key}`}
                type={f.type}
                className="input"
                value={formData[f.key]}
                onChange={e => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                disabled={f.disabled}
                style={f.disabled ? { background: '#f5f5f5', color: '#999', cursor: 'not-allowed' } : {}}
              />
            </div>
          ))}
        </div>

        {/* Academic Information */}
        <div className="card">
          <p className="card-title">Academic Information</p>
          {academicFields.map(f => (
            <div key={f.key} className="input-group">
              <label className="input-label">{f.label}</label>
              <input
                id={`input-${f.key}`}
                type={f.type}
                className="input"
                value={formData[f.key]}
                onChange={e => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                disabled={f.disabled}
                style={f.disabled ? { background: '#f5f5f5', color: '#999', cursor: 'not-allowed' } : {}}
              />
            </div>
          ))}
        </div>

        <button id="btn-save-bottom" className="btn-primary" onClick={handleSave}>
          {saved ? '✅ Saved!' : 'Save Changes'}
        </button>
        <button id="btn-cancel" className="btn-ghost" onClick={() => router.push('/profile')}>
          Cancel
        </button>
      </div>
    </div>
  );
}
