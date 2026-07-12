import { Suspense, useRef } from 'react';
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
import './App.css';

function App() {
  // Debug HUD Refs declared outside Canvas to avoid 3D projection shaking and rendering drops
  const debugScrollRef = useRef(null);
  const debugPosRef = useRef(null);
  const debugRotRef = useRef(null);
  const debugZoneRef = useRef(null);
  const debugFreeCamRef = useRef(null);

  return (
    <>
      {/* 3D WebGL Canvas Background Layer */}
      <div className="canvas-container">
        <Canvas gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          
          <Suspense fallback={null}>
            <UnifiedScene 
              debugScrollRef={debugScrollRef}
              debugPosRef={debugPosRef}
              debugRotRef={debugRotRef}
              debugZoneRef={debugZoneRef}
              debugFreeCamRef={debugFreeCamRef}
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
      <HeroOverlay />
      <Zone2Overlay />
      <IdentityPanel />
      <EducationPanel />
      <SkillsPanel />
      <AchievementsPanel />

      {/* ════════════ COORDINATE DEBUG HUD (Static outside Canvas) ════════════ */}
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

      {/* Tall invisible div for scroll-driven camera */}
      <div className="scroll-container" style={{ pointerEvents: 'none' }}>
        <div style={{ height: '800vh', width: '100%' }} />
      </div>
    </>
  );
}

export default App;
