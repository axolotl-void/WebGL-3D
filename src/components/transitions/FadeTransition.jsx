import React, { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// --- Simplex Noise 2D Shader ---
const noiseShader = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Layar penuh NDC (Z = 0)
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  ${noiseShader}
  
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uColor;
  
  varying vec2 vUv;
  
  void main() {
      // 1. Hitung Noise Animasi
      // Skala 5.0 menentukan seberapa besar/kecil bercak robekannya
      // uTime membuat pinggirannya bergerak terus seperti api
      float n = snoise(vec2(vUv.x * 5.0 + uTime * 0.3, vUv.y * 5.0 + uTime * 0.3));
      n = n * 0.5 + 0.5; // Normalisasi ke range 0.0 -> 1.0
      
      // 2. Hitung Jarak dari Tengah (membuat portal membesar dari tengah ke luar)
      float dist = distance(vUv, vec2(0.5));
      
      // 3. Gabungkan Jarak dan Noise untuk bentuk akhir (Shape)
      // Dist(0 -> ~0.7) + Noise(0 -> 0.4) = Range Shape (~0.0 -> ~1.1)
      float shape = dist + n * 0.4;
      
      // 4. Mapping nilai Progress (0 -> 1) agar menutupi seluruh rentang Shape
      float mappedProgress = (uProgress * 2.0) - 0.5; 
      
      // 5. Ketebalan pinggiran yang menyala (Glowing Edge)
      float edgeWidth = 0.15;
      float diff = shape - mappedProgress;
      
      if (diff < 0.0) {
          // Area DALAM Portal (Layar Tertutup Gelap)
          // Warna sangat gelap biru tua, nyaris hitam, menyesuaikan background angkasa
          gl_FragColor = vec4(0.01, 0.02, 0.04, 1.0); 
      } else if (diff < edgeWidth) {
          // Area PINGGIRAN Portal (Terbakar / Glowing)
          float intensity = 1.0 - (diff / edgeWidth);
          intensity = pow(intensity, 1.5); // Kurva agar lebih tajam di dalam, memudar di luar
          
          // Dikali 4.0 agar warnanya "HDR" (melebihi 1.0) sehingga memicu efek Bloom
          vec3 glow = uColor * intensity * 4.0; 
          gl_FragColor = vec4(glow, intensity); // Alpha mengikuti intensity agar memudar mulus
      } else {
          // Area LUAR Portal (Transparan, menampilkan Scene 3D di belakangnya)
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
  }
`;

const FadeTransition = ({ onCaptured, onComplete }) => {
  const materialRef = useRef();
  
  // Gunakan useMemo agar object uniforms tidak terbuat ulang setiap kali komponen re-render.
  // Jika terbuat ulang, React Three Fiber akan menimpa nilai uProgress yang sedang dianimasikan GSAP!
  const uniforms = React.useMemo(() => ({
    uProgress: { value: 0.0 },
    uTime: { value: 0.0 },
    uColor: { value: new THREE.Color("#00ffff") } 
  }), []);

  // Update uTime di setiap frame agar pinggiran portal terlihat bergerak
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  useLayoutEffect(() => {
    if (materialRef.current) {
      // Step 1: Portal TERBUKA dari tengah (Layar menjadi gelap)
      gsap.to(materialRef.current.uniforms.uProgress, {
        value: 1.0,
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: () => {
          // Step 2: Ganti Scene saat layar tertutup gelap sepenuhnya
          if (onCaptured) onCaptured();
          
          // Step 3: Portal MENGECIL kembali (Menyingkap Scene Baru)
          gsap.to(materialRef.current.uniforms.uProgress, {
            value: 0.0,
            duration: 1.2,
            ease: "power2.inOut",
            onComplete: () => {
              if (onComplete) onComplete();
            }
          });
        }
      });
    }
  }, [onCaptured, onComplete]);
  
  return (
    <mesh frustumCulled={false} renderOrder={9999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

export default FadeTransition;
