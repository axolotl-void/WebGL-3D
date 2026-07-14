import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Hubtown-style Luminous Cube — 12-piece explode/assemble
//
// Split into a 2×2×3 grid = 12 pieces.
// Each piece drifts outward along its offset direction when explodeT > 0,
// and snaps back to form a perfect cube when explodeT = 0.
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Build 26 pieces: 3×3×3 grid (excluding the center-most piece), each piece is a sub-box
// ─────────────────────────────────────────────────────────────────────────────
const CUBE_SIZE = 6;
const GAP = 0.06; // tiny seam between pieces when assembled
const COLS_X = 3;
const COLS_Y = 3;
const COLS_Z = 3;
const PIECE_W = CUBE_SIZE / COLS_X;
const PIECE_H = CUBE_SIZE / COLS_Y;
const PIECE_D = CUBE_SIZE / COLS_Z;

// Pre-compute piece offsets from center
const pieces = [];
for (let iy = 0; iy < COLS_Y; iy++) {
  for (let ix = 0; ix < COLS_X; ix++) {
    for (let iz = 0; iz < COLS_Z; iz++) {
      // Skip the center piece of the 3x3x3 grid so the inner glowing core is visible
      if (ix === 1 && iy === 1 && iz === 1) continue;
      
      const cx = (ix - (COLS_X - 1) / 2) * (PIECE_W + GAP);
      const cy = (iy - (COLS_Y - 1) / 2) * (PIECE_H + GAP);
      const cz = (iz - (COLS_Z - 1) / 2) * (PIECE_D + GAP);
      // Explode direction = normalized offset from center (with some extra push)
      const dir = new THREE.Vector3(cx, cy, cz).normalize();
      pieces.push({ cx, cy, cz, dir });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const TechCube = forwardRef(function TechCube({ scrollRef }, ref) {
  const groupRef = useRef();
  const pieceRefs = useRef([]);
  const coreMaterialRef = useRef();
  const pointLightRef = useRef();

  const cyan = useMemo(() => new THREE.Color('#00bbff'), []);
  const hotWhite = useMemo(() => new THREE.Color('#c0edff'), []);

  // Each piece shares the same uniform object (time synced per frame)
  const outerUniforms = useMemo(() => ({
    uTime:     { value: 0 },
    uColor:    { value: cyan },
    uColorHot: { value: hotWhite },
  }), []);

  // Expose explodeT to parent
  const explodeTRef = useRef(0);
  useImperativeHandle(ref, () => ({
    get explodeT() { return explodeTRef.current; },
    set explodeT(v) { explodeTRef.current = v; },
  }));

  const EXPLODE_DISTANCE = 3.5; // max distance pieces fly out

  // Hover state
  const isHoveredRef = useRef(false);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    outerUniforms.uTime.value = t;

    const scroll = scrollRef ? scrollRef.current : 0;

    // Target based on hover state, but ONLY if scroll is at the very top (< 0.01) so it snaps back immediately on scroll
    const target = (isHoveredRef.current && scroll < 0.01) ? 1.0 : 0.0;

    // Smooth lerp to target - lowered factor (0.025) for a slower, smoother transition
    explodeTRef.current += (target - explodeTRef.current) * 0.025;
    const eT = explodeTRef.current;

    // Slow rotation of entire group
    if (groupRef.current) {
      groupRef.current.rotation.x = t * 0.06;
      groupRef.current.rotation.y = t * 0.085;
      groupRef.current.rotation.z = t * 0.03;
    }

    // Position each piece
    for (let i = 0; i < pieces.length; i++) {
      const mesh = pieceRefs.current[i];
      if (!mesh) continue;
      const p = pieces[i];
      mesh.position.set(
        p.cx + p.dir.x * eT * EXPLODE_DISTANCE,
        p.cy + p.dir.y * eT * EXPLODE_DISTANCE,
        p.cz + p.dir.z * eT * EXPLODE_DISTANCE
      );
      // Slight per-piece rotation when exploded for visual interest
      mesh.rotation.x = eT * (i * 0.3);
      mesh.rotation.y = eT * (i * 0.2);
    }

    // Update core material uniforms & light intensity
    if (coreMaterialRef.current) {
      coreMaterialRef.current.uniforms.uExplodeT.value = eT;
    }
    if (pointLightRef.current) {
      // Keep a small glow when closed, flare up when exploded
      pointLightRef.current.intensity = 2 + eT * 18;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 
        INVISIBLE HITBOX: 
        Sebuah kotak transparan yang lebih besar untuk menangkap event mouse.
        Ini mencegah glitch "kejang-kejang" karena kursor tidak sengaja masuk 
        ke celah kosong di antara pecahan-pecahan kubus saat sedang meledak.
      */}
      <mesh
        onPointerOver={() => { isHoveredRef.current = true; }}
        onPointerOut={() => { isHoveredRef.current = false; }}
      >
        <boxGeometry args={[10, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {pieces.map((p, i) => (
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

      {/* Glowing Central Core (Visible when exploded) */}
      <group>
        {/* Inner Solid White Sphere */}
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Outer Glowing Aura */}
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <shaderMaterial
            ref={coreMaterialRef}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            uniforms={{
              uTime: outerUniforms.uTime,
              uGlowColor: { value: new THREE.Color('#ffffff') },
              uEdgeColor: { value: new THREE.Color('#00d9ff') },
              uExplodeT: { value: 0 }
            }}
            vertexShader={`
              varying vec3 vNormal;
              varying vec3 vViewDir;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vec3 toCam = cameraPosition - wp.xyz;
                vViewDir = toCam / (length(toCam) + 0.0001);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform vec3 uGlowColor;
              uniform vec3 uEdgeColor;
              uniform float uTime;
              uniform float uExplodeT;
              varying vec3 vNormal;
              varying vec3 vViewDir;
              void main() {
                float intensity = pow(max(0.0, 0.65 - dot(vNormal, vViewDir)), 2.5);
                float pulse = 0.85 + 0.15 * sin(uTime * 6.0);
                // Fade in as the cube explodes
                float alpha = intensity * pulse * uExplodeT;
                vec3 col = mix(uGlowColor, uEdgeColor, 0.3);
                gl_FragColor = vec4(col * 2.5, alpha);
              }
            `}
          />
        </mesh>
      </group>

      {/* Dynamic Point Light */}
      <pointLight ref={pointLightRef} intensity={2} distance={35} decay={1.8} color="#00d9ff" />
    </group>
  );
});

export default TechCube;
