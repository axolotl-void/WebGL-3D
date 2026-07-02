import React, { useRef, useMemo, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Custom Shader: Swirling Cosmic Vortex for the Portal energy sheet
// ─────────────────────────────────────────────────────────────────────────────

const vortexVert = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const vortexFrag = /* glsl */`
  uniform float uTime;
  uniform vec3 uColor1; // Cyan
  uniform vec3 uColor2; // Deep Blue/Purple
  uniform vec3 uColorHot; // White Core

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  // Simple Hash & Noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    // Center coordinates to (-0.5, 0.5)
    vec2 uv = vUv - 0.5;
    float dist = length(uv);

    // Compute polar coordinates
    float angle = atan(uv.y, uv.x);

    // Create energetic spiral swirl based on distance and time
    float swirl = angle + 5.0 * dist - uTime * 3.0;

    // Layered noise for cosmic energy threads
    float n1 = noise(vec2(dist * 15.0 - uTime * 2.0, swirl * 2.0));
    float n2 = noise(vec2(dist * 30.0 + uTime * 1.5, swirl * 4.0 - dist * 8.0));
    float energy = (n1 * 0.55 + n2 * 0.45);

    // Subtle breathing pulse
    float pulse = 0.95 + 0.05 * sin(uTime * 4.0);

    // Vignette falloff to make the portal circular and soft at the rim
    float rimFalloff = smoothstep(0.5, 0.22, dist); 
    float centerGlow = smoothstep(0.4, 0.0, dist);

    // Color gradient composition
    vec3 baseColor = mix(uColor2, uColor1, smoothstep(0.1, 0.45, dist + energy * 0.15));
    vec3 finalColor = mix(baseColor, uColorHot, centerGlow * 1.6 + energy * 0.4);

    // Fresnel rim glow
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    float fresnel = pow(1.0 - abs(dot(N, V)), 2.5);
    finalColor += uColor1 * fresnel * 1.8;

    // Apply falloff, pulse, and transparency
    float alpha = rimFalloff * (0.2 + energy * 0.8) * pulse;

    // Bright central core
    if (dist < 0.04) {
      finalColor += vec3(1.5) * (1.0 - dist / 0.04);
      alpha = 1.0;
    }

    gl_FragColor = vec4(finalColor * 2.5, alpha);
  }
`;

useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');

const Portal = forwardRef(({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.018 }, ref) => {
  const { scene } = useGLTF('/models/portal/scene.gltf');
  const groupRef = useRef();
  const ringRef = useRef();

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#00bbff') },   // Neon Cyan
    uColor2: { value: new THREE.Color('#7a00ff') },   // Cyber Purple
    uColorHot: { value: new THREE.Color('#e0f7ff') }, // Ice White
  }), []);

  // Traverse model to apply custom shader on the Portal mesh, and glow on the ring/gate
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        if (name.includes('portal')) {
          // Energetic vortex shader
          child.material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: vortexVert,
            fragmentShader: vortexFrag,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
        } else {
          // Gate frame and Outer Ring: enhance with glowing emissives
          if (child.material) {
            child.material.emissive = new THREE.Color('#00ffff');
            child.material.emissiveIntensity = 0.85;
            child.material.roughness = 0.2;
            child.material.metalness = 0.8;
          }
          if (name.includes('ring')) {
            ringRef.current = child;
          }
        }
      }
    });
  }, [clonedScene, uniforms]);

  // Animate the portal components
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    // Spin the outer ring mesh
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.45;
    }

    // Gentle floating bobbing and subtle sway on the group
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.08;
      groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.5) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive 
        object={clonedScene} 
        scale={[scale, scale, scale]} 
      />
      {/* Dynamic light inside portal to illuminate the nearby terrain */}
      <pointLight 
        intensity={8.0} 
        distance={15} 
        decay={1.6} 
        color="#00d9ff" 
        position={[0, 2.5 * (scale / 0.018), 0.2 * (scale / 0.018)]} 
      />
    </group>
  );
});

export default Portal;
