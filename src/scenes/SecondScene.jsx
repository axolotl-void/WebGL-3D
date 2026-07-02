import React, { useRef, useEffect, useMemo } from 'react';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SecondMountain from '../components/SecondMountain';

const SecondScene = () => {
  const mountainRef = useRef();
  const { camera } = useThree();

  // Referensi untuk nilai scroll yang di-lerp
  const scrollRef = useRef(0);
  const targetScrollRef = useRef(0);

  // Pantau event scroll dari browser
  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      targetScrollRef.current = window.scrollY / maxScroll;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 1. Definisikan Titik Posisi Kamera (Titik 1, 2, 3)
  const pathPositions = useMemo(() => [
    new THREE.Vector3(-1.86, -1.97, -20.40),
    new THREE.Vector3(-0.62, -0.67, -16.15),
    new THREE.Vector3(-2.04, -1.17, -13.32)
  ], []);

  // 2. Definisikan Titik Rotasi Kamera menggunakan Quaternion (berdasarkan Euler dari Tracker)
  const pathQuaternions = useMemo(() => [
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-3.14, -0.18, -3.14)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-2.93, -0.10, -3.12)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-2.90, -0.54, -3.01))
  ], []);

  // Membuat kurva halus 3D (Spline) untuk posisi
  const posCurve = useMemo(() => new THREE.CatmullRomCurve3(pathPositions), [pathPositions]);

  useFrame(() => {
    // Lerp scroll untuk gerakan kamera yang sangat mulus
    scrollRef.current = THREE.MathUtils.lerp(scrollRef.current, targetScrollRef.current, 0.05);
    const t = scrollRef.current; // Nilai dari 0.0 hingga 1.0

    // Mengambil titik posisi dari kurva berdasarkan persentase scroll
    const pos = posCurve.getPoint(t);
    camera.position.copy(pos);

    // Menggabungkan rotasi secara manual antar segmen
    const numSegments = pathQuaternions.length - 1; 
    const scaledT = t * numSegments; 
    const index = Math.min(Math.floor(scaledT), numSegments - 1); 
    const localT = scaledT - index; 

    // Slerp untuk rotasi kamera yang sangat halus
    camera.quaternion.slerpQuaternions(pathQuaternions[index], pathQuaternions[index + 1], localT);

    // ── BARU: Mengirim nilai scroll ke Shader Gunung untuk animasi garis ──
    if (mountainRef.current && mountainRef.current.uniforms) {
      mountainRef.current.uniforms.uRevealProgress.value = t;
    }
  });

  return (
    <>
      <color attach="background" args={['#050510']} />
      
      {/* Kamera dikendalikan via useFrame sekarang, initial position bebas */}
      <PerspectiveCamera makeDefault fov={60} />

      {/* Cahaya ambient yang sangat redup (sinematik malam) */}
      <ambientLight intensity={0.2} />
      
      {/* Cahaya pengisi dari atas, warna biru tua sangat redup agar bayangannya tidak hitam pekat */}
      <directionalLight position={[0, 20, 10]} intensity={0.5} color="#0a1a3a" />
      
      {/* Cahaya aksen neon Cyan dari belakang untuk pinggiran (Rim light) */}
      <directionalLight position={[-15, 10, -20]} intensity={3.5} color="#00ffff" />
      
      {/* Cahaya aksen neon Pink dari samping/depan untuk estetika cyberpunk */}
      <directionalLight position={[15, 5, 5]} intensity={2.5} color="#ff0055" />

      {/* Decorative stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* The mountain asset */}
      <SecondMountain ref={mountainRef} />
      
      {/* Nanti di sini bisa ditambahkan teks atau objek 3D lain untuk halaman kedua */}
    </>
  );
};

export default SecondScene;
