'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push('/roles'), 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mobile-container success-page">
      <div className="success-top">✅</div>
      <div className="success-divider" />
      <div className="success-bottom">
        <h2 className="success-title">Log in Successful!</h2>
        <p className="success-sub">Welcome, again!</p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '20px' }}>
          Redirecting you in a moment…
        </p>
      </div>
    </div>
  );
}
