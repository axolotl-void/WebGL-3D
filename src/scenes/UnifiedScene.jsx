import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import TechCube from '../components/TechCube';
import SnowyMountain from '../components/SnowyMountain';
import SecondMountain from '../components/SecondMountain';
import InteractiveCube from '../components/InteractiveCube';
import Portal from '../components/Portal';

// ─────────────────────────────────────────────────────────────────────────────
// Ambient Sparkling Particles (Floating Dust Field)
// ─────────────────────────────────────────────────────────────────────────────
function ParticleField({ count = 250 }) {
  const pointsRef = useRef();

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      spd[i] = 0.05 + Math.random() * 0.15;
    }
    return [pos, spd];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3 + 1] += speeds[i] * 0.15;
      if (posAttr.array[i * 3 + 1] > 15) posAttr.array[i * 3 + 1] = -15;
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15} color="#00d2ff" transparent opacity={0}
        depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Scene: Single 3D world with seamless camera flight
//
// Zone 1 (Z: +16 to -12)  → SnowyMountain + TechCube + Particles
// Zone 2 (Z: -90 to -100) → SecondMountain + Stars
//
// ponytail: all objects use custom shaders with hardcoded lighting,
// so Three.js lights are mostly for any future non-shader objects.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────


const ZONE2_Z = -45;

// Hardcoded portal coordinates chosen by the user
const PORTAL_POS = [3.50, -3.10, -7.05];
const PORTAL_SCALE = 0.0060;
const PORTAL_ROT_Y = 4.60;

