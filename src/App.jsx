import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import UnifiedScene from './scenes/UnifiedScene';
import PortalTransition from './effects/PortalTransition';
import HeroOverlay from './components/HeroOverlay';
import Zone2Overlay from './components/Zone2Overlay';
import IdentityPanel from './components/IdentityPanel';
import EducationPanel from './components/EducationPanel';
import SkillsPanel from './components/SkillsPanel';
import AchievementsPanel from './components/AchievementsPanel';
import Zone3Overlay from './components/Zone3Overlay';
import Loader from './components/Loader';
import './App.css';

function App() {
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  // Loader phase signals (Rancangan 28)
  const [fontsReady, setFontsReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [introReady, setIntroReady] = useState(false);

  // Debug HUD Refs declared outside Canvas to avoid 3D projection shaking and rendering drops
  const debugScrollRef = useRef(null);
  const debugPosRef = useRef(null);
  const debugRotRef = useRef(null);
  const debugZoneRef = useRef(null);
  const debugFreeCamRef = useRef(null);

  // Phase 2: fonts.ready (fallback timeout 8s kalau API hang)
  useEffect(() => {
    let fallbackTimer;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setFontsReady(true);
        clearTimeout(fallbackTimer);
      });
      fallbackTimer = setTimeout(() => setFontsReady(true), 8000);
    } else {
      setFontsReady(true);
    }
    return () => clearTimeout(fallbackTimer);
  }, []);

  // Audio gesture after loader hidden — fires once on first pointerdown/keydown.
  // NOTE: semua audio di app ini pakai `new Audio()` (programmatic), jadi
  // `document.querySelector('audio')` selalu null dan efek ini no-op. Tetap
  // di-include sesuai rancangan 28 v2 §4.3 — sebagai safety net kalau
  // arsitektur audio berubah (misal ada elemen <audio> di-overlay-kan).
  useEffect(() => {
    if (!introReady) return;
    const playOnce = () => {
      const a = document.querySelector('audio');
      if (a) a.play().catch(() => {});
      window.removeEventListener('pointerdown', playOnce);
      window.removeEventListener('keydown', playOnce);
    };
    window.addEventListener('pointerdown', playOnce);
    window.addEventListener('keydown', playOnce);
    return () => {
      window.removeEventListener('pointerdown', playOnce);
      window.removeEventListener('keydown', playOnce);
    };
  }, [introReady]);

  return (
    <>
      {/* Loading screen — always mounted until all 5 phases complete */}
      <Loader
        fontsReady={fontsReady}
        canvasReady={canvasReady}
        assetsReady={assetsReady}
        introReady={introReady}
      />

      {/* 3D WebGL Canvas Background Layer */}
      <div className="canvas-container">
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={() => setCanvasReady(true)}
        >
          
          <Suspense fallback={null}>
            <UnifiedScene 
              debugScrollRef={debugScrollRef}
              debugPosRef={debugPosRef}
              debugRotRef={debugRotRef}
              debugZoneRef={debugZoneRef}
              debugFreeCamRef={debugFreeCamRef}
              onAssetsReady={() => setAssetsReady(true)}
            />
          </Suspense>

          <EffectComposer>
            <Bloom
              intensity={0.7}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
              mipmapBlur={true}
              radius={0.65}
            />
            <PortalTransition />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Hero HUD Overlay */}
      <HeroOverlay 
        showDebugConsole={showDebugConsole}
        onToggleDebug={() => setShowDebugConsole(prev => !prev)}
        onIntroStart={() => setIntroReady(true)}
      />
      <Zone2Overlay />
      <Zone3Overlay />
      <IdentityPanel />
      <EducationPanel />
      <SkillsPanel />
      <AchievementsPanel />

      {/* ════════════ COORDINATE DEBUG HUD (Static outside Canvas) ════════════ */}
      {showDebugConsole && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '40px',
          fontFamily: 'var(--font-display, "Orbitron", sans-serif)',
          fontSize: '0.75rem',
          color: '#00d2ff',
          background: 'rgba(2, 10, 23, 0.85)',
          border: '1px solid rgba(0, 210, 255, 0.3)',
          boxShadow: '0 0 15px rgba(0, 210, 255, 0.15)',
          padding: '16px',
          width: '320px',
          pointerEvents: 'auto',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          clipPath: 'polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)'
        }}>
          <div style={{ fontWeight: 800, borderBottom: '1px solid rgba(0, 210, 255, 0.2)', paddingBottom: '4px', marginBottom: '4px', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
            CAMERA DEBUG CONSOLE
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8da4c4' }}>CURRENT ZONE:</span>
            <span ref={debugZoneRef} style={{ fontWeight: 'bold' }}>-</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8da4c4' }}>SCROLL PROGRESS:</span>
            <span ref={debugScrollRef} style={{ fontWeight: 'bold' }}>-</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: '#8da4c4' }}>POSITION:</span>
            <span ref={debugPosRef} style={{ color: '#fff', paddingLeft: '8px', fontFamily: 'monospace' }}>-</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: '#8da4c4' }}>ROTATION (EULER):</span>
            <span ref={debugRotRef} style={{ color: '#fff', paddingLeft: '8px', fontFamily: 'monospace' }}>-</span>
          </div>
          <div style={{ display: 'flex', borderTop: '1px dashed rgba(0, 210, 255, 0.15)', paddingTop: '8px', marginTop: '4px', justifyContent: 'space-between' }}>
            <span style={{ color: '#8da4c4' }}>FREE CAM [C]:</span>
            <span ref={debugFreeCamRef} style={{ fontWeight: 'bold', color: '#ff0055' }}>-</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: '#8da4c4', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.2' }}>
            *Press [C] to toggle free fly mode. Use WASD keys to move, Q/E to fly up/down, and drag mouse to rotate.
          </div>
        </div>
      )}

      {/* Tall invisible div for scroll-driven camera */}
      <div className="scroll-container" style={{ pointerEvents: 'none' }}>
        <div style={{ height: '800vh', width: '100%' }} />
      </div>
    </>
  );
}

export default App;
