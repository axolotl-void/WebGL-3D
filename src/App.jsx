import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import UnifiedScene from './scenes/UnifiedScene';
import PortalTransition from './effects/PortalTransition';
import HeroOverlay from './components/HeroOverlay';
import Zone2Overlay from './components/Zone2Overlay';
import IdentityPanel from './components/IdentityPanel';
import './App.css';

function App() {

  return (
    <>
      {/* 3D WebGL Canvas Background Layer */}
      <div className="canvas-container">
        <Canvas gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          
          <Suspense fallback={null}>
            <UnifiedScene />
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

      {/* Tall invisible div for scroll-driven camera */}
      <div className="scroll-container" style={{ pointerEvents: 'none' }}>
        <div style={{ height: '800vh', width: '100%' }} />
      </div>
    </>
  );
}

export default App;