export default function UnifiedScene() {
  const { camera } = useThree();
  const cubeGroupRef = useRef();
  const mountainRef = useRef();
  const secondMountainRef = useRef();
  const zone1Ref = useRef();
  const zone2Ref = useRef();

  const scrollRef = useRef(0);
  const targetScrollRef = useRef(0);

  // Intro camera constants (allocated once)
  const introCamStart = useMemo(() => new THREE.Vector3(0, 25, 40), []);
  const introLookStart = useMemo(() => new THREE.Vector3(0, 0, -12), []);

  // Background colors for zone blending
  const bgColor1 = useMemo(() => new THREE.Color('#020a17'), []);
  const bgColor2 = useMemo(() => new THREE.Color('#050510'), []);

  // ── Zone 1 Camera Position Spline ──
  const zone1Curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.2, 16.0),
    new THREE.Vector3(0, 1.2, -6.0)
  ]), []);

  // ── Zone 2 Camera Position Spline (using exact coordinates from tracker) ──
  const zone2Positions = useMemo(() => [
    new THREE.Vector3(-1.85, -1.94, -64.83), // Exact screenshot position
    new THREE.Vector3(-0.62, -0.67, ZONE2_Z - 16.15),
    new THREE.Vector3(-2.04, -1.17, ZONE2_Z - 13.32)
  ], []);

  // ── Zone 2 Camera Rotation Spline (using exact Quaternions from tracker) ──
  const zone2Quaternions = useMemo(() => [
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-3.14, -0.21, 3.14)), // Exact screenshot rotation
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-2.93, -0.10, -3.12)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-2.90, -0.54, -3.01))
  ], []);

  const zone2PosCurve = useMemo(() => new THREE.CatmullRomCurve3(zone2Positions), [zone2Positions]);

  // Mapped 5 interactive cubes with hardcoded custom coordinates set by user in Zone 2
  const zone2Cubes = useMemo(() => [
    [-2.00, -2.83, -9.10], // Kubus 0
    [0.20, -3.30, -8.30],  // Kubus 1
    [-1.50, -3.01, -8.70], // Kubus 2
    [3.00, -3.55, -9.00],  // Kubus 3
    [-0.20, -3.21, -6.50]  // Kubus 4
  ], []);

  // Track browser scroll
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      targetScrollRef.current = window.scrollY / max;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smoothstep easing helper
  const ease = (t) => t * t * (3.0 - 2.0 * t);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();



    // ═══════════════════════════════════════════════════════════════════════
    // SCROLL INTERPOLATION
    // ═══════════════════════════════════════════════════════════════════════
    scrollRef.current = THREE.MathUtils.lerp(
      scrollRef.current,
      targetScrollRef.current,
      0.065
    );
    const scroll = scrollRef.current;

    // ═══════════════════════════════════════════════════════════════════════
    // INTRO ANIMATION (first ~5 seconds)
    // ═══════════════════════════════════════════════════════════════════════
    const introDuration = 5.0;
    const introT = Math.min(time / introDuration, 1.0);
    const introActive = introT < 1.0;
    const introEased = ease(introT);

    // Drive Zone 1 mountain shader intro (terrain reveal + wireframe propagation)
    if (mountainRef.current?.uniforms) {
      const u = mountainRef.current.uniforms;
      u.uRevealProgress.value = ease(Math.min(introT / 0.6, 1.0));
      u.uWireProgress.value = Math.min(introT / 0.5, 1.0);

      // Fade out mountain 1 as scroll goes from 0.15 to 0.30 (before camera clips it)
      const fadeStart = 0.15;
      const fadeEnd = 0.30;
      u.uOpacity.value = 1.0 - THREE.MathUtils.mapLinear(
        THREE.MathUtils.clamp(scroll, fadeStart, fadeEnd),
        fadeStart,
        fadeEnd,
        0.0,
        1.0
      );
    }

    // Cube appears after terrain is mostly revealed
    const cubeT = ease(Math.max(0, (introT - 0.65) / 0.35));




    // ═══════════════════════════════════════════════════════════════════════
    // CAMERA POSITION AND ROTATION INTERPOLATION
    // ponytail: split camera flight into 3 distinct phases to apply exact
    // tracker coordinates and quaternions during Zone 2 explore
    // ═══════════════════════════════════════════════════════════════════════
    const targetPos = new THREE.Vector3();
    const targetRot = new THREE.Quaternion();

    // Fade out mouse parallax as we leave Zone 1
    const parallaxFade = 1.0 - ease(Math.min(Math.max((scroll - 0.15) / 0.15, 0), 1));
    const mouseX = state.pointer.x * 1.0 * parallaxFade;
    const mouseY = state.pointer.y * 0.6 * parallaxFade;

    // The peak of the portal transition happens at scroll = 0.24.
    // We instantly teleport the camera to Zone 2 when scroll passes 0.24,
    // hiding any physical camera movement or spinning behind the shader distortion.
    const portalPeakScroll = 0.24;
    const zone2EndScroll = 0.75; // Phase 2 (explore) ends at scroll = 0.75

    if (scroll < portalPeakScroll) {
      // Phase 1: Zone 1 (scroll 0.00 to 0.24)
      const t = scroll / portalPeakScroll;
      targetPos.copy(zone1Curve.getPointAt(t));
      
      // Calculate lookAt rotation towards the TechCube
      const lookTarget = new THREE.Vector3(0, 3.0, -12.0);
      const m = new THREE.Matrix4();
      m.lookAt(targetPos, lookTarget, new THREE.Vector3(0, 1, 0));
      targetRot.setFromRotationMatrix(m);
    } else if (scroll < zone2EndScroll) {
      // Phase 2: Zone 2 Explore (scroll 0.24 to 0.75)
      if (scroll <= 0.35) {
        // Sit completely still at the entrance of Zone 2 while the portal fades out
        targetPos.copy(zone2Positions[0]);
        targetRot.copy(zone2Quaternions[0]);
      } else {
        // Move along the Zone 2 curve
        const t = (scroll - 0.35) / (zone2EndScroll - 0.35);
        targetPos.copy(zone2PosCurve.getPointAt(t));

        // Calculate slerp rotation for Zone 2 segments (exactly like SecondScene)
        const numSegments = zone2Quaternions.length - 1;
        const scaledT = t * numSegments;
        const index = Math.min(Math.floor(scaledT), numSegments - 1);
        const localT = scaledT - index;
        targetRot.slerpQuaternions(zone2Quaternions[index], zone2Quaternions[index + 1], ease(localT));
      }
    } else {
      // Phase 3: Zoom into Portal (scroll 0.75 to 1.00)
      const t = (scroll - zone2EndScroll) / (1.00 - zone2EndScroll);
      
      const startPos = zone2Positions[zone2Positions.length - 1];
      const startRot = zone2Quaternions[zone2Quaternions.length - 1];
      
      // Portal center is at PORTAL_POS[1] + torus world radius (2.0)
      const openingY = PORTAL_POS[1] + 2.0;
      const portalCenterPos = new THREE.Vector3(
        PORTAL_POS[0],
        openingY,
        PORTAL_POS[2] + ZONE2_Z
      );
      
      // Calculate normal direction of the portal
      const forwardX = Math.sin(PORTAL_ROT_Y) * 2.0;
      const forwardZ = Math.cos(PORTAL_ROT_Y) * 2.0;
      
      // Pass through the portal to the back side (subtract normal vector since it points towards camera)
      const portalPassPos = new THREE.Vector3(
        PORTAL_POS[0] - forwardX,
        openingY,
        PORTAL_POS[2] + ZONE2_Z - forwardZ
      );
      
      targetPos.lerpVectors(startPos, portalPassPos, ease(t));
      
      // ponytail: add a vertical arc to fly over the mountain ridge and swoop down into the portal
      const heightOffset = Math.sin(t * Math.PI) * 4.5;
      targetPos.y += heightOffset;
      
      // Face forward towards a target far behind the portal so the camera never spins around when crossing the plane
      const farLookTarget = new THREE.Vector3(
        PORTAL_POS[0] - forwardX * 25.0,
        openingY,
        PORTAL_POS[2] + ZONE2_Z - forwardZ * 25.0
      );
      
      const lookMat = new THREE.Matrix4();
      lookMat.lookAt(targetPos, farLookTarget, new THREE.Vector3(0, 1, 0));
      const lookRot = new THREE.Quaternion().setFromRotationMatrix(lookMat);
      
      targetRot.slerpQuaternions(startRot, lookRot, ease(t));
    }

    if (introActive) {
      // Dramatic swoop from above down to start position (0.0 scroll position)
      const introPos = new THREE.Vector3(0, 25, 40);
      const startLookTarget = new THREE.Vector3(0, 0, -12);
      const mStart = new THREE.Matrix4();
      mStart.lookAt(introPos, startLookTarget, new THREE.Vector3(0, 1, 0));
      const introRot = new THREE.Quaternion().setFromRotationMatrix(mStart);

      camera.position.lerpVectors(introPos, targetPos, introEased);
      camera.quaternion.slerpQuaternions(introRot, targetRot, introEased);
    } else {
      // Lerp camera position & quaternion for buttery smoothness
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetPos.x + mouseX, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetPos.y + mouseY, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetPos.z, 0.05);
      camera.quaternion.slerp(targetRot, 0.05);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE 1: CUBE PORTAL ANIMATION
    // ponytail: cube scales up as camera approaches, flash covers the
    // camera jump to Zone 2, then fades to reveal the new scene
    // ═══════════════════════════════════════════════════════════════════════
    if (cubeGroupRef.current) {
      const g = cubeGroupRef.current;
      const floatOffset = Math.sin(time * 1.4) * 0.12;
      g.rotation.y = Math.sin(time * 0.25) * 0.15;
      g.position.set(0.0, 3.0 + floatOffset, -12.0);

      // Portal zone: scroll 0.15 → 0.25
      // Cube grows from 0.8 → 4.0 as camera flies into it
      const portalStart = 0.15;
      const portalPeak = 0.25;
      const portalProgress = ease(Math.min(Math.max((scroll - portalStart) / (portalPeak - portalStart), 0), 1));
      const baseScale = introActive ? cubeT * 0.8 : 0.8;
      const portalScale = THREE.MathUtils.lerp(baseScale, 5.0, portalProgress);
      g.scale.setScalar(portalScale);

      // Hide cube after portal is complete
      g.visible = scroll < portalPeak + 0.05;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE 1: Turn off rendering entirely when camera reaches Zone 2
    // ponytail: prevents GPU overheating by stopping background draw calls
    // ═══════════════════════════════════════════════════════════════════════
    if (zone1Ref.current) {
      zone1Ref.current.visible = scroll < 0.30;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PORTAL SHADER TRANSITION (WebGL post-processing)
    // ponytail: drives PortalTransition.jsx shader via global var;
    // ramps 0→1 (distortion builds) then 1→0 (distortion clears)
    // ═══════════════════════════════════════════════════════════════════════
    const portalIn = 0.18;
    const portalOut = 0.35;
    let shaderProgress = 0;
    if (scroll > portalIn && scroll <= portalPeakScroll) {
      shaderProgress = ease((scroll - portalIn) / (portalPeakScroll - portalIn));
    } else if (scroll > portalPeakScroll && scroll <= portalOut) {
      shaderProgress = 1.0 - ease((scroll - portalPeakScroll) / (portalOut - portalPeakScroll));
    }

    // Phase 3: Zoom into Portal transition (starts at scroll = 0.85, peaks at 0.98)
    const secondPortalIn = 0.85;
    const secondPortalPeak = 0.98;
    if (scroll > secondPortalIn) {
      const p = Math.min((scroll - secondPortalIn) / (secondPortalPeak - secondPortalIn), 1.0);
      shaderProgress = Math.max(shaderProgress, ease(p));
    }

    window.__portalProgress = shaderProgress;

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE 2: Hide until camera starts flying, then reveal
    // ponytail: prevents second mountain appearing as floating dot in Zone 1
    // ═══════════════════════════════════════════════════════════════════════
    if (zone2Ref.current) {
      zone2Ref.current.visible = scroll > 0.18;
    }
    if (secondMountainRef.current?.uniforms) {
      const zone2Progress = Math.min(Math.max((scroll - 0.35) / (zone2EndScroll - 0.35), 0), 1);
      secondMountainRef.current.uniforms.uRevealProgress.value = zone2Progress;
      // Cap the camera Z value during the transition scroll phase to prevent bright cyan flashes
      secondMountainRef.current.uniforms.uCameraZ.value = scroll >= 0.18 ? targetPos.z : -100.0;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BACKGROUND COLOR BLEND (Zone 1 → Zone 2)
    // ═══════════════════════════════════════════════════════════════════════
    const bgBlend = ease(Math.min(Math.max((scroll - 0.3) / 0.4, 0), 1));
    state.scene.background.copy(bgColor1).lerp(bgColor2, bgBlend);
  });

  return (
    <>
      <color attach="background" args={['#020a17']} />

      {/* ════════════ ZONE 1 LIGHTING ════════════ */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[0, 10, 15]} intensity={1.2} />
      <directionalLight position={[0, 15, -30]} intensity={3.0} color="#00d2ff" />

      {/* ════════════ ZONE 1 OBJECTS ════════════ */}
      <group ref={zone1Ref}>
        <group ref={cubeGroupRef}>
          <TechCube scrollRef={scrollRef} />
        </group>
        <SnowyMountain ref={mountainRef} />
        <ParticleField count={200} />
      </group>

      {/* Global Sky Stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* ════════════ ZONE 2 OBJECTS ════════════ */}
      <group ref={zone2Ref} position={[0, 0, ZONE2_Z]} visible={false}>
        <SecondMountain ref={secondMountainRef} />
        {zone2Cubes.map((pos, idx) => (
          <InteractiveCube
            key={idx}
            index={idx}
            position={pos}
          />
        ))}
        <Portal 
          position={PORTAL_POS} 
          scale={PORTAL_SCALE}
          rotation={[0, PORTAL_ROT_Y, 0]} 
        />
      </group>

      {/* ════════════ ZONE 2 ACCENT LIGHTING ════════════ */}
      <directionalLight position={[-15, 10, ZONE2_Z - 10]} intensity={3.5} color="#00ffff" />
      <directionalLight position={[15, 5, ZONE2_Z + 15]} intensity={2.5} color="#ff0055" />
    </>
  );
}
