import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// ── Shaders Copied from TechCube.jsx for Identical Visual Styling ──
const cubeVert = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vec3 toCam = cameraPosition - wp.xyz;
    vViewDir = toCam / (length(toCam) + 0.0001);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cubeFrag = /* glsl */`
  uniform float uTime;
  uniform vec3  uColor;
  uniform vec3  uColorHot;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);

    vec2 uv = vUv;

    // Layer 1: large panels (3x3)
    vec2 st1 = uv * 3.0;
    vec2 id1 = floor(st1);
    vec2 f1 = fract(st1);
    float h1 = hash(id1);

    // Layer 2: medium panels (6x6)
    vec2 st2 = uv * 6.0;
    vec2 id2 = floor(st2);
    vec2 f2 = fract(st2);
    float h2 = hash(id2);

    // Layer 3: fine detail (12x12)
    vec2 st3 = uv * 12.0;
    vec2 id3 = floor(st3);
    vec2 f3 = fract(st3);
    float h3 = hash(id3);

    // Panel groove lines
    float groove1 = 1.0 - (smoothstep(0.0, 0.04, f1.x) * smoothstep(1.0, 0.96, f1.x)
                         * smoothstep(0.0, 0.04, f1.y) * smoothstep(1.0, 0.96, f1.y));
    float groove2 = 1.0 - (smoothstep(0.0, 0.05, f2.x) * smoothstep(1.0, 0.95, f2.x)
                         * smoothstep(0.0, 0.05, f2.y) * smoothstep(1.0, 0.95, f2.y));
    float groove3 = 1.0 - (smoothstep(0.0, 0.06, f3.x) * smoothstep(1.0, 0.94, f3.x)
                         * smoothstep(0.0, 0.06, f3.y) * smoothstep(1.0, 0.94, f3.y));

    float grooves = groove1;
    grooves = max(grooves, groove2 * step(0.3, h1));
    grooves = max(grooves, groove3 * step(0.6, h2));

    // Panel darkness variation
    float panelDark = 0.0;
    panelDark += step(0.82, h3) * 0.5;
    panelDark += step(0.90, h2) * 0.3;

    // Base face color
    float topGradient = smoothstep(0.0, 1.0, vUv.y);
    vec3 faceColor = mix(uColor * 0.6, mix(uColor * 0.8, uColorHot, 0.3), topGradient);

    float pulse = 0.9 + 0.1 * sin(uTime * 2.0);
    float fresnel = pow(1.0 - abs(dot(N, V)), 3.0);
    float coreGlow = smoothstep(0.7, 0.0, length(vUv - 0.5)) * 0.12;

    vec3 finalColor = faceColor;
    finalColor += fresnel * uColorHot * 1.5;
    finalColor += panelDark * uColor * 0.3;
    finalColor += coreGlow * uColorHot * 2.2;

    vec3 grooveColor = mix(uColor, uColorHot, 0.3) * 0.9 * pulse;
    vec3 color = mix(finalColor, grooveColor, grooves);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ── Pre-calculate 12 grid pieces for overall size 0.35 (2x3x2 grid) ──
const CUBE_SIZE = 0.35;
const GAP = 0.005;
const COLS_X = 2;
const COLS_Y = 3;
const COLS_Z = 2;
const PIECE_W = CUBE_SIZE / COLS_X;
const PIECE_H = CUBE_SIZE / COLS_Y;
const PIECE_D = CUBE_SIZE / COLS_Z;

const piecesData = [];
for (let iy = 0; iy < COLS_Y; iy++) {
  for (let ix = 0; ix < COLS_X; ix++) {
    for (let iz = 0; iz < COLS_Z; iz++) {
      const cx = (ix - (COLS_X - 1) / 2) * (PIECE_W + GAP);
      const cy = (iy - (COLS_Y - 1) / 2) * (PIECE_H + GAP);
      const cz = (iz - (COLS_Z - 1) / 2) * (PIECE_D + GAP);
      const dir = new THREE.Vector3(cx, cy, cz).normalize();
      if (dir.length() === 0) dir.set(0, 1, 0);
      piecesData.push({ cx, cy, cz, dir });
    }
  }
}

const CUBE_LABEL_MAPPING = {
  0: {
    icon: '👤',
    num: '01',
    title: 'IDENTITY',
    items: ['PROFILE', 'DEVELOPER', 'INDONESIA'],
    lineHeight: '140px'
  },
  2: {
    icon: '🎓',
    num: '02',
    title: 'EDUCATION',
    items: ['COMPUTER SCIENCE', 'UBBG', '2022 — PRESENT'],
    lineHeight: '100px'
  },
  4: {
    icon: '⟨/⟩',
    num: '03',
    title: 'SKILLS',
    items: ['REACT', 'NEXT.JS', 'WEBGL'],
    lineHeight: '130px'
  },
  1: {
    icon: '🏆',
    num: '04',
    title: 'ACHIEVEMENTS',
    items: ['CERTIFICATES', 'AWARDS', 'ARCHIVE'],
    lineHeight: '110px'
  }
};

export default function InteractiveCube({ position, index, onClick, scrollRef }) {
  const groupRef = useRef();
  const labelGroupRef = useRef();
  const pieceRefs = useRef([]);
  const pointLightRef = useRef();
  const containerRef = useRef();
  const [hovered, setHovered] = useState(false);
  const explodeTRef = useRef(0);
  const hitboxRef = useRef();

  const cyan = useMemo(() => new THREE.Color('#00bbff'), []);
  const hotWhite = useMemo(() => new THREE.Color('#c0edff'), []);

  // Sync phase and speed to make each cube unique
  const randomPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const randomSpeed = useMemo(() => 0.5 + Math.random() * 0.5, []);

  const labelData = CUBE_LABEL_MAPPING[index];

  // Shared uniforms for the pieces
  const outerUniforms = useMemo(() => ({
    uTime:     { value: 0 },
    uColor:    { value: cyan },
    uColorHot: { value: hotWhite },
  }), [cyan, hotWhite]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    outerUniforms.uTime.value = t;

    // Smoothly lerp explode progress (0.0 when normal, 1.0 when hovered)
    const target = hovered ? 1.0 : 0.0;
    explodeTRef.current += (target - explodeTRef.current) * 0.12; 
    const eT = explodeTRef.current;

    const bob = Math.sin(t * 1.5 + randomPhase) * 0.05;

    if (groupRef.current) {
      // Bobbing up and down (smaller amplitude for ground cubes)
      groupRef.current.position.y = bob;
      // Rotation of the entire mini cube
      groupRef.current.rotation.x = t * 0.15 * randomSpeed;
      groupRef.current.rotation.y = t * 0.25 * randomSpeed;
    }

    if (labelGroupRef.current) {
      // Match the tech cube's bobbing perfectly
      labelGroupRef.current.position.y = bob;
    }

    // Explode pieces outward on hover (smaller distance to match smaller size)
    const maxExplodeDistance = 0.15;
    for (let i = 0; i < piecesData.length; i++) {
      const mesh = pieceRefs.current[i];
      if (!mesh) continue;
      const p = piecesData[i];
      mesh.position.set(
        p.cx + p.dir.x * eT * maxExplodeDistance,
        p.cy + p.dir.y * eT * maxExplodeDistance,
        p.cz + p.dir.z * eT * maxExplodeDistance
      );
      // Slight rotation of pieces on hover for visual depth
      mesh.rotation.x = eT * (i * 0.05);
      mesh.rotation.y = eT * (i * 0.03);
    }

    if (pointLightRef.current) {
      pointLightRef.current.intensity = 0.5 + eT * 1.5;
    }

    // ponytail: dynamic hitbox scaling. 0.45 fits the unexploded 0.35 cube snugly. 
    // 1.0 expands it to 0.95 to capture pointer movements on the exploded pieces.
    if (hitboxRef.current) {
      const targetScale = hovered ? 1.0 : 0.45;
      hitboxRef.current.scale.setScalar(targetScale);
    }

    if (containerRef.current && scrollRef) {
      const scroll = scrollRef.current;
      const SHOW_RATIO = 0.45;
      const HIDE_RATIO = 0.38;
      
      const isCurrentlyVisible = containerRef.current.classList.contains('visible');
      if (scroll >= SHOW_RATIO && !isCurrentlyVisible) {
        containerRef.current.classList.add('visible');
      } else if (scroll < HIDE_RATIO && isCurrentlyVisible) {
        containerRef.current.classList.remove('visible');
      }
    }
  });

  return (
    <group position={position}>
      {/* Invisible hitbox for click/hover - placed outside the rotating group to stay static and large enough to cover the exploded pieces */}
      <mesh
        ref={hitboxRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (onClick) onClick(index);
          window.dispatchEvent(new CustomEvent('cube-click', { detail: index }));
        }}
      >
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 1. Rotating Tech Cube Model Group */}
      <group ref={groupRef}>
        {/* Render 12 pieces forming the mini tech cube */}
        {piecesData.map((p, i) => (
          <mesh
            key={i}
            ref={el => { pieceRefs.current[i] = el; }}
          >
            <boxGeometry args={[PIECE_W - GAP, PIECE_H - GAP, PIECE_D - GAP]} />
            <shaderMaterial
              uniforms={outerUniforms}
              vertexShader={cubeVert}
              fragmentShader={cubeFrag}
              depthWrite={true}
              side={THREE.FrontSide}
            />
          </mesh>
        ))}
      </group>

      {/* 2. Non-rotating Hologram HUD Label (Drei HTML component projected on top surface) */}
      {labelData && (
        <group ref={labelGroupRef}>
          <Html
            position={[0, 0.3, 0]}
            pointerEvents="none"
          >
            <div ref={containerRef} className="z2-3d-connector-container">
              <div className="z2-3d-label-content">
                <span className="z2-label-icon">{labelData.icon}</span>
                <span className="z2-label-num">{labelData.num}</span>
                <span className="z2-label-title">{labelData.title}</span>
                <div className="z2-label-items">
                  {labelData.items.map((item) => (
                    <span className="z2-label-item" key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div 
                className="z2-3d-connector-line" 
                style={{ height: labelData.lineHeight }}
              />
              <div className="z2-3d-connector-dot" />
            </div>
          </Html>
        </group>
      )}

      {/* Dynamic Point Light */}
      <pointLight ref={pointLightRef} intensity={0.5} distance={5} decay={2} color="#00bbff" />
    </group>
  );
}
