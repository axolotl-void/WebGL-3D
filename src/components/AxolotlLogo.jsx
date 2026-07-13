import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

export default function AxolotlLogo({ scrollRef }) {
  const { scene } = useGLTF('/models/3d_model/3d-logo-axolotl.glb');
  const groupRef = useRef();
  const logoRef = useRef();
  const cylinderRef = useRef();

  // Premium cyberpunk material: glossy dark metal with neon cyan glowing emissive edges
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#081422',
      metalness: 0.95,
      roughness: 0.15,
      emissive: '#00d2ff',
      emissiveIntensity: 1.8,
    });
  }, []);

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, material]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const scroll = scrollRef ? scrollRef.current : 0;
    if (scroll < 0.75) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const t = state.clock.getElapsedTime();
    
    // 1. Smooth hover floating of the whole pod (container + logo)
    groupRef.current.position.y = -0.5 + Math.sin(t * 0.8) * 0.08;

    // 2. Rotate only the logo mesh inside
    if (logoRef.current) {
      logoRef.current.rotation.y = t * 0.4;
      logoRef.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    }

    // 3. Slow counter-rotation of the cylinder wireframe for a high-tech vibe
    if (cylinderRef.current) {
      cylinderRef.current.rotation.y = -t * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[377.73, -0.5, -50.83]}>
      {/* 3D Logo Mesh (spins inside) */}
      <group ref={logoRef} scale={10.0}>
        <Center>
          <primitive object={scene} />
        </Center>
      </group>

      {/* Holographic Container Cylinder (wireframe) */}
      <mesh ref={cylinderRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[7.0, 7.0, 12.0, 32, 10, true]} />
        <meshBasicMaterial 
          color="#00d2ff" 
          wireframe 
          transparent 
          opacity={0.18} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Top and Bottom framing rings */}
      <mesh position={[0, 6.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.9, 7.1, 64]} />
        <meshBasicMaterial 
          color="#00d2ff" 
          transparent 
          opacity={0.6} 
          side={THREE.DoubleSide} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
      <mesh position={[0, -6.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.9, 7.1, 64]} />
        <meshBasicMaterial 
          color="#00d2ff" 
          transparent 
          opacity={0.6} 
          side={THREE.DoubleSide} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/3d_model/3d-logo-axolotl.glb');
