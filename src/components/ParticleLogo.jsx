import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { samplePointsFromScene } from '../lib/samplePoints';

const PARTICLE_COUNT = 20000;

// ponytail: all logos share one container; only the particle shape + color swap.
const LOGOS = [
  { url: '/models/3d_model/3d-logo-axolotl.glb', color: '#00d2ff' },
  { url: '/models/3d_model/3d-logi-wa.glb', color: '#25D366' },
  { url: '/models/3d_model/3d-logo-instagram.glb', color: '#E4405F' },
  { url: '/models/3d_model/3d-logo-gmail.glb', color: '#D44638' },
];

const LOGO_SCALE = 9.0;
const CYL_RADIUS = 7.0 / LOGO_SCALE;   // ~0.778
const CYL_HALF_H = 6.0 / LOGO_SCALE;   // ~0.667

// Formation phase: simple exponential lerp toward the target shape
// (instead of a spring). Lerp has no inertia, so particles glide smoothly
// back into the new logo with no oscillation / pulsing.
const FORM_LERP = 0.045;            // ~45 ms half-life at 60fps
const MOUSE_SPRING = 0.004;
const MOUSE_DAMP = 0.98;
// Scatter phase: particles get a vortex-style velocity — radial outward (from
// each particle's current XZ position) plus a tangential swirl around the Y axis.
// All particles rotate the same direction so the whole cloud looks like a galaxy
// explosion. After SCATTER_DURATION seconds, the form phase kicks in.
const SCATTER_DURATION = 0.9;     // seconds — slow, gradual spread
const SCATTER_DAMP = 0.92;         // light damping during scatter
const SCATTER_SPEED_MIN = 0.012;
const SCATTER_SPEED_MAX = 0.034;
const SCATTER_SWIRL_RATIO = 1.2;  // tangential speed / radial speed (decisive swirl)
const SCATTER_Y_JITTER = 0.012;   // small vertical perturbation for chaos
const SCATTER_RAMP_IN = 0.18;     // velocity ramps 0 → target over this many seconds (no abrupt kick)
const SCATTER_TARGET_BOOST = 1.2; // compensate ramp-up so the dispersal distance stays similar
const CONVERGE_EPS = 0.0004;

