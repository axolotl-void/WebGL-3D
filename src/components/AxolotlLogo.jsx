import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

export default function AxolotlLogo({ scrollRef }) {
  const { scene } = useGLTF('/models/3d_model/3d-logo-axolotl.glb');
  const groupRef = useRef();

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
    
    // Smooth auto-rotation
    groupRef.current.rotation.y = t * 0.4;
    groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    
    // Hovering float animation
    groupRef.current.position.y = -0.5 + Math.sin(t * 1.2) * 0.12;
  });

  return (
    <group ref={groupRef} position={[375.81, -0.5, -62.67]} scale={10.0}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

useGLTF.preload('/models/3d_model/3d-logo-axolotl.glb');
