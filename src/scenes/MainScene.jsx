import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import TechCube from '../components/TechCube';
import SnowyMountain from '../components/SnowyMountain';

// ─────────────────────────────────────────────────────────────────────────────
// Ambient Sparkling Particles (Floating Dust Field)
// ─────────────────────────────────────────────────────────────────────────────
function ParticleField({ count = 250 }) {
  const pointsRef = useRef();

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;     // X
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30; // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40; // Z
      spd[i] = 0.05 + Math.random() * 0.15;
    }
    return [pos, spd];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3 + 1] += speeds[i] * 0.15;
      
      if (posAttr.array[i * 3 + 1] > 15) {
        posAttr.array[i * 3 + 1] = -15;
      }

      posAttr.array[i * 3] += Math.sin(t + i) * 0.005;
    }
    posAttr.needsUpdate = true;

    // ponytail: particle fade-in tied to elapsed time, no external state needed
    const fadeT = Math.min(Math.max((t - 1.5) / 1.5, 0), 1);
    pointsRef.current.material.opacity = fadeT * 0.45;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#00d2ff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Scene Manager
// ─────────────────────────────────────────────────────────────────────────────
export default function MainScene({ skipIntro = false }) {
  const { camera } = useThree();
  const cubeGroupRef = useRef();
  const mountainRef = useRef();
  
  // Ambil posisi scroll awal saat komponen di-mount agar kamera tidak melompat
  const initScroll = useMemo(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }, []);

  // Interpolated scroll value for smooth lerping
  const scrollRef = useRef(initScroll);
  const targetScrollRef = useRef(initScroll);

  // Intro camera constants (allocated once, never recreated)
  const introCamStart = useMemo(() => new THREE.Vector3(0, 25, 40), []);
  const introLookStart = useMemo(() => new THREE.Vector3(0, 0, -12), []);

  // 1. Curve for Camera Position (straight line zooming in)
  const cameraCurve = useMemo(() => {
    return new THREE.LineCurve3(
      new THREE.Vector3(0, 1.2, 16.0),     // Start position
      new THREE.Vector3(0, 1.2, -6.0)      // End position (closer to the cube at Z=-12)
    );
  }, []);

  // 2. Curve for Camera LookAt target (always look at the cube)
  const targetCurve = useMemo(() => {
    return new THREE.LineCurve3(
      new THREE.Vector3(0, 3.0, -12.0),    // Look at cube's center
      new THREE.Vector3(0, 3.0, -12.0)
    );
  }, []);

  // Monitor scroll updates
  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      targetScrollRef.current = window.scrollY / maxScroll;
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smoothstep easing helper
  const ease = (t) => t * t * (3.0 - 2.0 * t);

  useFrame((state) => {
    // Jika skipIntro aktif, tambahkan waktu 5 detik agar langsung masuk mode normal
    const time = state.clock.getElapsedTime() + (skipIntro ? 5.0 : 0.0);

    // ═══════════════════════════════════════════════════════════════════════
    // INTRO ANIMATION (first ~4 seconds)
    // ═══════════════════════════════════════════════════════════════════════
    const introDuration = 5.0;
    const introT = Math.min(time / introDuration, 1.0);
    const introActive = introT < 1.0;
    const introEased = ease(introT);

    // ── Drive mountain shader uniforms ──
    if (mountainRef.current?.uniforms) {
      const u = mountainRef.current.uniforms;
      // Terrain reveal: 0→1 over first 60% of intro (~3s)
      u.uRevealProgress.value = ease(Math.min(introT / 0.6, 1.0));
      // Wireframe propagation: 0→1 over first 50% of intro (~2.5s)
      u.uWireProgress.value = Math.min(introT / 0.5, 1.0);
    }

    // ── Cube intro: appears after terrain is mostly revealed ──
    const cubeT = ease(Math.max(0, (introT - 0.65) / 0.35));

    // ═══════════════════════════════════════════════════════════════════════
    // CAMERA
    // ═══════════════════════════════════════════════════════════════════════
    scrollRef.current = THREE.MathUtils.lerp(
      scrollRef.current,
      targetScrollRef.current,
      0.065
    );
    const scroll = scrollRef.current;

    const baseCamPos = cameraCurve.getPointAt(scroll);
    const baseTarget = targetCurve.getPointAt(scroll);

    if (introActive) {
      // Camera intro: dramatic swoop from above down to hero position
      camera.position.set(
        THREE.MathUtils.lerp(introCamStart.x, baseCamPos.x, introEased),
        THREE.MathUtils.lerp(introCamStart.y, baseCamPos.y, introEased),
        THREE.MathUtils.lerp(introCamStart.z, baseCamPos.z, introEased)
      );

      if (!camera.lookTarget) camera.lookTarget = new THREE.Vector3();
      camera.lookTarget.set(
        THREE.MathUtils.lerp(introLookStart.x, baseTarget.x, introEased),
        THREE.MathUtils.lerp(introLookStart.y, baseTarget.y, introEased),
        THREE.MathUtils.lerp(introLookStart.z, baseTarget.z, introEased)
      );
      camera.lookAt(camera.lookTarget);
    } else {
      // Normal scroll-based camera with mouse parallax
      const mouseX = state.pointer.x * 1.0;
      const mouseY = state.pointer.y * 0.6;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, baseCamPos.x + mouseX, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, baseCamPos.y + mouseY, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseCamPos.z, 0.05);

      if (!camera.lookTarget) camera.lookTarget = new THREE.Vector3();
      camera.lookTarget.lerp(baseTarget, 0.05);
      camera.lookAt(camera.lookTarget);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CUBE ANIMATION & POSITIONING
    // ═══════════════════════════════════════════════════════════════════════
    if (cubeGroupRef.current) {
      const g = cubeGroupRef.current;
      const floatOffset = Math.sin(time * 1.4) * 0.12;
      g.rotation.y = Math.sin(time * 0.25) * 0.15;

      if (introActive) {
        // During intro: cube sits at mountain peak position, scales in
        g.position.set(0.0, 3.0 + floatOffset, -12.0);
        g.scale.setScalar(cubeT * 0.8);
      } else {
        // Normal scroll: Cube stays perfectly still at its location
        g.position.set(0.0, 3.0 + floatOffset, -12.0);
        g.scale.setScalar(0.8);
      }
    }
  });

  return (
    <>
      <color attach="background" args={['#020a17']} />
      
      {/* Cinematic Silhouette Lighting */}
      <ambientLight intensity={0.4} /> 
      
      {/* Soft fill light from front/top */}
      <directionalLight position={[0, 10, 15]} intensity={1.2} />

      {/* Cyan rim backlight for mountain silhouettes */}
      <directionalLight position={[0, 15, -30]} intensity={3.0} color="#00d2ff" />

      {/* Interactive 3D Objects — TechCube has its own internal pointLight */}
      <group ref={cubeGroupRef}>
        <TechCube scrollRef={scrollRef} />
      </group>
      
      {/* Forwarded Ref for dynamic shader updates */}
      <SnowyMountain ref={mountainRef} />
      <ParticleField count={200} />

    </>
  );
}