export default function ParticleLogo({ scrollRef }) {
  const axolotlScene = useGLTF('/models/3d_model/3d-logo-axolotl.glb').scene;
  const waScene = useGLTF('/models/3d_model/3d-logi-wa.glb').scene;
  const igScene = useGLTF('/models/3d_model/3d-logo-instagram.glb').scene;
  const gmailScene = useGLTF('/models/3d_model/3d-logo-gmail.glb').scene;

  const groupRef = useRef();
  const logoRef = useRef();
  const cylinderRef = useRef();
  const materialRef = useRef();
  const { raycaster, camera, pointer } = useThree();

  const initedRef = useRef(false);
  const positionsByLogo = useRef([null, null, null, null]);
  const origPositionsRef = useRef(null);
  const velocitiesRef = useRef(null);
  const lastLogoRef = useRef(0);
  const formingRef = useRef(false);
  const scatterTimerRef = useRef(0);
  const scatterTargetRef = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const lastTimeRef = useRef(0);
  const pointsGeoRef = useRef(new THREE.BufferGeometry());

  // ponytail: pre-allocate temps outside frame loop to avoid GC
  const _plane = useMemo(() => new THREE.Plane(), []);
  const _camDir = useMemo(() => new THREE.Vector3(), []);
  const _mouseWorld = useMemo(() => new THREE.Vector3(), []);
  const _logoWorld = useMemo(() => new THREE.Vector3(), []);
  const _invMat = useMemo(() => new THREE.Matrix4(), []);
  const _mouseLocal = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();
    const dt = Math.min(0.05, t - lastTimeRef.current);
    lastTimeRef.current = t;

    const scroll = scrollRef ? scrollRef.current : 0;
    if (scroll < 0.75) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    // Lazy init at Zone 3 entry: sample all logos once.
    if (!initedRef.current) {
      initedRef.current = true;
      const a = samplePointsFromScene(axolotlScene, PARTICLE_COUNT);
      const w = samplePointsFromScene(waScene, PARTICLE_COUNT);
      const i = samplePointsFromScene(igScene, PARTICLE_COUNT);
      const g = samplePointsFromScene(gmailScene, PARTICLE_COUNT);
      positionsByLogo.current[0] = new Float32Array(a);
      positionsByLogo.current[1] = new Float32Array(w);
      positionsByLogo.current[2] = new Float32Array(i);
      positionsByLogo.current[3] = new Float32Array(g);
      velocitiesRef.current = new Float32Array(PARTICLE_COUNT * 3);
      origPositionsRef.current = positionsByLogo.current[0];
      pointsGeoRef.current.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(a), 3)
      );
    }

    const activeLogo = window.__activeLogo ?? 0;

    // Detect switch → scatter old shape outward, swap target shape, change color.
    if (activeLogo !== lastLogoRef.current) {
      lastLogoRef.current = activeLogo;
      origPositionsRef.current = positionsByLogo.current[activeLogo];
      triggerScatter();
      if (materialRef.current) {
        materialRef.current.color.set(LOGOS[activeLogo].color);
      }
    }

    // 1. Smooth hover floating
    groupRef.current.position.y = -0.5 + Math.sin(t * 0.8) * 0.08;

    // 2. Rotate the particle logo
    if (logoRef.current) {
      logoRef.current.rotation.y = t * 0.4;
      logoRef.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    }

    // 3. Slow counter-rotation of the cylinder wireframe
    if (cylinderRef.current) {
      cylinderRef.current.rotation.y = -t * 0.05;
    }

    // 4. Physics
    if (!logoRef.current || !pointsGeoRef.current.attributes.position) return;

    const pos = pointsGeoRef.current.attributes.position.array;
    const orig = origPositionsRef.current;
    const vel = velocitiesRef.current;

    // Raycast onto a plane at logo center, facing camera
    raycaster.setFromCamera(pointer, camera);
    groupRef.current.getWorldPosition(_logoWorld);
    camera.getWorldDirection(_camDir);
    _plane.setFromNormalAndCoplanarPoint(_camDir.negate(), _logoWorld);
    const hit = raycaster.ray.intersectPlane(_plane, _mouseWorld);

    if (hit) {
      _invMat.copy(logoRef.current.matrixWorld).invert();
      _mouseLocal.copy(_mouseWorld).applyMatrix4(_invMat);
    }

    const forming = formingRef.current;
    const inScatter = scatterTimerRef.current > 0;

    // scatterRamp: 0 → 1 over SCATTER_RAMP_IN seconds at the START of scatter phase.
    // Particles start at rest and accelerate into the vortex, no abrupt kick.
    let scatterRamp = 0;
    if (inScatter) {
      const elapsed = SCATTER_DURATION - scatterTimerRef.current;
      scatterRamp = Math.min(1, elapsed / SCATTER_RAMP_IN);
    }

    let kSpring, damping, repRadius;
    if (inScatter) {
      kSpring = 0;
      damping = SCATTER_DAMP;
      repRadius = 0;
    } else if (forming) {
      kSpring = 0;
      damping = 1;
      repRadius = 0;
    } else {
      kSpring = MOUSE_SPRING;
      damping = MOUSE_DAMP;
      repRadius = 0.18;
    }
    const repStrength = 0.2;

    const scatterTarget = scatterTargetRef.current;
    let sumSq = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;

      // Mouse repulsion (disabled during scatter / formation)
      if (hit && !forming && !inScatter) {
        const dx = pos[ix] - _mouseLocal.x;
        const dy = pos[iy] - _mouseLocal.y;
        const dz = pos[iz] - _mouseLocal.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < repRadius && dist > 0.001) {
          const force = repStrength * (1 - dist / repRadius);
          vel[ix] += (dx / dist) * force;
          vel[iy] += (dy / dist) * force;
          vel[iz] += (dz / dist) * force;
        }
      }

      if (inScatter) {
        // Override velocity with target * ramp (smooth acceleration, no kick)
        vel[ix] = scatterTarget[ix] * scatterRamp;
        vel[iy] = scatterTarget[iy] * scatterRamp;
        vel[iz] = scatterTarget[iz] * scatterRamp;
      } else if (forming) {
        // Pure lerp toward target — no spring, no inertia, no oscillation.
        pos[ix] += (orig[ix] - pos[ix]) * FORM_LERP;
        pos[iy] += (orig[iy] - pos[iy]) * FORM_LERP;
        pos[iz] += (orig[iz] - pos[iz]) * FORM_LERP;
        vel[ix] = 0;
        vel[iy] = 0;
        vel[iz] = 0;
      } else {
        // Idle: spring + mouse repulsion
        vel[ix] += (orig[ix] - pos[ix]) * kSpring;
        vel[iy] += (orig[iy] - pos[iy]) * kSpring;
        vel[iz] += (orig[iz] - pos[iz]) * kSpring;
      }

      // Damping (only meaningful for scatter / idle branches)
      if (!forming) {
        vel[ix] *= damping;
        vel[iy] *= damping;
        vel[iz] *= damping;
      }

      // Update position (scatter / idle branches)
      if (!forming) {
        pos[ix] += vel[ix];
        pos[iy] += vel[iy];
        pos[iz] += vel[iz];
      }

      // Clamp to cylinder (Y-axis rotation invariant for XZ radius)
      const r = Math.sqrt(pos[ix] * pos[ix] + pos[iz] * pos[iz]);
      if (r > CYL_RADIUS) {
        pos[ix] *= CYL_RADIUS / r;
        pos[iz] *= CYL_RADIUS / r;
        vel[ix] *= -0.3;
        vel[iz] *= -0.3;
      }
      if (pos[iy] > CYL_HALF_H) { pos[iy] = CYL_HALF_H; vel[iy] *= -0.3; }
      if (pos[iy] < -CYL_HALF_H) { pos[iy] = -CYL_HALF_H; vel[iy] *= -0.3; }

      if (forming && !inScatter) {
        const dx = orig[ix] - pos[ix];
        const dy = orig[iy] - pos[iy];
        const dz = orig[iz] - pos[iz];
        sumSq += dx * dx + dy * dy + dz * dz;
      }
    }

    // Advance scatter phase, then start forming
    if (inScatter) {
      scatterTimerRef.current = Math.max(0, scatterTimerRef.current - dt);
      if (scatterTimerRef.current === 0) {
        formingRef.current = true;
      }
    }

    // End formation once particles have settled onto the target shape
    if (forming && !inScatter && sumSq / PARTICLE_COUNT < CONVERGE_EPS) {
      formingRef.current = false;
    }

    pointsGeoRef.current.attributes.position.needsUpdate = true;
  });

  // Vortex scatter: every particle spirals outward around the Y axis (galaxy-like).
  // Each particle's direction is based on its current XZ position so the whole cloud
  // rotates coherently while expanding. Tangential swirl dominates to make the
  // rotation clearly visible.
  // Particles start at rest; the loop ramps velocity from 0 → target over SCATTER_RAMP_IN
  // seconds (no abrupt kick).
  function triggerScatter() {
    scatterTimerRef.current = SCATTER_DURATION;
    formingRef.current = false;
    const pos = pointsGeoRef.current.attributes.position.array;
    const vel = velocitiesRef.current;
    const target = scatterTargetRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      const x = pos[ix], z = pos[iz];
      const horizR = Math.sqrt(x * x + z * z);
      // radial direction (outward from Y axis)
      let radX, radZ;
      if (horizR > 0.001) {
        radX = x / horizR;
        radZ = z / horizR;
      } else {
        // particle sits on the Y axis — pick a random radial direction
        const a = Math.random() * Math.PI * 2;
        radX = Math.cos(a);
        radZ = Math.sin(a);
      }
      // tangential direction in XZ (perpendicular to rad, rotates around Y)
      const tanX = -radZ;
      const tanZ = radX;

      const radialSpeed = (SCATTER_SPEED_MIN + Math.random() * (SCATTER_SPEED_MAX - SCATTER_SPEED_MIN)) * SCATTER_TARGET_BOOST;
      const swirlSpeed = radialSpeed * SCATTER_SWIRL_RATIO;

      target[ix] = radX * radialSpeed + tanX * swirlSpeed;
      target[iy] = (Math.random() - 0.5) * SCATTER_Y_JITTER;
      target[iz] = radZ * radialSpeed + tanZ * swirlSpeed;
      // Start at rest — velocity will ramp up smoothly in the loop
      vel[ix] = 0;
      vel[iy] = 0;
      vel[iz] = 0;
    }
    pointsGeoRef.current.attributes.position.needsUpdate = true;
  }

  return (
    <group ref={groupRef} position={[381.51, -0.5, -49.41]}>
      {/* Particle Logo */}
      <group ref={logoRef} scale={9.0}>
        <points geometry={pointsGeoRef.current}>
          <pointsMaterial
            ref={materialRef}
            color="#00d2ff"
            size={0.045}
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      {/* Holographic Container Cylinder (wireframe) — shared, never changes */}
      <mesh ref={cylinderRef}>
        <cylinderGeometry args={[7.0, 7.0, 12.0, 32, 10, true]} />
        <meshBasicMaterial
          color="#ffcc00"
          wireframe
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Top framing ring */}
      <mesh position={[0, 6.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.9, 7.1, 64]} />
        <meshBasicMaterial
          color="#ffcc00"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Bottom framing ring */}
      <mesh position={[0, -6.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.9, 7.1, 64]} />
        <meshBasicMaterial
          color="#ffcc00"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Bottom cap disc */}
      <mesh position={[0, -6.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.0, 64]} />
        <meshBasicMaterial
          color="#ffcc00"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Gauge rings (thin horizontal hoops along the cylinder height) */}
      {[-5, -3, -1, 1, 3, 5].map((y) => (
        <mesh key={`gauge-${y}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.9, 7.05, 64]} />
          <meshBasicMaterial
            color="#ffcc00"
            transparent
            opacity={0.42}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Compass tick marks on top ring (N/E/S/W) */}
      {[0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].map((angle, i) => (
        <mesh
          key={`tick-${i}`}
          position={[Math.cos(angle) * 7, 6.0, Math.sin(angle) * 7]}
        >
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshBasicMaterial
            color="#ffcc00"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload('/models/3d_model/3d-logo-axolotl.glb');
useGLTF.preload('/models/3d_model/3d-logi-wa.glb');
useGLTF.preload('/models/3d_model/3d-logo-instagram.glb');
useGLTF.preload('/models/3d_model/3d-logo-gmail.glb');
