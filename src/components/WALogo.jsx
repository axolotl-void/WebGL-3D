import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { samplePointsFromScene } from '../lib/samplePoints';

const PARTICLE_COUNT = 12000;

export default function WALogo({ scrollRef }) {
  const { scene } = useGLTF('/models/3d_model/3d-logi-wa.glb');
  const groupRef = useRef();
  const logoRef = useRef();
  const cylinderRef = useRef();
  const { raycaster, camera, pointer } = useThree();

  // ponytail: lazy init — sampling blocks main thread, so defer until Zone 3 entry
  const initedRef = useRef(false);
  const origPositions = useRef(null);
  const velocities = useRef(null);
  const pointsGeoRef = useRef(new THREE.BufferGeometry());

  // ponytail: pre-allocate temps outside frame loop to avoid GC
  const _plane = useMemo(() => new THREE.Plane(), []);
  const _camDir = useMemo(() => new THREE.Vector3(), []);
  const _mouseWorld = useMemo(() => new THREE.Vector3(), []);
  const _logoWorld = useMemo(() => new THREE.Vector3(), []);
  const _invMat = useMemo(() => new THREE.Matrix4(), []);
  const _mouseLocal = useMemo(() => new THREE.Vector3(), []);

  // Cylinder bounds in logo local space (logo scale = 7.0)
  const LOGO_SCALE = 7.0;
  const CYL_RADIUS = 5.5 / LOGO_SCALE;   // ~0.786
  const CYL_HALF_H = 5.0 / LOGO_SCALE;   // ~0.714

  useFrame((state) => {
    if (!groupRef.current) return;

    const scroll = scrollRef ? scrollRef.current : 0;
    if (scroll < 0.75) {
      groupRef.current.visible = false;
      return;
    }

    // Lazy init at Zone 3 entry (same time as axolotl), NOT on first activation —
    // so toggling between logos is instant and never causes a sampling freeze.
    if (!initedRef.current) {
      initedRef.current = true;
      const positions = samplePointsFromScene(scene, PARTICLE_COUNT);
      origPositions.current = new Float32Array(positions);
      velocities.current = new Float32Array(positions.length);
      pointsGeoRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }

    const isActive = window.__activeLogo === 1;
    if (!isActive) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const t = state.clock.getElapsedTime();

    // 1. Smooth hover floating
    groupRef.current.position.y = -0.5 + Math.sin(t * 0.8) * 0.08;

    // 2. Rotate the particle logo (counter to axolotl)
    if (logoRef.current) {
      logoRef.current.rotation.y = -t * 0.35;
      logoRef.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    }

    // 3. Slow counter-rotation of the cylinder wireframe
    if (cylinderRef.current) {
      cylinderRef.current.rotation.y = -t * 0.05;
    }

    // 4. Mouse repulsion physics
    if (!logoRef.current || !pointsGeoRef.current.attributes.position) return;

    // Raycast onto a plane at logo center, facing camera
    raycaster.setFromCamera(pointer, camera);
    groupRef.current.getWorldPosition(_logoWorld);
    camera.getWorldDirection(_camDir);
    _plane.setFromNormalAndCoplanarPoint(_camDir.negate(), _logoWorld);
    const hit = raycaster.ray.intersectPlane(_plane, _mouseWorld);

    const pos = pointsGeoRef.current.attributes.position.array;
    const orig = origPositions.current;
    const vel = velocities.current;

    const repRadius = 0.18;
    const repStrength = 0.2;
    const kSpring = 0.004;
    const damping = 0.98;

    if (hit) {
      // Transform mouse world pos into logo local space
      _invMat.copy(logoRef.current.matrixWorld).invert();
      _mouseLocal.copy(_mouseWorld).applyMatrix4(_invMat);
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;

      // Mouse repulsion
      if (hit) {
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

      // Spring return to original position
      vel[ix] += (orig[ix] - pos[ix]) * kSpring;
      vel[iy] += (orig[iy] - pos[iy]) * kSpring;
      vel[iz] += (orig[iz] - pos[iz]) * kSpring;

      // Damping
      vel[ix] *= damping;
      vel[iy] *= damping;
      vel[iz] *= damping;

      // Update position
      pos[ix] += vel[ix];
      pos[iy] += vel[iy];
      pos[iz] += vel[iz];

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
    }

    pointsGeoRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={[381.51, -0.5, -49.41]}>
      {/* Particle Logo */}
      <group ref={logoRef} scale={7.0}>
        <points geometry={pointsGeoRef.current}>
          <pointsMaterial
            color="#25D366"
            size={0.05}
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      {/* Holographic Container Cylinder (wireframe) */}
      <mesh ref={cylinderRef}>
        <cylinderGeometry args={[5.5, 5.5, 10.0, 32, 10, true]} />
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
      <mesh position={[0, 5.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.4, 5.6, 64]} />
        <meshBasicMaterial
          color="#ffcc00"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Bottom framing ring */}
      <mesh position={[0, -5.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.4, 5.6, 64]} />
        <meshBasicMaterial
          color="#ffcc00"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Bottom cap disc */}
      <mesh position={[0, -5.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 64]} />
        <meshBasicMaterial
          color="#ffcc00"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/3d_model/3d-logi-wa.glb');
