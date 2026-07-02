import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// ── SHADERS ──
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Paksa mesh untuk selalu menutupi seluruh layar (Fullscreen NDC)
    gl_Position = vec4(position.xy, 0.0, 1.0); // Z = 0 agar selalu ada di tengah frustum
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uProgress; // 0.0 to 1.0
  
  varying vec2 vUv;

  // Pseudo-random generator
  vec2 random2( vec2 p ) {
      return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
  }

  void main() {
      // Perbaikan orientasi Y
      vec2 uv = vUv; 
      
      // Tentukan kepadatan retakan kaca (jumlah sel voronoi)
      float cells = 12.0;
      vec2 st = uv * cells;
      
      vec2 i_st = floor(st);
      vec2 f_st = fract(st);

      float m_dist = 1.0;
      vec2 m_point;
      vec2 m_i;
      
      // Kalkulasi Voronoi
      for (int y= -1; y <= 1; y++) {
          for (int x= -1; x <= 1; x++) {
              vec2 neighbor = vec2(float(x),float(y));
              vec2 point = random2(i_st + neighbor);
              vec2 diff = neighbor + point - f_st;
              float dist = length(diff);
              
              if( dist < m_dist ) {
                  m_dist = dist;
                  m_point = point;
                  m_i = i_st + neighbor;
              }
          }
      }

      // Buat "seed" acak per kepingan agar mereka pecah di waktu yang sedikit berbeda
      float randSeed = fract(sin(dot(m_i, vec2(12.9898, 78.233))) * 43758.5453);
      
      // Titik pusat ledakan kaca (tengah layar)
      float distToExplosion = length(uv - vec2(0.5, 0.5));
      
      // Waktu mulai pecah bergantung pada jarak dari pusat (efek merambat)
      float startT = distToExplosion * 0.4 + randSeed * 0.2; 
      float endT = startT + 0.4;
      
      // Progress spesifik untuk kepingan ini (0.0 sampai 1.0)
      float shardProgress = smoothstep(startT, endT, uProgress);
      
      // Pusat dari sel kepingan ini
      vec2 cellCenter = (m_i + m_point) / cells;
      
      // Efek mengecil / terbang (skala UV ditarik)
      vec2 flyingOffset = (uv - cellCenter) * shardProgress * 1.5; 
      
      // Efek jatuh/terlempar (Drift)
      vec2 dirFromCenter = normalize(cellCenter - vec2(0.5, 0.5));
      vec2 drift = dirFromCenter * shardProgress * (randSeed + 0.5);
      drift.y -= shardProgress * 1.5; // Efek gravitasi jatuh ke bawah
      
      vec2 finalUv = uv - flyingOffset - drift;
      
      vec4 texColor = texture2D(uTexture, finalUv);
      
      // Kepingan perlahan memudar
      texColor.a *= (1.0 - shardProgress);
      
      // Tambahkan cahaya neon menyala di garis retakan
      float crackThickness = smoothstep(0.0, 0.05, m_dist);
      vec3 glowColor = vec3(0.0, 1.0, 1.0); // Cyan glow
      
      // Cahaya retakan menyala sesaat sebelum hancur
      float flash = smoothstep(0.0, 0.2, uProgress) * (1.0 - shardProgress);
      texColor.rgb += (1.0 - crackThickness) * glowColor * flash * 3.0;
      
      if (texColor.a < 0.01) discard;

      gl_FragColor = texColor;
  }
`;

const ShatterGlass = ({ onCaptured, onComplete }) => {
  const { gl, scene, camera, size } = useThree();
  const materialRef = useRef();
  const captured = useRef(false);
  
  // Buat Render Target untuk menampung "foto" layar (Resolusi disesuaikan dengan pixel ratio agar tajam)
  const renderTarget = useMemo(() => {
    return new THREE.WebGLRenderTarget(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio(), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
  }, [size, gl]);
  
  useLayoutEffect(() => {
    if (!captured.current && materialRef.current) {
      // 1. Sembunyikan layar transisi ini sebentar
      materialRef.current.visible = false;
      
      // 2. Jepret! Render Halaman 1 ke dalam tekstur memori
      gl.setRenderTarget(renderTarget);
      gl.render(scene, camera);
      gl.setRenderTarget(null); // Kembalikan ke render utama
      
      // 3. Masukkan hasil jepretan ke dalam layar kaca transisi, lalu tampilkan
      materialRef.current.uniforms.uTexture.value = renderTarget.texture;
      materialRef.current.visible = true;
      captured.current = true;
      
      // 4. Beritahu App.jsx bahwa jepretan selesai, Halaman 1 boleh dihapus diam-diam!
      if (onCaptured) onCaptured();
      
      // 5. Mainkan animasi kaca retak dan pecah
      gsap.to(materialRef.current.uniforms.uProgress, {
        value: 1.0,
        duration: 2.0, // Durasi 2 detik
        ease: "power2.inOut",
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });
    }
  }, [gl, scene, camera, renderTarget, onCaptured, onComplete]);
  
  return (
    // Gunakan renderOrder sangat tinggi agar selalu dirender paling depan menutupi Halaman 2
    <mesh frustumCulled={false} renderOrder={9999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTexture: { value: null },
          uProgress: { value: 0.0 }
        }}
        transparent={true}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

export default ShatterGlass;
