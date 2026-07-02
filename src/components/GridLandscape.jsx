import React, { useRef, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// GLSL: Procedural Canyon Shader (Vertex and Fragment)
// ─────────────────────────────────────────────────────────────────────────────

const terrainVert = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vElevation;
  
  uniform float uTime;

  // Pseudo-random hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // 2D Value Noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // 5-Octave Ridged Multifractal Noise (creates sharp, realistic mountain peaks/crests)
  float ridgedNoise(vec2 p) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      float n = noise(p * frequency);
      // Invert absolute noise to create sharp ridges
      float ridge = 1.0 - abs(n * 2.0 - 1.0);
      value += amplitude * ridge;
      amplitude *= 0.5;
      frequency *= 2.05;
    }
    return value;
  }

  // Height formula: rugged noise, masked in the center to create a flat canyon valley floor
  float getElevation(vec2 p) {
    // Scroll coordinates forward to simulate flight movement
    vec2 scrollPos = p * 0.035 - vec2(0.0, uTime * 0.12);
    
    // Towering mountain height
    float rawHeight = ridgedNoise(scrollPos) * 16.0;

    // Smoothstep mask: flat in center (abs(x) < 14), rising to mountains on sides (abs(x) > 38)
    float mask = smoothstep(14.0, 38.0, abs(p.x));

    return rawHeight * mask;
  }

  void main() {
    vUv = uv;

    // 1. Calculate displaced position
    vec3 displacedPos = position;
    displacedPos.z = getElevation(position.xy);
    vElevation = displacedPos.z;

    // 2. Compute normal vectors dynamically using Finite Differences
    vec2 eps = vec2(0.3, 0.0);
    float hL = getElevation(position.xy - eps.xy);
    float hR = getElevation(position.xy + eps.xy);
    float hD = getElevation(position.xy - eps.yx);
    float hU = getElevation(position.xy + eps.yx);

    // Form tangent vectors and take cross product
    vec3 tangentX = vec3(eps.x * 2.0, 0.0, hR - hL);
    vec3 tangentY = vec3(0.0, eps.x * 2.0, hU - hD);
    vec3 localNormal = normalize(cross(tangentX, tangentY));

    // Pass normal and position to fragment shader
    vNormal = normalize(normalMatrix * localNormal);
    vPosition = (modelMatrix * vec4(displacedPos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
  }
`;

const terrainFrag = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vElevation;

  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uLightPos;

  void main() {
    // 1. Shading & Light Calculations (Diffuse + Specular)
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vPosition);
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Concentrated rim light facing the horizon/backlight
    vec3 horizonLightDir = normalize(vec3(0.0, 0.5, -1.0));
    float rimLight = max(dot(normal, horizonLightDir), 0.0);
    rimLight = pow(rimLight, 5.0); // Focused on the mountain ridges

    // Base rock color (very dark, almost black/slate gray)
    vec3 baseColor = vec3(0.002, 0.004, 0.01);

    // Glow from the TechCube illuminating the rock slopes
    vec3 cubeGlow = uColor * diffuse * 1.6;

    // Horizon backlight glow on the peaks (rim lighting)
    vec3 rimGlow = uColor * rimLight * 1.5;

    // Specular highlight on wet/shiny rock surfaces
    vec3 viewDir = normalize(vec3(0.0, 1.5, 9.0) - vPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 24.0) * 0.35;

    // Depth Fog: fade everything smoothly into the background deep blue
    float depthFog = smoothstep(0.95, 0.08, vUv.y);

    // Combine all lighting layers
    vec3 finalColor = baseColor + cubeGlow + rimGlow + (vec3(spec) * uColor);

    gl_FragColor = vec4(finalColor, depthFog);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Valley Nodes (Glowing city/network points on the flat canyon floor)
// ─────────────────────────────────────────────────────────────────────────────
function ValleyNodes({ count = 60 }) {
  const pointsRef = useRef();

  // Generate fixed random points along the flat valley center
  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Valley width is x: [-12, 12]
      pos[i * 3] = (Math.random() - 0.5) * 22; 
      
      // Placed slightly above the floor geometry (y = -4.95)
      pos[i * 3 + 1] = -4.9; 
      
      // Placed along depth axis
      pos[i * 3 + 2] = -Math.random() * 95;

      // Random pulse frequencies
      scl[i] = 0.3 + Math.random() * 0.7;
    }
    return [pos, scl];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material;
    material.size = 0.20 + 0.12 * Math.sin(state.clock.getElapsedTime() * 3.5);
  });

  return (
    <points ref={pointsRef} position={[0, 0, -10]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        color="#00d2ff"
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Grid Landscape Exporter (forwardRef enabled)
// ─────────────────────────────────────────────────────────────────────────────
const GridLandscape = forwardRef((props, ref) => {
  const uniforms = useMemo(() => ({
    uTime:     { value: 0 },
    uColor:    { value: new THREE.Color('#00bbff') }, // Glowing cyan neon
    uLightPos: { value: new THREE.Vector3(0, 0.5, 0) }, // Cube light source coordinates
  }), []);

  useFrame(({ clock }) => {
    if (ref && ref.current) {
      ref.current.material.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <group>
      {/* Dynamic Procedural Terrain Plane with high resolution for sharp ridges */}
      <mesh
        ref={ref}
        rotation={[-Math.PI / 2.05, 0, 0]}
        position={[0, -5, -20]}
        receiveShadow
      >
        <planeGeometry args={[180, 180, 200, 200]} />
        <shaderMaterial
          vertexShader={terrainVert}
          fragmentShader={terrainFrag}
          uniforms={uniforms}
          transparent={true}
          depthWrite={true}
          wireframe={false}
        />
      </mesh>

      {/* Glowing City Nodes along the valley bottom */}
      <ValleyNodes count={90} />
    </group>
  );
});

export default GridLandscape;
