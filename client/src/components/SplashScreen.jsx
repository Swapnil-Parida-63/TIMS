import React, { useState, useEffect, useCallback } from 'react';
import mentRLogo from '../assets/mentr_logo.png';

// ── sessionStorage key ──────────────────────────────────────────────────────
const SPLASH_KEY = 'tims_splash_seen';

// ── Splash Screen ─────────────────────────────────────────────────────────────
export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [gone,    setGone]    = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(SPLASH_KEY);
    if (!seen) setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    if (sliding || gone) return;
    sessionStorage.setItem(SPLASH_KEY, '1');
    setSliding(true);
    setTimeout(() => setGone(true), 700);
  }, [sliding, gone]);

  useEffect(() => {
    if (!visible) return;
    const onKey = () => dismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, dismiss]);

  if (!visible || gone) return null;

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden ${sliding ? 'splash-slide-up' : ''}`}
      style={{
        // Vibrant neon purple — corner to corner
        background: `
          radial-gradient(ellipse at 0% 0%,   #a855f7 0%, #7c3aed 30%, transparent 65%),
          radial-gradient(ellipse at 100% 100%, #9333ea 0%, #6d28d9 30%, transparent 65%),
          radial-gradient(ellipse at 100% 0%,  #c026d3 0%, #7c3aed 25%, transparent 55%),
          radial-gradient(ellipse at 0% 100%,  #7c3aed 0%, #4c1d95 30%, transparent 60%),
          linear-gradient(135deg, #3b0764 0%, #4c1d95 35%, #3730a3 70%, #1e1b4b 100%)
        `,
      }}
    >
      {/* ── Neon glow orbs ── */}

      {/* Center mega-glow */}
      <div
        className="splash-glow-pulse absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,38,211,0.55) 0%, rgba(139,92,246,0.3) 40%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {/* Top-left accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(216,180,254,0.4) 0%, transparent 65%)',
          top: '-80px',
          left: '-80px',
          animation: 'splashGlowPulse 3.5s ease-in-out infinite',
        }}
      />
      {/* Bottom-right accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 65%)',
          bottom: '-100px',
          right: '-100px',
          animation: 'splashGlowPulse 4.5s ease-in-out 0.8s infinite',
        }}
      />
      {/* Top-right accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,121,249,0.35) 0%, transparent 65%)',
          top: '-60px',
          right: '-60px',
          animation: 'splashGlowPulse 5s ease-in-out 0.3s infinite',
        }}
      />

      {/* ── Logo ── */}
      <div
        className="splash-logo-animate relative z-10"
        style={{
          filter:
            'drop-shadow(0 0 28px rgba(216,180,254,0.9)) ' +
            'drop-shadow(0 0 60px rgba(192,38,211,0.7)) ' +
            'drop-shadow(0 0 120px rgba(139,92,246,0.5))',
        }}
      >
        <img src={mentRLogo} alt="TheMentR Logo" style={{ width: 150, height: 150, objectFit: 'contain' }} />
      </div>

      {/* ── Brand name ── */}
      <p
        className="splash-hint-animate relative z-10 mt-5 text-white font-bold tracking-[0.2em] text-2xl"
        style={{
          textShadow:
            '0 0 20px rgba(232,121,249,1), 0 0 50px rgba(168,85,247,0.8), 0 0 90px rgba(139,92,246,0.6)',
        }}
      >
        TheMentR
      </p>

      {/* ── Hint ── */}
      <p
        className="splash-hint-animate absolute bottom-10 z-10 text-purple-200/60 text-[11px] tracking-[0.2em] uppercase font-medium"
        style={{ animationDelay: '1.8s' }}
      >
        Click anywhere or press any key to continue
      </p>
    </div>
  );
}

export default SplashScreen;
