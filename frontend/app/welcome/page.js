'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const slides = [
  {
    bg: '#2346A0',
    emoji: '🎙️',
    title: 'Jolly Phonics',
    text: 'Welcome to Jolly Phonics App by Murrabbi in collaboration with Allama Iqbal Open University',
  },
  {
    bg: '#3B5CC8',
    emoji: '📚',
    title: 'Welcome!',
    text: 'Practice phonics at your own pace and grow every day.',
  },
  {
    bg: '#5D3FD3',
    emoji: '🏆',
    title: 'Welcome!',
    text: 'Track your progress and celebrate every milestone!',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const slide = slides[current];

  return (
    <div className="mobile-container" style={{ background: slide.bg, transition: 'background 0.7s ease', position: 'relative' }}>
      {/* Decorative bubbles */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />
      <div style={{
        position: 'absolute', bottom: '40%', left: '-40px',
        width: '130px', height: '130px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />

      {/* Illustration area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div key={current} style={{ fontSize: '110px', animation: 'float 3s ease-in-out infinite' }}>
          {slide.emoji}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.35)' }} />

      {/* Bottom content */}
      <div style={{ padding: '28px 28px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h1 key={`t-${current}`} style={{ fontSize: '32px', fontWeight: '800', color: '#fff', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
          {slide.title}
        </h1>
        <p key={`s-${current}`} style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.5, animation: 'fadeIn 0.5s ease 0.1s both' }}>
          {slide.text}
        </p>

        {/* Slide indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '4px 0' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <button
          id="btn-new-user"
          onClick={() => router.push('/signup')}
          style={{
            background: '#fff',
            color: slide.bg,
            border: 'none',
            borderRadius: '25px',
            padding: '15px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          I'm new at Jolly Phonics
        </button>

        <button
          id="btn-existing-user"
          onClick={() => router.push('/login')}
          style={{
            background: 'transparent',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.8)',
            borderRadius: '25px',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          I already have an Account
        </button>
      </div>
    </div>
  );
}
