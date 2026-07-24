import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, MeshDistortMaterial, Float, useGLTF } from "@react-three/drei";
import { useRef, useState, useEffect, Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) {
    // Catch GLB 404/parse errors
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function TripoModel({ hovered }) {
  const meshRef = useRef(null);
  const { scene } = useGLTF("/models/tripo_model.glb");

  useFrame((state, delta) => {
    const speedMult = hovered ? 2.5 : 1.0;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25 * speedMult;
    }
  });

  return <primitive ref={meshRef} object={scene} scale={2.8} />;
}

function SynapseCoreMesh() {
  const innerRef = useRef(null);
  const outerRef = useRef(null);
  const groupRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    const speedMult = hovered ? 2.5 : 1.0;

    if (innerRef.current) {
      innerRef.current.rotation.x += delta * 0.2 * speedMult;
      innerRef.current.rotation.y += delta * -0.35 * speedMult;
    }
    
    if (outerRef.current) {
      outerRef.current.rotation.x += delta * -0.12 * speedMult;
      outerRef.current.rotation.y += delta * 0.18 * speedMult;
    }

    if (groupRef.current) {
      const baseScale = isMobile ? 1.5 : 2.8;
      const targetScale = hovered ? baseScale * 1.25 : baseScale;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 6);
    }
  });

  return (
    <group 
      ref={groupRef}
      scale={isMobile ? 1.5 : 2.8}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onPointerDown={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerUp={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* 1. INNER CORE: Solid glowing abstract data crystal */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[0.5, 0]} />
        <MeshDistortMaterial
          color="#f3e8ff"
          emissive="#a855f7"
          emissiveIntensity={hovered ? 3.0 : 2.0}
          distort={hovered ? 0.5 : 0.3}
          speed={hovered ? 5 : 3}
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
          opacity={hovered ? 0.6 : 0.35}
        />
      </mesh>
    </group>
  );
}

export default function SynapseCore() {
  return (
    <div className="hero-3d-wrapper">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2.5} />
        <pointLight position={[-10, -10, -5]} color="#7c3aed" intensity={2} />
        
        <Float speed={3.5} rotationIntensity={0.5} floatIntensity={1.2}>
          <ErrorBoundary fallback={<SynapseCoreMesh />}>
            <TripoModel />
          </ErrorBoundary>
        </Float>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}