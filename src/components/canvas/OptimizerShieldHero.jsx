import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * OptimizerShieldHero
 * --------------------
 * 3D hero visual for the Resume Optimizer page ("Transform Your Resume into
 * an ATS-Crushing Shield"). A faceted shield made of layered plates rotates
 * slowly, with an inner emissive core and an orbiting ring of ATS-keyword
 * energy chips — the resume literally forged into armor against ATS rejection.
 *
 * Renders transparent (no background box) so it drops straight into a hero
 * section. Usage: <OptimizerShieldHero /> inside a container with a set height.
 */
export default function OptimizerShieldHero() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---------- palette (matches Career Lens optimizer page) ----------
    const COLOR_VIOLET = 0x8b5cf6;
    const COLOR_VIOLET_DEEP = 0x4c2f8f;
    const COLOR_BLUE = 0x5b8def;
    const COLOR_TEAL = 0x2ee6a6;
    const COLOR_GOLD = 0xf3b83c;
    const COLOR_PLATE = 0x1c1830;
    const COLOR_PLATE_EDGE = 0x9b7bf6;

    // ---------- scene / camera / renderer ----------
    const initW = mount.clientWidth || mount.offsetWidth || 480;
    const initH = mount.clientHeight || mount.offsetHeight || 480;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 100);
    camera.position.set(0, 0.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initW, initH);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    // ---------- lights ----------
    scene.add(new THREE.AmbientLight(0x3a3355, 1.0));

    const violetLight = new THREE.PointLight(COLOR_VIOLET, 3, 20);
    violetLight.position.set(-3, 3, 4);
    scene.add(violetLight);

    const blueLight = new THREE.PointLight(COLOR_BLUE, 2.4, 20);
    blueLight.position.set(4, -2, 3);
    scene.add(blueLight);

    const rimLight = new THREE.PointLight(COLOR_TEAL, 1.4, 20);
    rimLight.position.set(0, -3, -4);
    scene.add(rimLight);

    // ---------- shield shape ----------
    // Classic shield silhouette: rounded top, tapering to a point at the bottom.
    function buildShieldShape(width, height) {
      const shape = new THREE.Shape();
      const w = width / 2;
      shape.moveTo(-w, height * 0.32);
      shape.bezierCurveTo(-w, height * 0.55, -w, height * 0.5, 0, height * 0.5);
      shape.bezierCurveTo(w, height * 0.5, w, height * 0.55, w, height * 0.32);
      shape.bezierCurveTo(w, -height * 0.05, w * 0.7, -height * 0.32, 0, -height * 0.5);
      shape.bezierCurveTo(-w * 0.7, -height * 0.32, -w, -height * 0.05, -w, height * 0.32);
      return shape;
    }

    const shieldGroup = new THREE.Group();
    scene.add(shieldGroup);

    // outer plate (extruded, faceted armor look)
    const outerShape = buildShieldShape(3.0, 3.6);
    const outerGeo = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      curveSegments: 8,
    });
    outerGeo.center();
    const outerMat = new THREE.MeshStandardMaterial({
      color: COLOR_PLATE,
      roughness: 0.4,
      metalness: 0.55,
    });
    const outerPlate = new THREE.Mesh(outerGeo, outerMat);
    shieldGroup.add(outerPlate);

    // edge outline (glowing rim)
    const edgeShapePoints = outerShape.getPoints(60);
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(
      edgeShapePoints.map((p) => new THREE.Vector3(p.x, p.y, 0.17))
    );
    const edgeMat = new THREE.LineBasicMaterial({ color: COLOR_PLATE_EDGE, transparent: true, opacity: 0.9 });
    const edgeLine = new THREE.LineLoop(edgeGeo, edgeMat);
    edgeLine.position.z = 0;
    outerGeo.computeBoundingBox();
    shieldGroup.add(edgeLine);

    // inner emissive core (smaller shield, glowing, floats slightly in front)
    const innerShape = buildShieldShape(1.7, 2.1);
    const innerGeo = new THREE.ShapeGeometry(innerShape, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: COLOR_VIOLET_DEEP,
      emissive: COLOR_VIOLET,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    innerCore.position.z = 0.22;
    shieldGroup.add(innerCore);

    // core center emblem (small glowing disc, like a checkmark socket)
    const emblemGeo = new THREE.CircleGeometry(0.32, 32);
    const emblemMat = new THREE.MeshBasicMaterial({ color: COLOR_TEAL, transparent: true, opacity: 0.9 });
    const emblem = new THREE.Mesh(emblemGeo, emblemMat);
    emblem.position.z = 0.24;
    shieldGroup.add(emblem);

    // faceted rivets / plate seams (small boxes along the shield edge for armor detail)
    const rivetGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const rivetMat = new THREE.MeshStandardMaterial({ color: COLOR_GOLD, roughness: 0.4, metalness: 0.7 });
    const rivetPositions = [
      [-1.05, 1.35], [1.05, 1.35], [-1.35, 0.4], [1.35, 0.4],
      [-1.1, -0.6], [1.1, -0.6], [0, -1.55],
    ];
    rivetPositions.forEach(([x, y]) => {
      const rivet = new THREE.Mesh(rivetGeo, rivetMat);
      rivet.position.set(x, y, 0.2);
      shieldGroup.add(rivet);
    });

    shieldGroup.rotation.y = -0.1;

    // ---------- scanning arc rings (rotating around the shield, like a protective field) ----------
    const rings = [];
    [2.4, 2.85].forEach((radius, i) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.012, 8, 80, Math.PI * 1.3);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? COLOR_TEAL : COLOR_BLUE,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (i === 0 ? 0.15 : -0.2);
      scene.add(ring);
      rings.push(ring);
    });

    // ---------- helper: canvas text sprite (keyword / stat chip) ----------
    function makeChip(label, sub, accentHex) {
      const canvas = document.createElement("canvas");
      const w = 480, h = 168;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const accent = "#" + accentHex.toString(16).padStart(6, "0");

      function roundRect(x, y, ww, hh, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + ww, y, x + ww, y + hh, r);
        ctx.arcTo(x + ww, y + hh, x, y + hh, r);
        ctx.arcTo(x, y + hh, x, y, r);
        ctx.arcTo(x, y, x + ww, y, r);
        ctx.closePath();
      }

      ctx.fillStyle = "rgba(14, 12, 24, 0.92)";
      roundRect(8, 8, w - 16, h - 16, 26);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = accent;
      roundRect(8, 8, w - 16, h - 16, 26);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(48, h / 2, 12, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();

      ctx.fillStyle = "#f4f2fb";
      ctx.font = "600 38px 'Segoe UI', Arial, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 78, h / 2 - 16);

      ctx.fillStyle = accent;
      ctx.font = "600 32px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(sub, 78, h / 2 + 30);

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.75, 0.61, 1);
      return sprite;
    }

    const chipKeyword = makeChip("Keyword matched", "94% relevance", COLOR_TEAL);
    const chipShield = makeChip("ATS shield active", "Passing all filters", COLOR_VIOLET);
    const chipSuccess = makeChip("Success rate", "94% land interviews", COLOR_GOLD);
    const chips = [chipKeyword, chipShield, chipSuccess];
    chips.forEach((c) => scene.add(c));

    // ---------- ambient particle field ----------
    const PARTICLE_COUNT = 220;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 5 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi) - 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: COLOR_VIOLET,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ---------- mouse parallax ----------
    const mouse = { x: 0, y: 0 };
    function onPointerMove(e) {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
    mount.addEventListener("pointermove", onPointerMove);

    // ---------- resize ----------
    function handleResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);
    requestAnimationFrame(handleResize);
    const settleTimer = setTimeout(handleResize, 250);

    // ---------- animation loop ----------
    const startTime = performance.now();
    let frameId;

    function animate() {
      const t = (performance.now() - startTime) / 1000;

      // shield: gentle float + rotation, drifts toward mouse
      shieldGroup.rotation.y = -0.1 + Math.sin(t * 0.3) * 0.3 + mouse.x * 0.3;
      shieldGroup.rotation.x = Math.sin(t * 0.4) * 0.06 + mouse.y * 0.1;
      shieldGroup.position.y = Math.sin(t * 0.55) * 0.1;

      // core emblem pulse (like a heartbeat / active-scan pulse)
      const pulse = 0.85 + Math.sin(t * 2.2) * 0.15;
      emblem.scale.set(pulse, pulse, 1);
      innerMat.emissiveIntensity = 0.7 + Math.sin(t * 2.2) * 0.25;

      // protective field rings spin
      rings[0].rotation.z = t * 0.4;
      rings[1].rotation.z = -t * 0.28;

      // orbiting chips
      const orbitR = 3.2;
      chips.forEach((c, i) => {
        const speed = 0.2 + i * 0.05;
        const offset = (i / chips.length) * Math.PI * 2;
        const angle = t * speed + offset;
        c.position.set(
          Math.cos(angle) * orbitR,
          Math.sin(angle * 0.75) * 1.3 + Math.sin(i * 2) * 0.2,
          Math.sin(angle) * 1.6 - 0.3
        );
        const depth = (c.position.z + 2.1) / 4.2;
        c.material.opacity = THREE.MathUtils.clamp(0.35 + depth * 0.75, 0.25, 1);
      });

      // particle drift
      particles.rotation.y = t * 0.02;
      particles.rotation.x = t * 0.01;

      // camera parallax
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (0.2 + mouse.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    // ---------- cleanup ----------
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(settleTimer);
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      [outerGeo, edgeGeo, innerGeo, emblemGeo, rivetGeo].forEach((g) => g.dispose());
      rings.forEach((r) => r.geometry.dispose());
      [outerMat, edgeMat, innerMat, emblemMat, rivetMat].forEach((m) => m.dispose());
      rings.forEach((r) => r.material.dispose());
      [particleGeo].forEach((g) => g.dispose());
      [particleMat].forEach((m) => m.dispose());
      chips.forEach((c) => {
        c.material.map.dispose();
        c.material.dispose();
      });
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 380, position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}