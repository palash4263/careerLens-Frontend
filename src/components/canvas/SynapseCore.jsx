// src/components/canvas/SynapseCore.jsx
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Text } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { animate } from "animejs";

/**
 * SynapseCore (Futuristic Cyber-AI Document Vault & Scanner - Powered by Anime.js)
 * ----------------------------------------------------------------------------------
 * 3D Model Driven by Anime.js Timelines:
 * 1. Anime.js driven 3D Glass Document Vault rotation & scale pulses.
 * 2. Anime.js laser scanner sweep with smooth inOutQuad easing.
 * 3. Orbiting Crystalline Tech Gems & emissive light pulses.
 * 4. Interactive Hover & Cursor Parallax Physics.
 */
function HolographicResumeVault() {
  const groupRef = useRef(null);
  const laserRef = useRef(null);
  const coreMatRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useEffect(() => {
    // 1. Anime.js Laser Scanner Beam Sweep
    const animLaser = animate(laserRef.current ? laserRef.current.position : {}, {
      y: [{ to: 0.72, duration: 1400 }, { to: -0.72, duration: 1400 }],
      ease: "inOutQuad",
      loop: true,
    });

    // 2. Anime.js Core Emissive Light Pulse
    const animCore = animate(coreMatRef.current ? coreMatRef.current : {}, {
      emissiveIntensity: [{ to: 2.4, duration: 1500 }, { to: 1.2, duration: 1500 }],
      ease: "inOutSine",
      loop: true,
    });

    return () => {
      animLaser.pause();
      animCore.pause();
    };
  }, []);

  useFrame((state, delta) => {
    const speedMult = hovered ? 2.5 : 1.0;

    // Smooth floating Y-axis rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35 * speedMult;

      const baseScale = isMobile ? 0.95 : 1.25;
      const targetScale = hovered ? baseScale * 1.15 : baseScale;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 6
      );
    }
  });

  return (
    <group
      ref={groupRef}
      scale={isMobile ? 0.95 : 1.25}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {/* 1. Outer Holographic Shield Ring */}
      <mesh>
        <torusGeometry args={[1.35, 0.02, 16, 80]} />
        <meshStandardMaterial
          color={hovered ? "#38bdf8" : "#8b5cf6"}
          emissive={hovered ? "#38bdf8" : "#8b5cf6"}
          emissiveIntensity={hovered ? 1.8 : 0.9}
          wireframe={false}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* 2. Glass Document Base Slab */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.3, 1.75, 0.06]} />
        <meshPhysicalMaterial
          ref={coreMatRef}
          color={hovered ? "#0284c7" : "#4c1d95"}
          emissive={hovered ? "#38bdf8" : "#7c3aed"}
          emissiveIntensity={1.4}
          roughness={0.15}
          metalness={0.85}
          clearcoat={1.0}
          transparent={true}
          opacity={0.95}
        />
      </mesh>

      {/* 3. Glowing Chrome Rim */}
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[1.34, 1.79, 0.01]} />
        <meshBasicMaterial color="#ffffff" wireframe={true} />
      </mesh>

      {/* 4. 3D Floating Header Text */}
      <Text
        position={[0, 0.6, 0.06]}
        fontSize={0.12}
        color="#a3e635"
        anchorX="center"
        anchorY="middle"
      >
        AI DOCUMENT VAULT
      </Text>

      {/* 5. Document Line Placeholders */}
      {[0.3, 0.1, -0.1, -0.3, -0.5].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.05]}>
          <boxGeometry args={[idx === 0 ? 0.9 : 1.0, 0.03, 0.01]} />
          <meshBasicMaterial color={idx === 0 ? "#38bdf8" : "#cbd5e1"} />
        </mesh>
      ))}

      {/* 6. Sweeping Emerald Laser Beam */}
      <mesh ref={laserRef} position={[0, 0, 0.065]}>
        <boxGeometry args={[1.4, 0.035, 0.02]} />
        <meshBasicMaterial color="#34d399" transparent={true} opacity={0.95} />
      </mesh>

      {/* 7. Orbiting Crystalline Moons */}
      <group rotation={[0.4, 0.6, 0]}>
        <mesh position={[1.6, 0.4, 0]}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        <mesh position={[-1.5, -0.5, 0.2]}>
          <icosahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function SynapseCore() {
  return (
    <div className="hero-3d-wrapper" style={{ width: "100%", height: "100%", minHeight: 320 }}>
      <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }}>
        <ambientLight intensity={2.0} />
        <directionalLight position={[10, 10, 8]} intensity={3.0} />
        <pointLight position={[-8, -8, -5]} color="#38bdf8" intensity={2.5} />
        <pointLight position={[8, 8, 5]} color="#8b5cf6" intensity={2.5} />

        <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.4}>
          <HolographicResumeVault />
        </Float>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}