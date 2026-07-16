import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ResumeSaas3DHero
 * -----------------
 * Drop-in 3D hero visual for a resume-management SaaS (styled for "Career Lens":
 * near-black background, violet/gold accents, teal "success" states).
 *
 * A floating resume card slowly rotates while a teal scan-line sweeps across it
 * (representing ATS analysis). Three badge sprites orbit the card, echoing the
 * "ATS Optimized / Job Matched / 94% Fit" language already used in the product.
 *
 * Usage: <ResumeSaas3DHero /> — fills its parent container (set a height on the parent).
 */
export default function ResumeSaas3DHero() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---------- palette (matches Career Lens dashboard) ----------
    const COLOR_BG = 0x0a0913;
    const COLOR_GOLD = 0xf3b83c;
    const COLOR_VIOLET = 0x9b6bf2;
    const COLOR_VIOLET_DEEP = 0x4c2f8f;
    const COLOR_TEAL = 0x2ee6a6;
    const COLOR_BLUE = 0x5b8def;
    const COLOR_CARD = 0x171426;
    const COLOR_LINE = 0x3a3550;
    const COLOR_TEXT_LINE = 0x55506c;

    // ---------- scene / camera / renderer ----------
    // Guard against the panel not having a laid-out size yet (common in flex/grid
    // parents on first mount) — fall back to a sane default and correct on resize.
    const initW = mount.clientWidth || mount.offsetWidth || 480;
    const initH = mount.clientHeight || mount.offsetHeight || 480;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 100);
    camera.position.set(0, 0.3, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initW, initH);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    // ---------- lights ----------
    scene.add(new THREE.AmbientLight(0x3a3355, 1.1));

    const goldLight = new THREE.PointLight(COLOR_GOLD, 2.2, 20);
    goldLight.position.set(3, 3, 4);
    scene.add(goldLight);

    const violetLight = new THREE.PointLight(COLOR_VIOLET, 2.6, 20);
    violetLight.position.set(-4, -2, 3);
    scene.add(violetLight);

    const rimLight = new THREE.PointLight(COLOR_TEAL, 1.2, 20);
    rimLight.position.set(0, -3, -4);
    scene.add(rimLight);

    // ---------- helper: canvas text sprite (rounded pill badge) ----------
    function makeBadge(label, sub, accentHex) {
      const canvas = document.createElement("canvas");
      const w = 512, h = 176;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      const accent = "#" + accentHex.toString(16).padStart(6, "0");

      // rounded card background
      const r = 28;
      ctx.fillStyle = "rgba(15, 13, 26, 0.92)";
      roundRect(ctx, 8, 8, w - 16, h - 16, r);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = accent;
      roundRect(ctx, 8, 8, w - 16, h - 16, r);
      ctx.stroke();

      // status dot
      ctx.beginPath();
      ctx.arc(52, h / 2, 14, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();

      // label
      ctx.fillStyle = "#f4f2fb";
      ctx.font = "600 40px 'Segoe UI', Arial, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 84, h / 2 - 18);

      // sub
      ctx.fillStyle = accent;
      ctx.font = "600 34px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(sub, 84, h / 2 + 32);

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(2.1, 0.72, 1);
      return sprite;
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // ---------- resume card group ----------
    const resumeGroup = new THREE.Group();
    scene.add(resumeGroup);

    // base card
    const cardGeo = new THREE.PlaneGeometry(2.6, 3.4);
    const cardMat = new THREE.MeshStandardMaterial({
      color: COLOR_CARD,
      roughness: 0.55,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const card = new THREE.Mesh(cardGeo, cardMat);
    resumeGroup.add(card);

    // glowing edge frame
    const edges = new THREE.EdgesGeometry(cardGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: COLOR_VIOLET, transparent: true, opacity: 0.8 });
    resumeGroup.add(new THREE.LineSegments(edges, edgeMat));

    // header bar (name)
    const headerGeo = new THREE.PlaneGeometry(1.35, 0.16);
    const headerMat = new THREE.MeshBasicMaterial({ color: COLOR_GOLD });
    const header = new THREE.Mesh(headerGeo, headerMat);
    header.position.set(-0.55, 1.42, 0.01);
    resumeGroup.add(header);

    // contact line
    const contactGeo = new THREE.PlaneGeometry(0.9, 0.06);
    const contactMat = new THREE.MeshBasicMaterial({ color: COLOR_LINE });
    const contact = new THREE.Mesh(contactGeo, contactMat);
    contact.position.set(-0.75, 1.2, 0.01);
    resumeGroup.add(contact);

    // avatar circle
    const avatarGeo = new THREE.CircleGeometry(0.24, 32);
    const avatarMat = new THREE.MeshStandardMaterial({ color: COLOR_VIOLET_DEEP, emissive: COLOR_VIOLET, emissiveIntensity: 0.25 });
    const avatar = new THREE.Mesh(avatarGeo, avatarMat);
    avatar.position.set(0.95, 1.35, 0.01);
    resumeGroup.add(avatar);

    // section divider
    const dividerGeo = new THREE.PlaneGeometry(2.2, 0.03);
    const dividerMat = new THREE.MeshBasicMaterial({ color: COLOR_TEAL, transparent: true, opacity: 0.7 });
    const divider = new THREE.Mesh(dividerGeo, dividerMat);
    divider.position.set(0, 0.95, 0.01);
    resumeGroup.add(divider);

    // paragraph text lines (varying widths, like body copy)
    const lineWidths = [2.15, 1.9, 2.0, 1.5, 2.1, 1.75, 1.95, 1.3, 2.15, 1.6, 1.85, 1.4];
    let y = 0.72;
    lineWidths.forEach((w, i) => {
      const geo = new THREE.PlaneGeometry(w, 0.055);
      const mat = new THREE.MeshBasicMaterial({ color: COLOR_TEXT_LINE });
      const line = new THREE.Mesh(geo, mat);
      line.position.set(-1.3 + w / 2, y, 0.01);
      resumeGroup.add(line);
      y -= 0.155;
      if (i === 5) {
        // extra divider mid-page
        const d2 = new THREE.Mesh(dividerGeo.clone(), new THREE.MeshBasicMaterial({ color: COLOR_BLUE, transparent: true, opacity: 0.5 }));
        d2.position.set(0, y - 0.06, 0.01);
        resumeGroup.add(d2);
        y -= 0.2;
      }
    });

    // ATS scan line (glowing bar that sweeps top to bottom)
    const scanGeo = new THREE.PlaneGeometry(2.6, 0.05);
    const scanMat = new THREE.MeshBasicMaterial({
      color: COLOR_TEAL,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const scanLine = new THREE.Mesh(scanGeo, scanMat);
    scanLine.position.z = 0.03;
    resumeGroup.add(scanLine);

    // soft glow behind scan line
    const scanGlowGeo = new THREE.PlaneGeometry(2.6, 0.4);
    const scanGlowMat = new THREE.MeshBasicMaterial({
      color: COLOR_TEAL,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const scanGlow = new THREE.Mesh(scanGlowGeo, scanGlowMat);
    scanGlow.position.z = 0.02;
    resumeGroup.add(scanGlow);

    resumeGroup.rotation.y = -0.15;

    // ---------- orbiting badges ----------
    const badgeATS = makeBadge("ATS optimized", "98% pass rate", COLOR_TEAL);
    const badgeJob = makeBadge("Job matched", "Product Lead · Remote", COLOR_BLUE);
    const badgeFit = makeBadge("Resume strength", "94% fit score", COLOR_GOLD);
    const badges = [badgeATS, badgeJob, badgeFit];
    badges.forEach((b) => scene.add(b));

    // ---------- ambient particle field ----------
    const PARTICLE_COUNT = 260;
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
      opacity: 0.55,
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

    // Force a re-measure shortly after mount in case the very first
    // measurement above happened before the parent's flex/grid layout settled.
    requestAnimationFrame(handleResize);
    const settleTimer = setTimeout(handleResize, 250);

    // ---------- animation loop ----------
    const startTime = performance.now();
    let frameId;

    function animate() {
      const t = (performance.now() - startTime) / 1000;

      // resume card: gentle float + rotation, drifts toward mouse
      resumeGroup.rotation.y = -0.15 + Math.sin(t * 0.35) * 0.25 + mouse.x * 0.25;
      resumeGroup.rotation.x = Math.sin(t * 0.4) * 0.05 + mouse.y * 0.08;
      resumeGroup.position.y = Math.sin(t * 0.6) * 0.12;

      // scan line sweep (loops top -> bottom)
      const scanT = (t * 0.35) % 1;
      const scanY = 1.75 - scanT * 3.5;
      scanLine.position.y = scanY;
      scanGlow.position.y = scanY;

      // orbiting badges on staggered elliptical paths
      const orbitR = 3.15;
      badges.forEach((b, i) => {
        const speed = 0.22 + i * 0.05;
        const offset = (i / badges.length) * Math.PI * 2;
        const angle = t * speed + offset;
        b.position.set(
          Math.cos(angle) * orbitR,
          Math.sin(angle * 0.8) * 1.3 + Math.sin(i * 2) * 0.3,
          Math.sin(angle) * 1.6 - 0.5
        );
        // fade badges that swing behind the card
        const depth = (b.position.z + 2.1) / 4.2;
        b.material.opacity = THREE.MathUtils.clamp(0.35 + depth * 0.75, 0.25, 1);
      });

      // particle drift
      particles.rotation.y = t * 0.02;
      particles.rotation.x = t * 0.01;

      // camera parallax
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (0.3 + mouse.y * 0.5 - camera.position.y) * 0.04;
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
      [cardGeo, edges, headerGeo, contactGeo, avatarGeo, dividerGeo, scanGeo, scanGlowGeo, particleGeo].forEach((g) => g.dispose());
      [cardMat, edgeMat, headerMat, contactMat, avatarMat, dividerMat, scanMat, scanGlowMat, particleMat].forEach((m) => m.dispose());
      badges.forEach((b) => {
        b.material.map.dispose();
        b.material.dispose();
      });
    };
  }, []);

return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 480,
        position: "relative",
      }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}