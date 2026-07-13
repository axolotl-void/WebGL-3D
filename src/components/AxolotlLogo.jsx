import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Barycentric sampling helper to distribute points on the model surface
const samplePointsFromGLTF = (gltfScene, totalCount) => {
  gltfScene.updateMatrixWorld(true);
  
  const meshes = [];
  gltfScene.traverse((child) => {
    if (child.isMesh) {
      meshes.push(child);
    }
  });

  if (meshes.length === 0) return new Float32Array(0);

  const points = [];
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const tempPos = new THREE.Vector3();

  const pointsPerMesh = Math.ceil(totalCount / meshes.length);

  meshes.forEach((mesh) => {
    const geometry = mesh.geometry;
    const posAttr = geometry.attributes.position;
    if (!posAttr) return;

    const indexAttr = geometry.index;
    const faceCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

    for (let i = 0; i < pointsPerMesh; i++) {
      const faceIndex = Math.floor(Math.random() * faceCount);
      
      let i0, i1, i2;
      if (indexAttr) {
        i0 = indexAttr.getX(faceIndex * 3);
        i1 = indexAttr.getY(faceIndex * 3);
        i2 = indexAttr.getZ(faceIndex * 3);
      } else {
        i0 = faceIndex * 3;
        i1 = faceIndex * 3 + 1;
        i2 = faceIndex * 3 + 2;
      }

      vA.fromBufferAttribute(posAttr, i0);
      vB.fromBufferAttribute(posAttr, i1);
      vC.fromBufferAttribute(posAttr, i2);

      // Barycentric coordinates for uniform sampling on triangle face
      let u = Math.random();
      let v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;

      tempPos.set(0, 0, 0)
        .addScaledVector(vA, u)
        .addScaledVector(vB, v)
        .addScaledVector(vC, w);

      // Transform local vertex to GLTF root coordinate space
      tempPos.applyMatrix4(mesh.matrixWorld);

      points.push(tempPos.clone());
    }
  });

  // Clamp to exactly totalCount
  const finalPoints = points.slice(0, totalCount);

  // Center the points so the logo rotates around its actual center [0, 0, 0]
  const bbox = new THREE.Box3();
  finalPoints.forEach(p => bbox.expandByPoint(p));
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  finalPoints.forEach(p => p.sub(center));

  // Normalize size so maximum dimension is 1.0 (makes scaling predictable)
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    finalPoints.forEach(p => p.multiplyScalar(1.0 / maxDim));
  }

  const arr = new Float32Array(finalPoints.length * 3);
  for (let i = 0; i < finalPoints.length; i++) {
    arr[i * 3] = finalPoints[i].x;
    arr[i * 3 + 1] = finalPoints[i].y;
    arr[i * 3 + 2] = finalPoints[i].z;
  }
  return arr;
};

// Reusable Object3D to update InstancedMesh transforms without allocations
const tempObject = new THREE.Object3D();

