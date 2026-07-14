import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ponytail: barycentric surface sampling — gives uniform distribution across triangles
function sampleTriangle(a, b, c) {
  let u = Math.random(), v = Math.random();
  if (u + v > 1) { u = 1 - u; v = 1 - v; }
  const w = 1 - u - v;
  return [
    a[0] * w + b[0] * u + c[0] * v,
    a[1] * w + b[1] * u + c[1] * v,
    a[2] * w + b[2] * u + c[2] * v,
  ];
}

function samplePointsFromScene(scene, count) {
  // Collect all triangles with world transforms applied
  const triangles = [];
  const areas = [];
  let totalArea = 0;
  const _v = new THREE.Vector3();

  scene.traverse((child) => {
    if (!child.isMesh) return;
    const geo = child.geometry;
    const pos = geo.attributes.position;
    const idx = geo.index;
    child.updateWorldMatrix(true, false);
    const mat = child.matrixWorld;

    const getVert = (i) => {
      _v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mat);
      return [_v.x, _v.y, _v.z];
    };

    const triCount = idx ? idx.count / 3 : pos.count / 3;
    for (let t = 0; t < triCount; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3;
      const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      const a = getVert(i0), b = getVert(i1), c = getVert(i2);

      // Triangle area via cross product
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const cx = ab[1] * ac[2] - ab[2] * ac[1];
      const cy = ab[2] * ac[0] - ab[0] * ac[2];
      const cz = ab[0] * ac[1] - ab[1] * ac[0];
      const area = 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (area > 0) {
        triangles.push([a, b, c]);
        areas.push(area);
        totalArea += area;
      }
    }
  });

  // Build CDF for area-weighted sampling
  const cdf = new Float64Array(areas.length);
  cdf[0] = areas[0] / totalArea;
  for (let i = 1; i < areas.length; i++) cdf[i] = cdf[i - 1] + areas[i] / totalArea;

  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let ti = 0;
    for (let j = 0; j < cdf.length; j++) { if (r <= cdf[j]) { ti = j; break; } }
    const [a, b, c] = triangles[ti];
    const p = sampleTriangle(a, b, c);
    points[i * 3] = p[0];
    points[i * 3 + 1] = p[1];
    points[i * 3 + 2] = p[2];
  }

  // Center and normalize to fit inside the container
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = points[i * 3], y = points[i * 3 + 1], z = points[i * 3 + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const cx2 = (minX + maxX) / 2, cy2 = (minY + maxY) / 2, cz2 = (minZ + maxZ) / 2;
  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const scale = 1.0 / maxDim;
  for (let i = 0; i < count; i++) {
    points[i * 3] = (points[i * 3] - cx2) * scale;
    points[i * 3 + 1] = (points[i * 3 + 1] - cy2) * scale;
    points[i * 3 + 2] = (points[i * 3 + 2] - cz2) * scale;
  }

  return points;
}

const PARTICLE_COUNT = 20000;

export default function AxolotlLogo({ scrollRef }) {
  const { scene } = useGLTF('/models/3d_model/3d-logo-axolotl.glb');
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

  // Cylinder bounds in logo local space (logo scale = 9.0)
  const LOGO_SCALE = 9.0;
  const CYL_RADIUS = 7.0 / LOGO_SCALE;   // ~0.778
  const CYL_HALF_H = 6.0 / LOGO_SCALE;   // ~0.667

  useFrame((state) => {
    if (!groupRef.current) return;

    const scroll = scrollRef ? scrollRef.current : 0;
    if (scroll < 0.75) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    // Lazy init: sample particles only on first Zone 3 entry
    if (!initedRef.current) {
      initedRef.current = true;
      const positions = samplePointsFromScene(scene, PARTICLE_COUNT);
      origPositions.current = new Float32Array(positions);
      velocities.current = new Float32Array(positions.length);
      pointsGeoRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }

    const t = state.clock.getElapsedTime();

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
      <group ref={logoRef} scale={9.0}>
        <points geometry={pointsGeoRef.current}>
          <pointsMaterial
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

      {/* Holographic Container Cylinder (wireframe) */}
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
    </group>
  );
}

useGLTF.preload('/models/3d_model/3d-logo-axolotl.glb');
