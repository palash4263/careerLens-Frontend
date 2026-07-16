import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, MeshDistortMaterial, Float } from "@react-three/drei";
import { useRef } from "react";

function SynapseCoreMesh() {
  const innerRef = useRef(null);
  const outerRef = useRef(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (innerRef.current) {
      innerRef.current.rotation.x = time * 0.2;
      innerRef.current.rotation.y = time * -0.35;
    }
    
    if (outerRef.current) {
      outerRef.current.rotation.x = time * -0.12;
      outerRef.current.rotation.y = time * 0.18;
    }
  });

  return (
    /* ✅ Increased group scale from 1.9 to 2.8 to make the core model significantly larger */
    <group scale={2.8}>
      {/* 1. INNER CORE: Solid glowing abstract data crystal */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[0.5, 0]} />
        <MeshDistortMaterial
          color="#f3e8ff"
          emissive="#a855f7"
          emissiveIntensity={2.0}
          distort={0.3}
          speed={3}
          roughness={0.1}
          metalness={0.9}
          wireframe={false}
        />
      </mesh>

      {/* 2. OUTER SHELL: Structural connectivity mesh grid */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshBasicMaterial
          color="#c084fc"
          wireframe={true}
          transparent={true}
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

export default function SynapseCore() {
  return (
    /* ✅ Increased container minHeight to 400px to give the enlarged model plenty of vertical canvas room */
    <div style={{ width: "100%", height: "100%", minHeight: "400px", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2.5} />
        <pointLight position={[-10, -10, -5]} color="#7c3aed" intensity={2} />
        
        <Float speed={3.5} rotationIntensity={0.5} floatIntensity={1.2}>
          <SynapseCoreMesh />
        </Float>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}