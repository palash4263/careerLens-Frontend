import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, MeshDistortMaterial, Float, useGLTF } from "@react-three/drei";
import { useRef, useState, Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) {
    // Gracefully catch 404/parsing errors for the GLB model
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function TripoModel() {
  const meshRef = useRef(null);
  const { scene } = useGLTF("/models/tripo_model.glb");

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.15;
      meshRef.current.rotation.y = time * 0.25;
    }
  });

  return <primitive ref={meshRef} object={scene} scale={2.0} />;
}

function GlowingCrystal() {
  const meshRef = useRef(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.15;
      meshRef.current.rotation.y = time * 0.25;
    }
  });

  return (
    <mesh ref={meshRef} scale={2.2}>
      <torusKnotGeometry args={[0.6, 0.2, 120, 16]} />
      <MeshDistortMaterial
        color="#d8b4fe"
        emissive="#a855f7"
        emissiveIntensity={1.5}
        distort={0.35}
        speed={2.5}
        roughness={0.1}
        metalness={0.9}
        wireframe={false}
      />
    </mesh>
  );
}

export default function FloatingModel() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "330px", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <pointLight position={[-10, -10, -5]} color="#a855f7" intensity={2} />
        
        <Float speed={3} rotationIntensity={0.8} floatIntensity={1}>
          <ErrorBoundary fallback={<GlowingCrystal />}>
            <TripoModel />
          </ErrorBoundary>
        </Float>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}