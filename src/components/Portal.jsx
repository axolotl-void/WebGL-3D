import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// GLSL: HD Vortex Disc — the swirling energy plane inside the ring
// ═══════════════════════════════════════════════════════════════════════════════

const vortexVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - wp.xyz + vec3(0.0001));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const vortexFrag = /* glsl */ `
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  // Simplex-like hash noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  // FBM for more detail
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    // Multi-layer swirl
    float swirl1 = angle + 6.0 * dist - uTime * 2.5;
    float swirl2 = angle - 4.0 * dist + uTime * 1.8;

    float e1 = fbm(vec2(dist * 12.0 - uTime * 1.5, swirl1 * 2.0));
    float e2 = fbm(vec2(dist * 20.0 + uTime * 1.2, swirl2 * 3.0));
    float e3 = noise(vec2(swirl1 * 5.0 + uTime, dist * 25.0));
    float energy = e1 * 0.4 + e2 * 0.35 + e3 * 0.25;

    // Radial mask — circular cutout with soft edge
    float rim = smoothstep(0.50, 0.18, dist);
    float core = smoothstep(0.35, 0.0, dist);

    // Colour palette
    vec3 cyan   = vec3(0.0, 0.85, 1.0);
    vec3 purple = vec3(0.45, 0.0, 1.0);
    vec3 white  = vec3(1.0, 0.97, 1.0);
    vec3 blue   = vec3(0.05, 0.2, 0.9);

    vec3 col = mix(purple, cyan, smoothstep(0.05, 0.42, dist + energy * 0.12));
    col = mix(col, blue, e2 * 0.4);
    col = mix(col, white, core * 1.8 + energy * 0.35);

    // Bright filaments
    float filament = smoothstep(0.62, 0.72, energy) * 1.5;
    col += white * filament;

    // Fresnel rim glow
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 3.0);
    col += cyan * fresnel * 2.0;

    // Breathing pulse
    float pulse = 0.92 + 0.08 * sin(uTime * 3.5);
    float alpha = rim * (0.15 + energy * 0.85) * pulse;

    // Hot centre
    if (dist < 0.035) {
      col += vec3(2.0) * (1.0 - dist / 0.035);
      alpha = 1.0;
    }

    gl_FragColor = vec4(col * 3.0, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// GLSL: Emissive Torus Ring — the gate frame
// ═══════════════════════════════════════════════════════════════════════════════

const ringVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFrag = /* glsl */ `
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 cyan = vec3(0.0, 0.9, 1.0);
    vec3 purple = vec3(0.5, 0.0, 1.0);
    vec3 dark = vec3(0.02, 0.05, 0.12);

    // Scrolling energy lines along torus tube
    float line = sin(vUv.x * 80.0 + uTime * 4.0) * 0.5 + 0.5;
    line = pow(line, 8.0);

    // Cross-hatch glow
    float cross1 = sin(vUv.x * 200.0 - uTime * 6.0) * 0.5 + 0.5;
    cross1 = pow(cross1, 16.0) * 0.5;

    // Base metallic colour with energy bands
    vec3 col = dark + cyan * 0.15;
    col += cyan * line * 0.8;
    col += purple * cross1;

    // Fresnel rim on the ring itself
    vec3 viewDir = normalize(cameraPosition - vWorldPos + vec3(0.0001));
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.5);
    col += cyan * fresnel * 1.2;

    // Subtle pulse
    col *= 0.9 + 0.1 * sin(uTime * 2.5 + vUv.x * 12.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// GLSL: Electric Lightning Arcs (line shader)
// ═══════════════════════════════════════════════════════════════════════════════

const boltVert = /* glsl */ `
  attribute float aProgress;
  uniform float uTime;
  uniform float uSeed;

  varying float vProgress;
  varying float vIntensity;

  // Hash for displacement
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vProgress = aProgress;

    vec3 pos = position;

    // Jitter the bolt sideways based on progress and time for a flickering electric feel
    float jitterFreq = 30.0 + uSeed * 10.0;
    float jitterAmp = 0.12 * (1.0 - abs(aProgress * 2.0 - 1.0)); // tapers at ends
    float phase = uTime * 15.0 + uSeed * 100.0;
    pos.x += sin(aProgress * jitterFreq + phase) * jitterAmp;
    pos.y += cos(aProgress * jitterFreq * 1.3 + phase * 0.7) * jitterAmp * 0.6;

    // Intensity flicker
    vIntensity = 0.5 + 0.5 * sin(uTime * 20.0 + uSeed * 50.0 + aProgress * 10.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const boltFrag = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;

  varying float vProgress;
  varying float vIntensity;

  void main() {
    vec3 cyan = vec3(0.2, 0.9, 1.0);
    vec3 white = vec3(1.0);

    // Hotter in the middle of the arc
    float core = 1.0 - abs(vProgress * 2.0 - 1.0);
    core = pow(core, 0.5);

    vec3 col = mix(cyan, white, core * 0.7 + vIntensity * 0.3);

    // Random full-bolt flicker (entire bolt blinks)
    float blink = step(0.3, fract(sin(uTime * 8.0 + uSeed * 77.0) * 43758.5));

    float alpha = core * blink * (0.6 + vIntensity * 0.4);

    gl_FragColor = vec4(col * 3.5, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// GLSL: Rune Particles orbiting the ring
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
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float glow = 1.0 - d;
    glow = pow(glow, 1.5);
    vec3 col = vec3(0.3, 0.9, 1.0);
    gl_FragColor = vec4(col * 2.5, glow * vAlpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// Geometry builders (ponytail: pure procedural, no GLTF dependency)
// ═══════════════════════════════════════════════════════════════════════════════

function buildBoltGeometry(segCount, fromAngle, toAngle, radius) {
  const positions = new Float32Array(segCount * 3);
  const progress = new Float32Array(segCount);
  for (let i = 0; i < segCount; i++) {
    const t = i / (segCount - 1);
    const angle = fromAngle + (toAngle - fromAngle) * t;
    positions[i * 3]     = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = 0;
    progress[i] = t;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1));
  return geo;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Portal Component
// ═══════════════════════════════════════════════════════════════════════════════

const RING_RADIUS = 1.0;
const TUBE_RADIUS = 0.08;
const BOLT_COUNT = 8;
const PARTICLE_COUNT = 60;

export default function Portal({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.018 }) {
  const groupRef = useRef();

  // ponytail: visual radius target ≈ 2.0 world units at scale=0.006 for dramatic presence
  // s = (scale / 0.006) * 0.8
  const s = (scale / 0.006) * 0.8;

  // ── Vortex disc ──
  const vortexUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  // ── Ring ──
  const ringUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  // ── Electric bolts ──
  const bolts = useMemo(() => {
    const arr = [];
    for (let i = 0; i < BOLT_COUNT; i++) {
      const fromAngle = Math.random() * Math.PI * 2;
      const span = 0.6 + Math.random() * 1.8; // arc length in radians
      const r = RING_RADIUS * (0.65 + Math.random() * 0.5);
      const geo = buildBoltGeometry(64, fromAngle, fromAngle + span, r);
      const uni = {
        uTime: { value: 0 },
        uSeed: { value: Math.random() * 100 },
      };
      arr.push({ geo, uni });
    }
    return arr;
  }, []);

  // ── Orbiting rune particles ──
  const particleGeo = useMemo(() => {
    const angles = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const radii  = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.3 + Math.random() * 0.7;
      radii[i]  = 0.85 + Math.random() * 0.3;
      phases[i] = Math.random() * Math.PI * 2;
    }
    // Dummy positions — vertex shader overrides them
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
  }), []);

  // ── Animation loop ──
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    vortexUniforms.uTime.value = t;
    ringUniforms.uTime.value = t;
    particleUniforms.uTime.value = t;
    bolts.forEach(b => { b.uni.uTime.value = t; });

    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.06;
      groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.5) * 0.03;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[s, s, s]}
    >
      {/* Inner group: shifted up by 1.0 local units so the portal base sits on the ground. Stands upright (default XY plane) */}
      <group position={[0, 1.0, 0]}>
        {/* ── HD Torus Ring (gate frame) ── */}
        <mesh>
          <torusGeometry args={[RING_RADIUS, TUBE_RADIUS, 64, 256]} />
          <shaderMaterial
            vertexShader={ringVert}
            fragmentShader={ringFrag}
            uniforms={ringUniforms}
          />
        </mesh>

        {/* ── Outer glow ring (thicker, additive) ── */}
        <mesh>
          <torusGeometry args={[RING_RADIUS, TUBE_RADIUS * 2.5, 32, 128]} />
          <meshBasicMaterial color="#00ccff" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* ── Energy Vortex Disc ── */}
        <mesh>
          <circleGeometry args={[RING_RADIUS * 0.95, 128]} />
          <shaderMaterial
            vertexShader={vortexVert}
            fragmentShader={vortexFrag}
            uniforms={vortexUniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* ── Electric Lightning Arcs ── */}
        {bolts.map((b, i) => (
          <line key={i} geometry={b.geo}>
            <shaderMaterial
              vertexShader={boltVert}
              fragmentShader={boltFrag}
              uniforms={b.uni}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </line>
        ))}

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

        {/* ── Volumetric glow lights (now aligned to front/back of the vertical gate) ── */}
        <pointLight intensity={12} distance={8} decay={1.5} color="#00d9ff" position={[0, 0, 0.3]} />
        <pointLight intensity={5}  distance={12} decay={2}   color="#7a00ff" position={[0, 0, -0.3]} />
      </group>
    </group>
  );
}
