import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// GLSL: Orbiting Rune Particles
// ═══════════════════════════════════════════════════════════════════════════════

const particleVert = /* glsl */ `
  attribute float aAngle;
  attribute float aSpeed;
  attribute float aRadius;
  attribute float aPhase;

  uniform float uTime;
  uniform float uRingRadius;

  varying float vAlpha;

  void main() {
    float t = uTime * aSpeed + aPhase;
    float a = aAngle + t;

    // Orbit coordinates around the portal structure
    vec3 pos = vec3(
      cos(a) * aRadius * uRingRadius,
      sin(a) * aRadius * uRingRadius + sin(t * 3.0) * 0.1,
      sin(t * 2.0 + aPhase) * 0.15
    );

    vAlpha = 0.4 + 0.6 * abs(sin(t * 5.0));

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (4.0 + 3.0 * sin(t * 4.0)) * (150.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const particleFrag = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    if (uOpacity < 0.001) {
      discard;
    }
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float glow = 1.0 - d;
    glow = pow(glow, 1.5);
    vec3 col = vec3(0.3, 0.9, 1.0);
    gl_FragColor = vec4(col * 2.5, glow * vAlpha * uOpacity);
  }
`;

const RING_RADIUS = 1.0;
const PARTICLE_COUNT = 40;

export default function Portal({ scrollRef, position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.018 }) {
  const groupRef = useRef();
  const light1Ref = useRef();
  const light2Ref = useRef();

  // Load the original 3D portal model
  const { scene } = useGLTF('/models/portal/scene.gltf');

  // ponytail: calculate visual multiplier matching original size
  const s = (scale / 0.006) * 0.8;

  // Create a shared neon wireframe material
  const wireMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00ffff'),
      wireframe: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  // Create a shared halo material
  const haloMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#00ccff',
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Center the 3D model around its bounding box and apply wireframe material
  const centeredScene = useMemo(() => {
    const cloned = scene.clone();
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = wireMaterial;
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y);
    const scaleFactor = 2.0 / maxDim; // Scale to radius of 1.0 (diameter 2.0)
    
    cloned.scale.setScalar(scaleFactor);
    cloned.position.copy(center).negate().multiplyScalar(scaleFactor);

    
    const wrapper = new THREE.Group();
    wrapper.add(cloned);
    return wrapper;
  }, [scene, wireMaterial]);

  // ── Orbiting rune particles ──
  const particleGeo = useMemo(() => {
    const angles = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const radii  = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.35 + Math.random() * 0.65;
      radii[i]  = 1.1 + Math.random() * 0.45;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aAngle',   new THREE.BufferAttribute(angles, 1));
    geo.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aRadius',  new THREE.BufferAttribute(radii, 1));
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
    return geo;
  }, []);

  const particleUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uRingRadius: { value: RING_RADIUS },
    uOpacity: { value: 1.0 },
  }), []);

  // ── Animation loop ──
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scroll = scrollRef ? scrollRef.current : 0;

    let opacity = 1.0;
    if (scroll < 0.75) {
      opacity = 1.0;
    } else if (scroll > 0.95) {
      opacity = 0.0;
    } else {
      opacity = 1.0 - (scroll - 0.75) / 0.20;
    }

    if (groupRef.current) {
      groupRef.current.visible = opacity > 0.001;
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.05;
      groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.4) * 0.04;
    }

    // Update uniforms & material properties
    wireMaterial.opacity = opacity;
    haloMaterial.opacity = 0.05 * opacity;
    particleUniforms.uTime.value = t;
    particleUniforms.uOpacity.value = opacity;

    if (light1Ref.current) light1Ref.current.intensity = 10.0 * opacity;
    if (light2Ref.current) light2Ref.current.intensity = 4.0 * opacity;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[s, s, s]}
    >
      {/* Inner group: shifted up by 1.0 local units to sit on the grid */}
      <group position={[0, 1.0, 0]}>
        
        {/* Render the 3D model scene */}
        <primitive object={centeredScene} />

        {/* ── Volumetric Outer Halo Glow (Additive) ── */}
        <mesh>
          <sphereGeometry args={[RING_RADIUS * 1.3, 32, 32]} />
          <primitive object={haloMaterial} attach="material" />
        </mesh>

        {/* ── Orbiting Rune Particles ── */}
        <points geometry={particleGeo}>
          <shaderMaterial
            vertexShader={particleVert}
            fragmentShader={particleFrag}
            uniforms={particleUniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* ── Volumetric glow lights that fade out smoothly with scroll ── */}
        <pointLight ref={light1Ref} distance={8} decay={1.5} color="#00d9ff" position={[0, 0, 0.3]} />
        <pointLight ref={light2Ref} distance={12} decay={2}   color="#7a00ff" position={[0, 0, -0.3]} />

      </group>
    </group>
  );
}
