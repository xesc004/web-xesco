/* ============================================================
   Sphere3D — Three.js interactive network sphere
   Requires Three.js to be loaded before this script.
   Mount point: <div id="sphere-container"></div>
   ============================================================ */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.warn('sphere3d.js: Three.js is not loaded.');
    return;
  }

  const container = document.getElementById('sphere-container');
  if (!container) return;

  /* ── Renderer ───────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparent background
  container.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3.5;

  const group = new THREE.Group();
  scene.add(group);

  /* ── Fibonacci sphere point distribution ────────────────── */
  const N   = 160;          // number of nodes
  const R   = 1.2;          // sphere radius
  const PHI = Math.PI * (3 - Math.sqrt(5)); // golden angle

  const origPos = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const y     = 1 - (i / (N - 1)) * 2;
    const r     = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = PHI * i;
    origPos[i * 3]     = Math.cos(theta) * r * R;
    origPos[i * 3 + 1] = y * R;
    origPos[i * 3 + 2] = Math.sin(theta) * r * R;
  }

  /* ── Lines: connect nearby nodes (static geometry) ─────── */
  const CONN_D2  = 0.54 * 0.54; // squared connection distance
  const lineVerts = [];

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = origPos[i * 3]     - origPos[j * 3];
      const dy = origPos[i * 3 + 1] - origPos[j * 3 + 1];
      const dz = origPos[i * 3 + 2] - origPos[j * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < CONN_D2) {
        lineVerts.push(
          origPos[i * 3], origPos[i * 3 + 1], origPos[i * 3 + 2],
          origPos[j * 3], origPos[j * 3 + 1], origPos[j * 3 + 2]
        );
      }
    }
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
  group.add(new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ color: 0x0071e3, transparent: true, opacity: 0.18 })
  ));

  /* ── Points: dynamic positions + vertex colors for glow ── */
  const ptPos = new Float32Array(origPos); // mutable copy
  const ptCol = new Float32Array(N * 3);

  // Base color #0071e3 → r=0, g=0.443, b=0.890
  const BASE = { r: 0 / 255, g: 113 / 255, b: 227 / 255 };
  // Glow color #34aadc → r=0.204, g=0.667, b=0.863
  const GLOW = { r: 52 / 255,  g: 170 / 255, b: 220 / 255 };

  for (let i = 0; i < N; i++) {
    ptCol[i * 3]     = BASE.r;
    ptCol[i * 3 + 1] = BASE.g;
    ptCol[i * 3 + 2] = BASE.b;
  }

  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  ptGeo.setAttribute('color',    new THREE.BufferAttribute(ptCol, 3));

  group.add(new THREE.Points(
    ptGeo,
    new THREE.PointsMaterial({
      size: 0.048,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
    })
  ));

  /* ── Resize handler ─────────────────────────────────────── */
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Interaction state ──────────────────────────────────── */
  let autoY      = 0;
  let isDragging = false;
  let rotX = 0, rotY = 0;
  let velX = 0, velY = 0;
  let prevX = 0, prevY = 0;
  const mouse = new THREE.Vector2(-999, -999);
  let hovering = false;

  const el = renderer.domElement;
  el.style.cursor = 'grab';

  // Mouse drag
  el.addEventListener('mousedown', e => {
    isDragging = true;
    velX = velY = 0;
    prevX = e.clientX;
    prevY = e.clientY;
    el.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
    el.style.cursor = 'grab';
  });

  // Hover detection
  container.addEventListener('mouseenter', () => { hovering = true; });
  container.addEventListener('mouseleave', () => {
    hovering = false;
    mouse.set(-999, -999);
  });

  window.addEventListener('mousemove', e => {
    if (isDragging) {
      velX = (e.clientX - prevX) * 0.007;
      velY = (e.clientY - prevY) * 0.007;
      rotY += velX;
      rotX += velY;
      prevX = e.clientX;
      prevY = e.clientY;
    }
    if (hovering) {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    }
  });

  // Touch drag
  el.addEventListener('touchstart', e => {
    isDragging = true;
    velX = velY = 0;
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
  }, { passive: true });

  el.addEventListener('touchend', () => { isDragging = false; }, { passive: true });

  el.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - prevX;
    const dy = e.touches[0].clientY - prevY;
    velX = dx * 0.007;
    velY = dy * 0.007;
    rotY += velX;
    rotX += velY;
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
  }, { passive: true });

  /* ── Animation loop ─────────────────────────────────────── */
  const HOVER_RADIUS = 0.30; // NDC units — magnetic detection radius
  const PUSH_DIST    = 0.16; // how far nodes push outward on hover

  // Reusable vectors to avoid per-frame allocations
  const _wp = new THREE.Vector3();
  const _sp = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);

    // Auto-rotate + inertia when not dragging
    if (!isDragging) {
      velX *= 0.92;
      velY *= 0.92;
      rotX += velY;
      rotY += velX;
      autoY += 0.004;
    }

    group.rotation.x = rotX;
    group.rotation.y = rotY + autoY;

    // Per-node magnetic hover + color glow
    const pos = ptGeo.attributes.position;
    const col = ptGeo.attributes.color;
    const euler = group.rotation;

    for (let i = 0; i < N; i++) {
      const ox = origPos[i * 3];
      const oy = origPos[i * 3 + 1];
      const oz = origPos[i * 3 + 2];

      // Compute hover influence (t: 0..1)
      let t = 0;
      if (hovering) {
        _wp.set(ox, oy, oz).applyEuler(euler);
        _sp.copy(_wp).project(camera);
        const dist = Math.hypot(_sp.x - mouse.x, _sp.y - mouse.y);
        if (dist < HOVER_RADIUS) t = 1 - dist / HOVER_RADIUS;
      }

      // Push node outward along its radial direction
      const len = Math.hypot(ox, oy, oz) || 1;
      const tx = ox + (ox / len) * t * PUSH_DIST;
      const ty = oy + (oy / len) * t * PUSH_DIST;
      const tz = oz + (oz / len) * t * PUSH_DIST;

      // Smooth lerp toward target
      const spd = t > 0 ? 0.14 : 0.07;
      pos.setXYZ(i,
        pos.getX(i) + (tx - pos.getX(i)) * spd,
        pos.getY(i) + (ty - pos.getY(i)) * spd,
        pos.getZ(i) + (tz - pos.getZ(i)) * spd
      );

      // Interpolate color toward glow
      col.setXYZ(i,
        BASE.r + (GLOW.r - BASE.r) * t,
        BASE.g + (GLOW.g - BASE.g) * t,
        BASE.b + (GLOW.b - BASE.b) * t
      );
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    renderer.dispose();
    lineGeo.dispose();
    ptGeo.dispose();
  });
})();
