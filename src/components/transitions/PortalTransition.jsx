import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RenderTexture, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import MainScene from '../../scenes/MainScene';
import SecondScene from '../../scenes/SecondScene';

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
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  ${noiseShader}
  
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uColor;
  uniform sampler2D uTex1; // Scene Lama
  uniform sampler2D uTex2; // Scene Baru
  
  varying vec2 vUv;
  
  void main() {
      // 1. Hitung Noise Animasi
      float n = snoise(vec2(vUv.x * 4.0 + uTime * 0.4, vUv.y * 4.0 + uTime * 0.4));
      n = n * 0.5 + 0.5;
      
      // 2. Jarak dari tengah (Portal melebar)
      float dist = distance(vUv, vec2(0.5));
      float shape = dist + n * 0.5; // Range ~0.0 to ~1.2
      
      // 3. Map progress
      float mappedProgress = (uProgress * 2.2) - 0.6; 
      
      float edgeWidth = 0.2;
      float diff = shape - mappedProgress;
      
      // Ambil warna pixel dari kedua scene
      vec4 color1 = texture2D(uTex1, vUv);
      vec4 color2 = texture2D(uTex2, vUv);
      
      if (diff < 0.0) {
          // DALAM Portal -> Tampilkan Scene Baru
          gl_FragColor = color2;
      } else if (diff < edgeWidth) {
          // PINGGIRAN Portal -> Campurkan warna Scene Baru dengan Glowing Cyan
          float intensity = 1.0 - (diff / edgeWidth);
          intensity = pow(intensity, 2.0); // Bikin lebih tajam
          
          vec3 glow = uColor * intensity * 5.0; // Intensitas HDR tinggi
          
          // Efek terbakar: Warna base adalah Scene Baru + Cahaya Api
          vec3 finalColor = color2.rgb + glow;
          gl_FragColor = vec4(finalColor, 1.0);
      } else {
          // LUAR Portal -> Tampilkan Scene Lama
          gl_FragColor = color1;
      }
  }
`;

const PortalTransition = ({ fromScene, toScene, hasVisitedScene1, onComplete }) => {
  const materialRef = useRef();
  
  const uniforms = useMemo(() => ({
    uProgress: { value: 0.0 },
    uTime: { value: 0.0 },
    uColor: { value: new THREE.Color("#00ffff") },
    uTex1: { value: null },
    uTex2: { value: null }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  useLayoutEffect(() => {
    if (materialRef.current) {
      // Transisi FBO hanya butuh 1 arah (0.0 -> 1.0)
      // karena di akhir transisi, Scene 2 akan menutupi 100% layar!
      gsap.fromTo(materialRef.current.uniforms.uProgress, 
        { value: 0.0 },
        {
          value: 1.0,
          duration: 1.5, // Waktu transisi
          ease: "power2.inOut",
          onComplete: () => {
            if (onComplete) onComplete();
          }
        }
      );
    }
  }, [onComplete]);
  
  return (
    <mesh frustumCulled={false} renderOrder={9999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        transparent={false} // Tidak perlu transparan karena menutupi seluruh layar
      >
        <RenderTexture attach="uniforms-uTex1-value" computeBBox={false}>
          {fromScene === 1 ? <MainScene skipIntro={hasVisitedScene1} /> : <SecondScene />}
        </RenderTexture>
        
        <RenderTexture attach="uniforms-uTex2-value" computeBBox={false}>
          {toScene === 1 ? <MainScene skipIntro={hasVisitedScene1} /> : <SecondScene />}
        </RenderTexture>
      </shaderMaterial>
    </mesh>
  );
};

export default PortalTransition;
