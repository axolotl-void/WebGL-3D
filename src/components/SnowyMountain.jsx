import React, { useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Custom Shader: Terrain Reveal + Wireframe Propagation + Scanline Glow
// ─────────────────────────────────────────────────────────────────────────────

const mountainVert = /* glsl */`
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const mountainFrag = /* glsl */`
  uniform float uTime;
  uniform float uRevealProgress;  // 0→1 terrain builds up from bottom
  uniform float uWireProgress;    // 0→1 wireframe propagates outward from center
  uniform float uOpacity;         // 1→0 fade out on scroll
  uniform vec3  uBaseColor;       // dark terrain base color
  uniform vec3  uGlowColor;       // cyan glow color

  varying vec3 vWorldPos;
  varying vec3 vNormal;

  void main() {
    // ── 1. TERRAIN REVEAL (Y-axis sweep, bottom→top) ──
    float revealBottom = -200.0;
    float revealTop = 8.0;
    float revealY = mix(revealTop, revealBottom, uRevealProgress);
    bool aboveReveal = vWorldPos.y >= revealY;

    // ── 2. WIREFRAME GRID ──
    // Coarse grid (XZ plane — main structural lines)
    float gridScale1 = 0.035;
    vec2 grid1 = abs(fract(vWorldPos.xz * gridScale1) - 0.5);
    float wire1 = 1.0 - smoothstep(0.0, 0.018, min(grid1.x, grid1.y));

    // Fine grid (XZ plane — detail texture)
    float gridScale2 = 0.09;
    vec2 grid2 = abs(fract(vWorldPos.xz * gridScale2) - 0.5);
    float wire2 = 1.0 - smoothstep(0.0, 0.012, min(grid2.x, grid2.y));

    // Horizontal contour lines (Y axis — topographic feel)
    float contour = 1.0 - smoothstep(0.0, 0.025, abs(fract(vWorldPos.y * 0.25) - 0.5));

    float isWire = max(wire1, max(wire2 * 0.4, contour * 0.35));

    // Wireframe propagation: spreads outward from world center
    float dist = length(vWorldPos.xz);
    float wireRadius = uWireProgress * 300.0;
    float wireMask = smoothstep(wireRadius, max(wireRadius - 50.0, 0.0), dist);
    isWire *= wireMask;

    // Wireframe fades out as terrain solidifies
    float wireFade = 1.0 - smoothstep(0.65, 1.0, uRevealProgress);
    isWire *= wireFade;

    // ── 3. DISCARD LOGIC ──
    // Below reveal line AND not on a wireframe line → invisible
    if (!aboveReveal && isWire < 0.01) discard;

    // ── 4. SCANLINE GLOW at reveal edge ──
    float scanActive = step(0.01, uRevealProgress) * (1.0 - step(0.99, uRevealProgress));
    float edgeDist = vWorldPos.y - revealY;
    float scanGlow = exp(-abs(edgeDist) * 1.8) * scanActive;
    float edgeHighlight = exp(-max(edgeDist, 0.0) * 4.0) * scanActive;

    // ── 5. TERRAIN LIGHTING (replaces MeshStandardMaterial) ──
    vec3 N = normalize(vNormal);
    vec3 lightDir1 = normalize(vec3(0.0, 10.0, 15.0));   // front fill
    vec3 lightDir2 = normalize(vec3(0.0, 15.0, -30.0));  // cyan rim backlight
    float diff1 = max(dot(N, lightDir1), 0.0);
    float diff2 = max(dot(N, lightDir2), 0.0);

    vec3 terrainColor = uBaseColor * (0.25 + diff1 * 0.8);
    terrainColor += uGlowColor * diff2 * 0.12;

    // ── 6. FINAL COMPOSITION ──
    vec3 color = vec3(0.0);

    if (aboveReveal) {
      color = terrainColor;
      color += edgeHighlight * uGlowColor * 0.8;
    }

    // Wireframe overlay
    color += isWire * uGlowColor * 0.55;

    // Scanline sweep glow
    color += scanGlow * uGlowColor * 2.0;

    gl_FragColor = vec4(color, uOpacity);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Snowy Mountain GLTF Component (with intro shader)
// ─────────────────────────────────────────────────────────────────────────────
useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');

const SnowyMountain = forwardRef((props, ref) => {
  const { scene } = useGLTF('/models/snowy_mountain/scene_compressed.glb');

  const uniforms = useMemo(() => ({
    uTime:           { value: 0 },
    uRevealProgress: { value: 0 },
    uWireProgress:   { value: 0 },
    uOpacity:        { value: 1.0 },
    uBaseColor:      { value: new THREE.Color('#0a1b2e') },
    uGlowColor:      { value: new THREE.Color('#00d2ff') },
  }), []);

  // Expose uniforms so MainScene can drive the intro animation
  useImperativeHandle(ref, () => ({ uniforms }), [uniforms]);

  // Apply custom shader material to all meshes in the GLTF
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: mountainVert,
          fragmentShader: mountainFrag,
          side: THREE.FrontSide,
          transparent: true,
        });
      }
    });
  }, [scene, uniforms]);

  // Tick time uniform every frame
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group position={[0, -2.5, -12]}>
      <primitive
        object={scene}
        position={[0, -2, 0]}
        scale={800}
        rotation={[0, Math.PI * 0.75, 0]}
      />
    </group>
  );
});

useGLTF.preload('/models/snowy_mountain/scene_compressed.glb');
export default SnowyMountain;
