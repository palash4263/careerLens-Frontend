// src/components/canvas/DeskExecutive3D.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { animate } from "animejs";

/**
 * DeskExecutive3D — Ultra-Premium Glassmorphic 3D Desk Scene
 * -----------------------------------------------------------
 * Completely seamless, photorealistic 3D composition:
 * 1. 100% Transparent background (no harsh rectangular box cutoff).
 * 2. High-gloss 3D Resume Slab with metallic blue foil geometry & glowing cyan text lines.
 * 3. Glossy Ceramic Coffee Cup with dark espresso & golden latte art.
 * 4. Obsidian & Gold Foil Executive Pen with realistic metal highlights.
 * 5. Floating Crystalline Nodes & Anime.js steam particle drift.
 * 6. Smooth Mouse Parallax Physics.
 */
export default function DeskExecutive3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Palette ──────────────────────────────────────────────────────────────
    const C_CYAN        = 0x38bdf8;
    const C_VIOLET      = 0x8b5cf6;
    const C_GOLD        = 0xfbbf24;
    const C_RESUME_BG   = 0xffffff;
    const C_BLUE_FOIL   = 0x1d4ed8;
    const C_MUG         = 0xf8fafc;
    const C_COFFEE      = 0x27170c;
    const C_OBSIDIAN    = 0x0f172a;

    // ── Scene Setup ───────────────────────────────────────────────────────────
    const initW = mount.clientWidth  || mount.offsetWidth  || 560;
    const initH = mount.clientHeight || mount.offsetHeight || 560;
    const isMobile = initW < 768;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 100);
    camera.position.set(0, 0.8, isMobile ? 6.2 : 4.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initW, initH);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
    mount.appendChild(renderer.domElement);

    // ── Lighting ──────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x334155, 2.5);
    scene.add(ambientLight);

    const cyanSpot = new THREE.PointLight(C_CYAN, 8.0, 20);
    cyanSpot.position.set(-3, 3, 4);
    scene.add(cyanSpot);

    const violetSpot = new THREE.PointLight(C_VIOLET, 7.0, 20);
    violetSpot.position.set(3, -2, 4);
    scene.add(violetSpot);

    const topSun = new THREE.DirectionalLight(0xffffff, 4.5);
    topSun.position.set(2, 6, 6);
    scene.add(topSun);

    // ── Main Scene Group ──────────────────────────────────────────────────────
    const mainGroup = new THREE.Group();
    // Tilt slightly forward matching reference perspective
    mainGroup.rotation.x = 0.35;
    mainGroup.rotation.y = -0.22;
    scene.add(mainGroup);

    // ── 1. 3D Floating High-Gloss Resume Document ────────────────────────────
    const resumeGroup = new THREE.Group();
    resumeGroup.position.set(-0.7, 0, 0);
    mainGroup.add(resumeGroup);

    // Paper Slab Body (rounded glass physical material)
    const docGeo = new THREE.BoxGeometry(2.1, 2.85, 0.08);
    const docMat = new THREE.MeshPhysicalMaterial({
      color: C_RESUME_BG,
      emissive: 0xf1f5f9,
      emissiveIntensity: 0.2,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const docMesh = new THREE.Mesh(docGeo, docMat);
    resumeGroup.add(docMesh);

    // Pure White Chrome Rim Edge
    const docRimGeo = new THREE.BoxGeometry(2.14, 2.89, 0.02);
    const docRimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const docRimMesh = new THREE.Mesh(docRimGeo, docRimMat);
    docRimMesh.position.z = 0.035;
    resumeGroup.add(docRimMesh);

    // Metallic Blue Foil Top Header Polygon
    const headerShape = new THREE.Shape();
    headerShape.moveTo(-1.05, 1.425);
    headerShape.lineTo(1.05, 1.425);
    headerShape.lineTo(1.05, 0.75);
    headerShape.lineTo(-0.35, 1.02);
    headerShape.closePath();

    const headerGeo = new THREE.ShapeGeometry(headerShape);
    const headerMat = new THREE.MeshStandardMaterial({
      color: C_BLUE_FOIL,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
      metalness: 0.85,
      roughness: 0.15,
      side: THREE.DoubleSide,
    });
    const headerMesh = new THREE.Mesh(headerGeo, headerMat);
    headerMesh.position.z = 0.045;
    resumeGroup.add(headerMesh);

    // Profile Avatar Circle Node
    const avatarGeo = new THREE.CircleGeometry(0.24, 32);
    const avatarMat = new THREE.MeshStandardMaterial({
      color: C_CYAN,
      emissive: C_CYAN,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    const avatarMesh = new THREE.Mesh(avatarGeo, avatarMat);
    avatarMesh.position.set(-0.62, 0.85, 0.048);
    resumeGroup.add(avatarMesh);

    // Glowing Cyan & Muted Text Line Geometry
    [-0.2, -0.4, -0.6, -0.8, -1.0, -1.2].forEach((yPos, i) => {
      const lineGeo = new THREE.BoxGeometry(i === 0 ? 1.4 : 1.7, 0.045, 0.015);
      const lineMat = new THREE.MeshBasicMaterial({ color: i === 0 ? C_CYAN : 0x64748b });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(0.0, yPos, 0.048);
      resumeGroup.add(lineMesh);
    });

    // Bottom Right Geometric Foil Accent
    const accentShape = new THREE.Shape();
    accentShape.moveTo(0.2, -1.425);
    accentShape.lineTo(1.05, -1.425);
    accentShape.lineTo(1.05, -0.55);
    accentShape.closePath();
    const accentGeo = new THREE.ShapeGeometry(accentShape);
    const accentMesh = new THREE.Mesh(accentGeo, headerMat);
    accentMesh.position.z = 0.045;
    resumeGroup.add(accentMesh);

    // ── 2. 3D Glossy Ceramic Coffee Mug ──────────────────────────────────────
    const mugGroup = new THREE.Group();
    mugGroup.position.set(1.5, 0.3, -0.4);
    mainGroup.add(mugGroup);

    // Mug Outer Cylinder Body
    const mugGeo = new THREE.CylinderGeometry(0.55, 0.48, 1.0, 32);
    const mugMat = new THREE.MeshPhysicalMaterial({
      color: C_MUG,
      emissive: 0xf8fafc,
      emissiveIntensity: 0.15,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
    });
    const mugMesh = new THREE.Mesh(mugGeo, mugMat);
    mugGroup.add(mugMesh);

    // Mug Curved Torus Handle
    const handleGeo = new THREE.TorusGeometry(0.32, 0.08, 16, 32, Math.PI);
    const handleMat = new THREE.MeshPhysicalMaterial({ color: C_MUG, roughness: 0.1, clearcoat: 1.0 });
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.position.set(0.55, 0, 0);
    handleMesh.rotation.z = -Math.PI / 2;
    mugGroup.add(handleMesh);

    // Dark Espresso Surface Inside
    const coffeeGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.02, 32);
    const coffeeMat = new THREE.MeshStandardMaterial({ color: C_COFFEE, roughness: 0.15 });
    const coffeeMesh = new THREE.Mesh(coffeeGeo, coffeeMat);
    coffeeMesh.position.set(0, 0.42, 0);
    mugGroup.add(coffeeMesh);

    // Golden Latte Art Ring inside Coffee
    const artGeo = new THREE.TorusGeometry(0.22, 0.03, 16, 32);
    const artMat = new THREE.MeshBasicMaterial({ color: C_GOLD });
    const artMesh = new THREE.Mesh(artGeo, artMat);
    artMesh.position.set(0, 0.435, 0);
    artMesh.rotation.x = Math.PI / 2;
    mugGroup.add(artMesh);

    // ── 3. 3D Obsidian & Gold Executive Fountain Pen ─────────────────────────
    const penGroup = new THREE.Group();
    penGroup.position.set(1.15, -0.65, 0.4);
    penGroup.rotation.z = -Math.PI / 6;
    mainGroup.add(penGroup);

    // Pen Body Barrel
    const penBodyGeo = new THREE.CylinderGeometry(0.045, 0.04, 1.8, 16);
    const penBodyMat = new THREE.MeshStandardMaterial({
      color: C_OBSIDIAN,
      roughness: 0.15,
      metalness: 0.85,
    });
    const penBodyMesh = new THREE.Mesh(penBodyGeo, penBodyMat);
    penGroup.add(penBodyMesh);

    // Gold Foil Clip & Tip Bands
    const goldBandGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 16);
    const goldBandMat = new THREE.MeshStandardMaterial({
      color: C_GOLD,
      emissive: C_GOLD,
      emissiveIntensity: 0.5,
      metalness: 0.95,
      roughness: 0.05,
    });
    const goldBandMesh = new THREE.Mesh(goldBandGeo, goldBandMat);
    goldBandMesh.position.set(0, 0.45, 0);
    penGroup.add(goldBandMesh);

    // ── 4. Floating Crystalline Tech Gem Orbiters ─────────────────────────────
    const orbGroup = new THREE.Group();
    mainGroup.add(orbGroup);

    const orbGeos = [
      new THREE.IcosahedronGeometry(0.18, 0),
      new THREE.OctahedronGeometry(0.16, 0),
    ];
    const orbColors = [C_CYAN, C_GOLD];

    orbGeos.forEach((geo, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: orbColors[i],
        emissive: orbColors[i],
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
      });
      const orb = new THREE.Mesh(geo, mat);
      const angle = (i * Math.PI) + 0.5;
      orb.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 1.2, 0.3);
      orbGroup.add(orb);
    });

    // ── 5. Steam Particle Drift from Coffee Mug ─────────────────────────────
    const steamCount = 16;
    const steamPos   = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3]     = (Math.random() - 0.5) * 0.25;
      steamPos[i * 3 + 1] = 0.5 + Math.random() * 0.7;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    const steamGeo = new THREE.BufferGeometry();
    steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({
      color: C_CYAN,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const steamParticles = new THREE.Points(steamGeo, steamMat);
    mugGroup.add(steamParticles);

    // ═════════════════════════════════════════════════════════════════════════
    // ── ANIME.JS KEYFRAME ANIMATIONS ──────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    // A) Anime.js Resume Document Float Oscillating
    const animResume = animate(resumeGroup.position, {
      y: [{ to: 0.14, duration: 2200 }, { to: -0.06, duration: 2200 }],
      ease: "inOutSine",
      loop: true,
    });

    // B) Anime.js Orbit Gems Rotation
    const animOrbs = animate(orbGroup.rotation, {
      z: "360deg",
      ease: "linear",
      duration: 14000,
      loop: true,
    });

    // C) Anime.js Coffee Steam Particle Rise
    const animSteam = animate(steamParticles.position, {
      y: [{ to: 0.5, duration: 1600 }, { to: 0.0, duration: 1600 }],
      ease: "inOutQuad",
      loop: true,
    });

    // ── Mouse Parallax ────────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const onPointerMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    };
    mount.addEventListener("pointermove", onPointerMove);

    // ── Resize Observer ───────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.position.z = w < 768 ? 6.2 : 4.4;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(mount);

    // ── Render Loop ───────────────────────────────────────────────────────────
    let frameId;
    function renderLoop() {
      // Parallax camera lerp
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.04;
      camera.position.y += (0.8 + mouse.y * 0.3 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderLoop);
    }
    renderLoop();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      animResume.pause();
      animOrbs.pause();
      animSteam.pause();
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      [docGeo, docRimGeo, headerGeo, avatarGeo, accentGeo, mugGeo, handleGeo, coffeeGeo, artGeo, penBodyGeo, goldBandGeo, steamGeo].forEach(g => g.dispose());
      orbGeos.forEach(g => g.dispose());
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 420, position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
