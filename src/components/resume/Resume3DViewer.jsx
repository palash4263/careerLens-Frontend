// src/components/resume/Resume3DViewer.jsx
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Text } from "@react-three/drei";
import { motion } from "framer-motion";
import { Sparkles, Box, X, RotateCcw, ShieldCheck, Cpu } from "lucide-react";
import "./Resume3DViewer.css";

// 3D Floating Holographic Resume Slab
function FloatingResumeMesh({ name = "PALASH MISHRA", score = 95 }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (hovered ? 0.8 : 0.3);
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.15;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Outer Glowing Metallic Frame */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.05 : 1}
      >
        <boxGeometry args={[3.2, 4.2, 0.15]} />
        <meshStandardMaterial
          color={hovered ? "#38bdf8" : "#7c3aed"}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Inner Document Paper Surface */}
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[3.0, 4.0]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>

      {/* 3D Floating Name Text */}
      <Text
        position={[0, 1.4, 0.12]}
        fontSize={0.24}
        color="#a3e635"
        anchorX="center"
        anchorY="middle"
      >
        {name.toUpperCase()}
      </Text>

      {/* Subtitle Badge Text */}
      <Text
        position={[0, 1.0, 0.12]}
        fontSize={0.12}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        EXECUTIVE RESUME • ATS 100%
      </Text>

      {/* Clean 3D ATS Score Badge */}
      <Text
        position={[0, 0.1, 0.14]}
        fontSize={0.28}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        {`ATS SCORE: ${score}%`}
      </Text>

      {/* Decorative Lines simulating bullet points in 3D */}
      {[-0.8, -1.1, -1.4].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.1]}>
          <boxGeometry args={[2.2, 0.06, 0.02]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>
      ))}

      {/* Hologram Distort Sphere Orb */}
      <mesh position={[1.4, 1.8, 0.4]} scale={0.4}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color="#38bdf8"
          speed={3}
          distort={0.4}
          radius={1}
        />
      </mesh>
    </group>
  );
}

// Orbiting Tech Moons
function OrbitingNodes() {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[2.6, 1.0, 0]}>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial color="#a3e635" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-2.6, -1.2, 0]}>
        <icosahedronGeometry args={[0.28]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 2.4, -1]}>
        <torusKnotGeometry args={[0.2, 0.06, 64, 8]} />
        <meshStandardMaterial color="#a855f7" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function Resume3DViewer({ isOpen, onClose, candidateName = "Palash Mishra", score = 95 }) {
  if (!isOpen) return null;

  return (
    <div className="r3d-overlay" onClick={onClose}>
      <motion.div
        className="r3d-modal-card"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
      >
        {/* Top Bar */}
        <div className="r3d-header">
          <div className="r3d-title-group">
            <Cpu size={18} className="r3d-icon-spin" />
            <span className="r3d-title">3D Hologram Resume Showcase</span>
            <span className="r3d-badge">THREE.JS POWERED</span>
          </div>
          <button className="r3d-close-btn" onClick={onClose} aria-label="Close 3D viewer">
            <X size={16} />
          </button>
        </div>

        {/* 3D Canvas Viewport */}
        <div className="r3d-canvas-wrapper">
          <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} color="#38bdf8" />
            <pointLight position={[-10, -10, -10]} intensity={1.0} color="#a3e635" />
            
            <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
              <FloatingResumeMesh name={candidateName} score={score} />
              <OrbitingNodes />
            </Float>

            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI - Math.PI / 4}
            />
          </Canvas>
          <div className="r3d-hint">
            <RotateCcw size={12} />
            <span>Drag to rotate 3D hologram • Scroll to zoom</span>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="r3d-footer">
          <div className="r3d-meta-item">
            <ShieldCheck size={14} style={{ color: "#a3e635" }} />
            <span>Real-Time 3D Mesh Shader</span>
          </div>
          <div className="r3d-meta-item">
            <Sparkles size={14} style={{ color: "#38bdf8" }} />
            <span>Interactive Lighting & Materials</span>
          </div>
          <button className="r3d-btn-done" onClick={onClose}>
            <span>Close 3D View</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
