import React, { useMemo, forwardRef } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Custom Shader: Wireframe Propagation + Scanline Glow (Diadaptasi dari Scene 1)
// ─────────────────────────────────────────────────────────────────────────────

const mountainVert = /* glsl */`
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  void main() {
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const mountainFrag = /* glsl */`
  uniform float uTime;
  uniform float uRevealProgress;
  uniform float uCameraZ;          // Tying reveal to camera Z
  uniform vec3  uBaseColor;       
  uniform vec3  uGlowColor;       

  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  void main() {
    // ── 1. WIREFRAME GRID ──
    float gridScale1 = 0.5; 
    vec2 grid1 = abs(fract(vLocalPos.xz * gridScale1) - 0.5);
    float wire1 = 1.0 - smoothstep(0.0, 0.01, min(grid1.x, grid1.y));

    float gridScale2 = 1.5;
    vec2 grid2 = abs(fract(vLocalPos.xz * gridScale2) - 0.5);
    float wire2 = 1.0 - smoothstep(0.0, 0.008, min(grid2.x, grid2.y));

    float contour = 1.0 - smoothstep(0.0, 0.01, abs(fract(vLocalPos.y * 1.5) - 0.5));

    float isWire = max(wire1, max(wire2 * 0.4, contour * 0.35));

    // ── 2. REVEAL ANIMATION (MENGIKUTI KAMERA) ──
    // Menormalisasi posisi Z kamera (uCameraZ) dari -64.83 (awal) s/d -58.32 (akhir) menjadi 0.0 - 1.0.
    // Kemudian menyapu revealZ dari -67.0 (gunung gelap total) hingga -42.0 (gunung menyala utuh).
    float camT = clamp((uCameraZ + 64.83) / 6.51, 0.0, 1.0);
    float revealZ = mix(-67.0, -42.0, camT);
    
    // Masker sapuan: Munculkan garis jika z dunia lebih kecil dari revealZ (cahaya merambat ke depan)
    float sweepMask = 1.0 - smoothstep(revealZ - 1.5, revealZ + 1.5, vWorldPos.z);
    
    // Efek kilatan terang (Glow Pulse) yang tipis dan tajam tepat di ujung tombak sapuan
    float leadingEdge = smoothstep(revealZ - 1.5, revealZ, vWorldPos.z) * (1.0 - smoothstep(revealZ, revealZ + 1.5, vWorldPos.z));
    
    isWire *= sweepMask; // Sembunyikan garis yang belum tersapu ombak cahaya

    // ── 3. TERRAIN LIGHTING ──
    vec3 terrainColor = uBaseColor; 
    
    // ── 4. FINAL COMPOSITION ──
    vec3 color = terrainColor;
    
    // Hamparan Wireframe menyala
    color += isWire * uGlowColor * 2.0;
    
    // Tambahkan kilatan cahaya ekstra (hanya pada garis wireframe) agar tidak menyilaukan seluruh gunung
    color += leadingEdge * uGlowColor * 5.0 * isWire;

    gl_FragColor = vec4(color, 1.0);
  }
`;

useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');

const SecondMountain = forwardRef((props, ref) => {
  const { scene } = useGLTF('/models/snowy_mountain_v2_-_terrain/scene_compressed.glb');
  
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Seragam (Uniforms) untuk mengatur warna shader
  const uniforms = useMemo(() => ({
    uTime:           { value: 0 },
    uRevealProgress: { value: 0 },
    uCameraZ:        { value: -100.0 }, // default offscreen
    // Hitam murni
    uBaseColor:      { value: new THREE.Color('#000000') }, 
    // Garis Cyan terang
    uGlowColor:      { value: new THREE.Color('#00ffff') },
  }), []);

  // Mengekspos uniforms agar bisa diakses oleh SecondScene.jsx
  React.useImperativeHandle(ref, () => ({ uniforms }), [uniforms]);

  // Pasang custom shader ke semua jaring (mesh) model ini
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: mountainVert,
          fragmentShader: mountainFrag,
          side: THREE.FrontSide, // Pastikan tidak tembus pandang
        });
      }
    });
  }, [clonedScene, uniforms]);

  // Update uTime jika mau bikin animasi (misal aliran cahaya)
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group position={[0, -2, -10]}>
      <Center>
        <primitive
          object={clonedScene}
          scale={1} 
          rotation={[0, 0, 0]}
        />
      </Center>
    </group>
  );
});

export default SecondMountain;
