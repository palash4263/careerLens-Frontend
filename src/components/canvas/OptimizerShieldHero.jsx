// src/components/canvas/OptimizerShieldHero.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { animate, stagger } from "animejs";

/**
 * OptimizerShieldHero — Quantum Neural Brain Core
 * -------------------------------------------------
 * A completely new 3D model: An AI neural brain orb sitting inside
 * a multi-layered rotating gyroscope ring system, surrounded by
 * orbiting data nodes and a sweeping holographic data stream.
 *
 * Anime.js drives:
 *  - Gyroscope ring rotation cascade (3 nested rings, staggered)
 *  - Neural pulse emissive intensity oscillation
 *  - Data node orbit + colour cycling
 *  - Holographic beam sweep
 */
export default function OptimizerShieldHero() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Palette ──────────────────────────────────────────────────────────────
    const C_CYAN     = 0x38bdf8;
    const C_VIOLET   = 0x8b5cf6;
    const C_EMERALD  = 0x34d399;
    const C_MAGENTA  = 0xec4899;
    const C_GOLD     = 0xfbbf24;
    const C_WHITE    = 0xffffff;

    // ── Scene Setup ───────────────────────────────────────────────────────────
    const initW = mount.clientWidth  || mount.offsetWidth  || 520;
    const initH = mount.clientHeight || mount.offsetHeight || 520;
    const isMobile = initW < 768;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(45, initW / initH, 0.1, 100);
    camera.position.set(0, 0, isMobile ? 8.5 : 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
    mount.appendChild(renderer.domElement);

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1e293b, 3));
    const cyanPt = new THREE.PointLight(C_CYAN,   12, 25); cyanPt.position.set(-3, 3, 4);   scene.add(cyanPt);
    const violPt = new THREE.PointLight(C_VIOLET, 10, 25); violPt.position.set( 3,-3, 4);   scene.add(violPt);
    const topDir = new THREE.DirectionalLight(C_WHITE, 4); topDir.position.set(0, 8, 6);     scene.add(topDir);

    // ── 1. Neural Brain Orb (central sphere) ─────────────────────────────────
    const brainGeo = new THREE.IcosahedronGeometry(1.0, 4);
    const brainMat = new THREE.MeshPhysicalMaterial({
      color:              C_CYAN,
      emissive:           C_VIOLET,
      emissiveIntensity:  0.6,
      metalness:          0.3,
      roughness:          0.05,
      clearcoat:          1,
      clearcoatRoughness: 0.05,
      transparent:        true,
      opacity:            0.92,
      wireframe:          false,
    });
    const brainMesh = new THREE.Mesh(brainGeo, brainMat);
    scene.add(brainMesh);

    // Inner glow orb (additive blending, smaller)
    const glowGeo = new THREE.SphereGeometry(0.88, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: C_CYAN, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // ── 2. Wireframe Icosahedron Shell ────────────────────────────────────────
    const wireGeo = new THREE.IcosahedronGeometry(1.12, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: C_CYAN, wireframe: true, transparent: true, opacity: 0.25,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // ── 3. Gyroscope Rings ────────────────────────────────────────────────────
    const ringDefs = [
      { radius: 1.7, tube: 0.025, color: C_CYAN,    rot: [Math.PI / 2, 0, 0] },
      { radius: 1.7, tube: 0.025, color: C_VIOLET,  rot: [0, 0, Math.PI / 3] },
      { radius: 1.7, tube: 0.025, color: C_EMERALD, rot: [0, Math.PI / 4, Math.PI / 2] },
    ];
    const gyroGroups = ringDefs.map(({ radius, tube, color, rot }) => {
      const geo = new THREE.TorusGeometry(radius, tube, 16, 120);
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.8,
        metalness: 0.9, roughness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const grp  = new THREE.Group();
      grp.rotation.set(...rot);
      grp.add(mesh);
      scene.add(grp);
      return grp;
    });

    // ── 4. Floating Data Nodes ────────────────────────────────────────────────
    const nodeColors  = [C_GOLD, C_MAGENTA, C_EMERALD, C_CYAN, C_VIOLET, C_WHITE];
    const nodeGeos    = [
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.IcosahedronGeometry(0.10, 0),
      new THREE.TetrahedronGeometry(0.12, 0),
    ];
    const nodeCount   = 9;
    const nodes       = [];
    const nodesGroup  = new THREE.Group();
    scene.add(nodesGroup);

    for (let i = 0; i < nodeCount; i++) {
      const angle  = (i / nodeCount) * Math.PI * 2;
      const radius = 2.3 + (i % 3) * 0.22;
      const yOff   = (Math.random() - 0.5) * 1.2;
      const geo    = nodeGeos[i % nodeGeos.length];
      const mat    = new THREE.MeshStandardMaterial({
        color:             nodeColors[i % nodeColors.length],
        emissive:          nodeColors[i % nodeColors.length],
        emissiveIntensity: 0.9,
        metalness: 0.9, roughness: 0.05,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(Math.cos(angle) * radius, yOff, Math.sin(angle) * radius);
      nodesGroup.add(mesh);
      nodes.push(mesh);
    }

    // ── 5. Holographic Beam Sweep Plane ───────────────────────────────────────
    const beamGeo = new THREE.PlaneGeometry(3.8, 0.04);
    const beamMat = new THREE.MeshBasicMaterial({
      color: C_EMERALD, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    scene.add(beamMesh);

    // ── 6. Star Particles ─────────────────────────────────────────────────────
    const pCount = 400;
    const pPos   = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 5 + Math.random() * 8;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pPos[i*3]   = r * Math.sin(p) * Math.cos(t);
      pPos[i*3+1] = r * Math.sin(p) * Math.sin(t);
      pPos[i*3+2] = r * Math.cos(p) - 3;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: C_CYAN, size: 0.035, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // ═════════════════════════════════════════════════════════════════════════
    // ── ANIME.JS ANIMATIONS ───────────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    // A) Neural Orb Emissive Pulse
    const animeOrb = animate(brainMat, {
      emissiveIntensity: [{ to: 1.4, duration: 1800 }, { to: 0.4, duration: 1800 }],
      ease: "inOutSine",
      loop: true,
    });

    // B) Gyroscope Ring Staggered Spin — each ring gets a different continuous rotation axis
    const gyroSpins = [
      animate(gyroGroups[0].rotation, { y: "+=6.28318", ease: "linear", duration: 6000, loop: true }),
      animate(gyroGroups[1].rotation, { x: "+=6.28318", ease: "linear", duration: 9000, loop: true }),
      animate(gyroGroups[2].rotation, { z: "+=6.28318", ease: "linear", duration: 7500, loop: true }),
    ];

    // C) Entire Node Orbit Group slow spin
    const animeNodes = animate(nodesGroup.rotation, {
      y: "+=6.28318",
      ease: "linear",
      duration: 18000,
      loop: true,
    });

    // D) Holographic Beam Sweep (Y position)
    const animeBeam = animate(beamMesh.position, {
      y: [{ to:  1.45, duration: 1600 }, { to: -1.45, duration: 1600 }],
      ease: "inOutQuad",
      loop: true,
    });

    // E) Glow orb scale breath
    const animeGlow = animate(glowMesh.scale, {
      x: [{ to: 1.12, duration: 2200 }, { to: 0.92, duration: 2200 }],
      y: [{ to: 1.12, duration: 2200 }, { to: 0.92, duration: 2200 }],
      z: [{ to: 1.12, duration: 2200 }, { to: 0.92, duration: 2200 }],
      ease: "inOutSine",
      loop: true,
    });

    // F) Cyan point light pulse
    const animeLightCyan = animate(cyanPt, {
      intensity: [{ to: 16, duration: 2000 }, { to: 7, duration: 2000 }],
      ease: "inOutSine",
      loop: true,
    });

    // ── Mouse Parallax ────────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const onMove = (e) => {
      const r   = mount.getBoundingClientRect();
      mouse.x   = ((e.clientX - r.left) / r.width)  * 2 - 1;
      mouse.y   = -((e.clientY - r.top)  / r.height) * 2 + 1;
    };
    mount.addEventListener("pointermove", onMove);

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.position.z = w < 768 ? 9 : 5.5;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    // ── Render Loop ───────────────────────────────────────────────────────────
    let frameId;
    const tick = () => {
      // Brain orb slow self-rotation
      brainMesh.rotation.y += 0.003;
      brainMesh.rotation.x += 0.001;
      wireMesh.rotation.y  -= 0.004;
      wireMesh.rotation.z  += 0.002;

      // Parallax camera
      camera.position.x += (mouse.x * 0.7 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };
    tick();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      [animeOrb, ...gyroSpins, animeNodes, animeBeam, animeGlow, animeLightCyan]
        .forEach(a => a.pause());
      ro.disconnect();
      mount.removeEventListener("pointermove", onMove);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 420, position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}