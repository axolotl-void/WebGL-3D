import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// Doctor Strange Portal — Sling Ring Style
// ═══════════════════════════════════════════════════════════════════════════════

// ── Fiery ring shader (main ring + inner rings) ──
const ringVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFrag = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSpeed;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vPos;

  // Simple noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    if (uOpacity < 0.001) discard;

    // Convert UV to angular coordinates
    float angle = atan(vPos.y, vPos.x);
    float r = length(vPos.xy);

    // Animated fire along the ring
    float fire1 = noise(vec2(angle * 3.0 + uTime * uSpeed, r * 10.0 - uTime * 1.5));
    float fire2 = noise(vec2(angle * 5.0 - uTime * uSpeed * 0.7, r * 15.0 + uTime * 2.0));
    float fire3 = noise(vec2(angle * 8.0 + uTime * uSpeed * 1.3, r * 8.0));

    float fire = fire1 * 0.5 + fire2 * 0.35 + fire3 * 0.15;

    // Sparks — sharp bright spots
    float sparkle = noise(vec2(angle * 20.0 + uTime * 4.0, r * 30.0));
    sparkle = pow(max(sparkle - 0.75, 0.0) * 4.0, 3.0);

    // Doctor Strange orange-gold palette
    vec3 orange = vec3(1.0, 0.45, 0.0);
    vec3 gold = vec3(1.0, 0.75, 0.2);
    vec3 white = vec3(1.0, 0.95, 0.8);

    vec3 color = mix(orange, gold, fire);
    color += white * sparkle * 0.8;
    color *= uIntensity;

    float alpha = (fire * 0.7 + 0.3 + sparkle) * uOpacity;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Mandala / runic pattern shader ──
const mandalaVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const mandalaFrag = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vPos;

  #define PI 3.14159265

  void main() {
    if (uOpacity < 0.001) discard;

    float angle = atan(vPos.y, vPos.x);
    float r = length(vPos.xy);

    // Runic segments — geometric mandala pattern
    float segments = 12.0;
    float segAngle = mod(angle + PI, 2.0 * PI / segments);
    float segNorm = segAngle / (2.0 * PI / segments);

    // Thin geometric lines
    float line1 = abs(sin(segNorm * PI * 2.0));
    line1 = smoothstep(0.92, 0.98, line1);

    // Cross-hatch pattern
    float line2 = abs(sin((segNorm + 0.5) * PI * 4.0));
    line2 = smoothstep(0.95, 0.99, line2);

    // Radial tick marks
    float ticks = abs(sin(r * 30.0));
    ticks = smoothstep(0.93, 0.97, ticks) * 0.5;

    float pattern = max(line1, line2) + ticks;
    pattern = clamp(pattern, 0.0, 1.0);

    // Animate brightness
    float pulse = sin(uTime * 2.0 + r * 10.0) * 0.3 + 0.7;

    vec3 gold = vec3(1.0, 0.65, 0.1);
    vec3 color = gold * pattern * pulse;

    float alpha = pattern * pulse * uOpacity * 0.6;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Spark particles shader ──
const sparkVert = /* glsl */ `
  attribute float aAngle;
  attribute float aSpeed;
  attribute float aRadius;
  attribute float aPhase;
  attribute float aLife;

  uniform float uTime;

  varying float vAlpha;

  void main() {
    float t = uTime * aSpeed + aPhase;
    float a = aAngle + t;

    // Orbit + outward drift (sparks fly off)
    float drift = fract(t * 0.3) * 0.4;
    float radius = aRadius + drift;

    vec3 pos = vec3(
      cos(a) * radius,
      sin(a) * radius + sin(t * 5.0) * 0.03,
      sin(t * 3.0 + aPhase) * 0.08
    );

    // Fade out as spark drifts outward
    vAlpha = 1.0 - fract(t * 0.3);
    vAlpha = pow(vAlpha, 0.5) * aLife;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (2.0 + 2.0 * vAlpha) * (120.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const sparkFrag = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    if (uOpacity < 0.001) discard;

    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float glow = 1.0 - d;
    glow = pow(glow, 2.0);

    vec3 col = vec3(1.0, 0.6, 0.1);
    gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
  }
`;

const SPARK_COUNT = 60;

export default function Portal({ scrollRef, position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.018 }) {
  const groupRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const mandala1Ref = useRef();
  const mandala2Ref = useRef();

  // ponytail: visual multiplier matching original size
  const s = (scale / 0.006) * 0.8;

  // ── Uniforms ──
  const ringUniforms1 = useMemo(() => ({
    uTime: { value: 0 }, uOpacity: { value: 1.0 }, uSpeed: { value: 2.0 }, uIntensity: { value: 1.2 },
  }), []);
  const ringUniforms2 = useMemo(() => ({
    uTime: { value: 0 }, uOpacity: { value: 1.0 }, uSpeed: { value: -1.5 }, uIntensity: { value: 0.9 },
  }), []);
  const ringUniforms3 = useMemo(() => ({
    uTime: { value: 0 }, uOpacity: { value: 1.0 }, uSpeed: { value: 2.5 }, uIntensity: { value: 1.0 },
  }), []);
  const mandalaUniforms1 = useMemo(() => ({
    uTime: { value: 0 }, uOpacity: { value: 1.0 },
  }), []);
  const mandalaUniforms2 = useMemo(() => ({
    uTime: { value: 0 }, uOpacity: { value: 1.0 },
  }), []);
  const sparkUniforms = useMemo(() => ({
    uTime: { value: 0 }, uOpacity: { value: 1.0 },
  }), []);

  // ── Spark particle geometry ──
  const sparkGeo = useMemo(() => {
    const angles = new Float32Array(SPARK_COUNT);
    const speeds = new Float32Array(SPARK_COUNT);
    const radii = new Float32Array(SPARK_COUNT);
    const phases = new Float32Array(SPARK_COUNT);
    const life = new Float32Array(SPARK_COUNT);
    const pos = new Float32Array(SPARK_COUNT * 3);
    for (let i = 0; i < SPARK_COUNT; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.5 + Math.random() * 1.5;
      radii[i] = 0.9 + Math.random() * 0.2;
      phases[i] = Math.random() * Math.PI * 2;
      life[i] = 0.5 + Math.random() * 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aLife', new THREE.BufferAttribute(life, 1));
    return geo;
  }, []);

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
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.03;
    }

    // Rotate rings in opposite directions
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.8;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.5;
    if (ring3Ref.current) ring3Ref.current.rotation.z = t * 1.2;
    if (mandala1Ref.current) mandala1Ref.current.rotation.z = -t * 0.3;
    if (mandala2Ref.current) mandala2Ref.current.rotation.z = t * 0.2;

    // Update all uniforms
    const allUniforms = [ringUniforms1, ringUniforms2, ringUniforms3, mandalaUniforms1, mandalaUniforms2, sparkUniforms];
    for (const u of allUniforms) {
      u.uTime.value = t;
      u.uOpacity.value = opacity;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[s, s, s]}
    >
      {/* ── Outer fire ring (largest) ── */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[0.88, 1.0, 128]} />
        <shaderMaterial
          uniforms={ringUniforms1}
          vertexShader={ringVert}
          fragmentShader={ringFrag}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Middle fire ring ── */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[0.78, 0.86, 128]} />
        <shaderMaterial
          uniforms={ringUniforms2}
          vertexShader={ringVert}
          fragmentShader={ringFrag}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Inner fire ring ── */}
      <mesh ref={ring3Ref}>
        <ringGeometry args={[0.70, 0.76, 128]} />
        <shaderMaterial
          uniforms={ringUniforms3}
          vertexShader={ringVert}
          fragmentShader={ringFrag}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Mandala pattern ring (outer) ── */}
      <mesh ref={mandala1Ref}>
        <ringGeometry args={[0.86, 0.88, 128]} />
        <shaderMaterial
          uniforms={mandalaUniforms1}
          vertexShader={mandalaVert}
          fragmentShader={mandalaFrag}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Mandala pattern ring (inner) ── */}
      <mesh ref={mandala2Ref}>
        <ringGeometry args={[0.76, 0.78, 128]} />
        <shaderMaterial
          uniforms={mandalaUniforms2}
          vertexShader={mandalaVert}
          fragmentShader={mandalaFrag}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Sparks flying off the ring ── */}
      <points geometry={sparkGeo}>
        <shaderMaterial
          vertexShader={sparkVert}
          fragmentShader={sparkFrag}
          uniforms={sparkUniforms}
          transparent
          depthWrite={false}
        />
      </points>
    </group>
  );
}