export default function AxolotlLogo({ scrollRef }) {
  const { scene } = useGLTF('/models/3d_model/3d-logo-axolotl.glb');
  const groupRef = useRef();
  const meshRef = useRef();

  const particleCount = 12000; // Dense 3D particle shell

  // Generate particle positions, velocities, and initial states
  const [originalPositions, currentPositions, velocities] = useMemo(() => {
    const orig = samplePointsFromGLTF(scene, particleCount);
    const curr = new Float32Array(orig.length);
    curr.set(orig); // Start at original positions
    const vels = new Float32Array(orig.length); // All zeros initially
    return [orig, curr, vels];
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;

    const scroll = scrollRef ? scrollRef.current : 0;
    if (scroll < 0.75) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const t = state.clock.getElapsedTime();

    // 1. Slow rotation and breathing of the overall group
    groupRef.current.rotation.y = t * 0.25;
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.05;
    groupRef.current.position.y = -0.5 + Math.sin(t * 0.8) * 0.08;

    // 2. Mouse Repulsion in 3D using Raycasting onto the Logo's Plane
    const raycaster = state.raycaster;
    // Camera is looking along [-0.987, 0.00025, 0.160] (UnifiedScene.jsx Zone 3 rotation)
    const planeNormal = new THREE.Vector3(0.987, -0.00025, -0.160);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      new THREE.Vector3(375.81, -0.5, -62.67)
    );

    const mouse3d = new THREE.Vector3();
    let hasMouseIntersection = false;
    if (raycaster) {
      hasMouseIntersection = !!raycaster.ray.intersectPlane(plane, mouse3d);
    }

    // Convert mouse position to local space of the group
    const localMouse = new THREE.Vector3();
    if (hasMouseIntersection) {
      localMouse.copy(mouse3d);
      groupRef.current.worldToLocal(localMouse);
    }

    // Physics parameters (tweak for igloo.inc physics)
    const kSpring = 0.015;       // Tighter/slower return spring for fluid inertia
    const damping = 0.93;        // Less friction (coast longer after repulsion)
    const repulsionRadius = 0.45; // Local radius (appx 45% of logo width)
    const repulsionStrength = 0.75; // Stronger force to scatter/explode particles
    const noiseStrength = 0.0012; // Floating wave amplitude

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      
      const ox = originalPositions[idx];
      const oy = originalPositions[idx + 1];
      const oz = originalPositions[idx + 2];

      let px = currentPositions[idx];
      let py = currentPositions[idx + 1];
      let pz = currentPositions[idx + 2];

      let vx = velocities[idx];
      let vy = velocities[idx + 1];
      let vz = velocities[idx + 2];

      // A. Spring force pulling back to original position
      let ax = (ox - px) * kSpring;
      let ay = (oy - py) * kSpring;
      let az = (oz - pz) * kSpring;

      // B. Mouse repulsion force
      if (hasMouseIntersection) {
        const dx = px - localMouse.x;
        const dy = py - localMouse.y;
        const dz = pz - localMouse.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSq);

        if (dist < repulsionRadius && dist > 0.001) {
          // Strong exponential push
          const force = Math.pow(1.0 - dist / repulsionRadius, 2) * repulsionStrength;
          
          // Add some directional noise/turbulence to make the explosion look organic
          const noiseX = Math.sin(t * 5.0 + i) * 0.15;
          const noiseY = Math.cos(t * 5.0 + i) * 0.15;
          const noiseZ = Math.sin(t * 3.0 + i) * 0.15;

          ax += (dx / dist + noiseX) * force;
          ay += (dy / dist + noiseY) * force;
          az += (dz / dist + noiseZ) * force;
        }
      }

      // C. Fluid noise wave effect
      const noiseTimeX = t * 1.2 + oy * 3.0 + i * 0.15;
      const noiseTimeY = t * 1.0 + ox * 3.0 + i * 0.15;
      const noiseTimeZ = t * 0.8 + oz * 3.0 + i * 0.15;

      ax += Math.sin(noiseTimeX) * noiseStrength;
      ay += Math.cos(noiseTimeY) * noiseStrength;
      az += Math.sin(noiseTimeZ) * noiseStrength;

      // D. Integrate
      vx = (vx + ax) * damping;
      vy = (vy + ay) * damping;
      vz = (vz + az) * damping;

      px += vx;
      py += vy;
      pz += vz;

      // Save back
      currentPositions[idx] = px;
      currentPositions[idx + 1] = py;
      currentPositions[idx + 2] = pz;

      velocities[idx] = vx;
      velocities[idx + 1] = vy;
      velocities[idx + 2] = vz;

      // E. Update instanced mesh matrix
      tempObject.position.set(px, py, pz);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={[375.81, -0.5, -62.67]} scale={14.0}>
      <instancedMesh ref={meshRef} args={[null, null, particleCount]}>
        <icosahedronGeometry args={[0.007, 1]} />
        <meshStandardMaterial
          color="#00d2ff"
          emissive="#002d3f"
          emissiveIntensity={0.6}
          roughness={0.25}
          metalness={0.8}
        />
      </instancedMesh>
    </group>
  );
}

useGLTF.preload('/models/3d_model/3d-logo-axolotl.glb');
