'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/welcome');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mobile-container" style={{ background: '#2D479D', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
      {/* Animated logo */}
      <div style={{ animation: 'bounce 1s ease-in-out infinite', fontSize: '80px' }}>🦜</div>

      {/* Stars decorations */}
      <div style={{ position: 'absolute', top: '18%', left: '16%', fontSize: '28px', animation: 'float 2.5s ease-in-out infinite', animationDelay: '0.3s' }}>⭐</div>
      <div style={{ position: 'absolute', top: '30%', right: '12%', fontSize: '22px', animation: 'float 3s ease-in-out infinite', animationDelay: '0.6s' }}>✨</div>
      <div style={{ position: 'absolute', bottom: '30%', left: '14%', fontSize: '20px', animation: 'float 2.8s ease-in-out infinite', animationDelay: '0.9s' }}>⭐</div>
      <div style={{ position: 'absolute', bottom: '22%', right: '16%', fontSize: '18px', animation: 'float 3.2s ease-in-out infinite' }}>🌟</div>

      {/* Animated text */}
      <div style={{ animation: 'fadeIn 0.8s ease 0.3s both', textAlign: 'center', padding: '0 20px', zIndex: 1 }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#fff', letterSpacing: '1px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>Jolly Phonics</h1>
        <p style={{ fontSize: '16px', fontWeight: '700', color: 'rgba(255,255,255,0.95)', marginTop: '12px', lineHeight: 1.4 }}>
          Welcome to Jolly Phonics App by Murrabbi
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '6px', fontWeight: '500', lineHeight: 1.3 }}>
          in collaboration with Allama Iqbal Open University
        </p>
      </div>

      {/* Loading dots */}
      <div style={{ display: 'flex', gap: '8px', animation: 'fadeIn 0.8s ease 1.5s both' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
