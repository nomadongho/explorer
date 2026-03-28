/**
 * blocks3d.js — Proper CSS 3D block renderer using transform-style: preserve-3d.
 * No frameworks. Pure HTML/CSS/JS.
 *
 * Coordinate system (grid positions, integers):
 *   x = column  (left → right)
 *   y = row     (front → back, increases depth into scene)
 *   z = height  (bottom → top)
 *
 * 3D mapping to CSS transforms on each cube wrapper:
 *   translateX( x * S )
 *   translateY( -z * S )   (CSS Y axis is inverted)
 *   translateZ( -y * S )   (CSS Z axis points toward viewer)
 *
 * Each cube wrapper has transform-style: preserve-3d and contains
 * six face divs, each placed with rotateX/Y + translateZ(S/2).
 * The whole scene is rotated with rotateX / rotateY for orbiting.
 */

const Blocks3D = (() => {

  /* ── Visual constants ───────────────────────────────────────────── */
  const BASE_SIZE = 44;   // px per cube side at scale 1 (auto-scaled down for large structures)

  // Base hex colors for each face
  const C_TOP    = '#FFD93D';  // bright yellow  — top    (lightest)
  const C_FRONT  = '#FF6B6B';  // coral red      — front  (medium)
  const C_RIGHT  = '#FF922B';  // orange         — right  (medium-dark)
  const C_BACK   = '#d94f4f';  // dark coral     — back
  const C_LEFT   = '#d97020';  // dark orange    — left
  const C_BOTTOM = '#ccaa22';  // dark yellow    — bottom (darkest)

  // Highlight colors (when a layer is revealed)
  const C_TOP_HL    = '#FFF4CC';
  const C_FRONT_HL  = '#FFB3B3';
  const C_RIGHT_HL  = '#FFD4A8';

  /* ── Renderer factory ───────────────────────────────────────────── */
  function createRenderer(container) {
    let blocks = [];
    let rotX = 22;      // current tilt (degrees)
    let rotY = -30;     // current swivel (degrees)
    let isDragging   = false;
    let dragStart    = { x: 0, y: 0, rotX: 0, rotY: 0 };
    let autoRafId    = null;
    let autoLastTs   = null;
    let highlightedLayer = null;   // z value of currently highlighted layer

    /* ── Build DOM structure ──────────────────────────────────────── */
    // scene: fills container, gets the rotation transform, has perspective via container
    const scene = document.createElement('div');
    scene.className = 'block-scene';
    scene.setAttribute('aria-hidden', 'true');

    // world: zero-size anchor at scene center; cubes positioned around it
    const world = document.createElement('div');
    world.className = 'block-world';
    scene.appendChild(world);

    container.innerHTML = '';
    container.appendChild(scene);

    /* ── Render ───────────────────────────────────────────────────── */
    function render() {
      world.innerHTML = '';
      if (!blocks.length) return;

      const xs = blocks.map(b => b.x);
      const ys = blocks.map(b => b.y);
      const zs = blocks.map(b => b.z);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const minZ = Math.min(...zs), maxZ = Math.max(...zs);

      // Auto-scale cube size so the whole structure fits comfortably
      const span = Math.max(maxX - minX + 1, maxY - minY + 1, maxZ - minZ + 1);
      const S = Math.max(22, Math.min(BASE_SIZE, Math.floor(170 / Math.max(span, 1))));

      // Center offsets: shift so the structure's center aligns with world origin
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = (minZ + maxZ) / 2;

      blocks.forEach(b => {
        const hl = highlightedLayer !== null && b.z === highlightedLayer;
        world.appendChild(buildCube(b.x, b.y, b.z, cx, cy, cz, S, hl));
      });

      applyRotation();
    }

    /* ── Build one CSS 3D cube ────────────────────────────────────── */
    function buildCube(gx, gy, gz, cx, cy, cz, S, isHL) {
      // Translate in 3D so the cube center is offset from the world origin
      const tx = (gx - cx) * S - S / 2;
      const ty = -(gz - cz) * S - S / 2;
      const tz = -(gy - cy) * S;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = [
        'position:absolute',
        'transform-style:preserve-3d',
        `width:${S}px`,
        `height:${S}px`,
        `transform:translate3d(${tx}px,${ty}px,${tz}px)`,
      ].join(';');

      // Pick face colors
      const tc = isHL ? C_TOP_HL   : C_TOP;
      const fc = isHL ? C_FRONT_HL : C_FRONT;
      const rc = isHL ? C_RIGHT_HL : C_RIGHT;

      // Six faces: [rotateX, rotateY, color]
      const faces = [
        [  0,   0, fc ],  // front
        [  0, 180, C_BACK   ],  // back
        [  0,  90, rc ],  // right
        [  0, -90, C_LEFT   ],  // left
        [ 90,   0, tc ],  // top
        [-90,   0, C_BOTTOM ],  // bottom
      ];

      faces.forEach(([rx, ry, color]) => {
        const face = document.createElement('div');
        face.style.cssText = [
          'position:absolute',
          `width:${S}px`,
          `height:${S}px`,
          `background:${color}`,
          'border:1.5px solid rgba(0,0,0,0.18)',
          'box-sizing:border-box',
          'backface-visibility:hidden',
          '-webkit-backface-visibility:hidden',
          `transform:rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${S / 2}px)`,
        ].join(';');
        wrapper.appendChild(face);
      });

      return wrapper;
    }

    /* ── Apply rotation transform to scene ───────────────────────── */
    function applyRotation() {
      scene.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    /* ── Pointer / touch drag ─────────────────────────────────────── */
    function getPoint(e) {
      return (e.touches && e.touches[0])
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };
    }

    function onPointerDown(e) {
      isDragging = true;
      stopAutoSpin();
      const pt = getPoint(e);
      dragStart = { x: pt.x, y: pt.y, rotX, rotY };
      if (e.cancelable) e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const pt = getPoint(e);
      rotY = dragStart.rotY + (pt.x - dragStart.x) * 0.5;
      rotX = Math.max(-70, Math.min(70, dragStart.rotX - (pt.y - dragStart.y) * 0.4));
      applyRotation();
      if (e.cancelable) e.preventDefault();
    }

    function onPointerUp() { isDragging = false; }

    scene.addEventListener('mousedown',  onPointerDown);
    scene.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('mousemove',  onPointerMove);
    window.addEventListener('touchmove',  onPointerMove, { passive: false });
    window.addEventListener('mouseup',   onPointerUp);
    window.addEventListener('touchend',  onPointerUp);

    /* ── Auto-spin using requestAnimationFrame ────────────────────── */
    function startAutoSpin() {
      stopAutoSpin();
      autoLastTs = null;
      function frame(ts) {
        if (autoLastTs !== null) rotY += (ts - autoLastTs) * 0.04;
        autoLastTs = ts;
        applyRotation();
        autoRafId = requestAnimationFrame(frame);
      }
      autoRafId = requestAnimationFrame(frame);
    }

    function stopAutoSpin() {
      if (autoRafId !== null) { cancelAnimationFrame(autoRafId); autoRafId = null; }
      autoLastTs = null;
    }

    /* ── Reset view ───────────────────────────────────────────────── */
    function resetView() {
      rotX = 22;
      rotY = -30;
      applyRotation();
    }

    /* ── Layer highlight reveal (after answering) ─────────────────── */
    function highlightLayers(callback) {
      const maxZ = blocks.length ? Math.max(...blocks.map(b => b.z)) : 0;
      let z = 0;
      function step() {
        highlightedLayer = z;
        render();
        if (z <= maxZ) {
          z++;
          setTimeout(step, 600);
        } else {
          highlightedLayer = null;
          render();
          if (callback) callback();
        }
      }
      step();
    }

    /* ── Public interface ─────────────────────────────────────────── */
    function setBlocks(newBlocks) {
      blocks = newBlocks;
      highlightedLayer = null;
      render();
    }

    function destroy() {
      stopAutoSpin();
      scene.removeEventListener('mousedown',  onPointerDown);
      scene.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('mousemove',  onPointerMove);
      window.removeEventListener('touchmove',  onPointerMove);
      window.removeEventListener('mouseup',   onPointerUp);
      window.removeEventListener('touchend',  onPointerUp);
    }

    return { setBlocks, render, resetView, startAutoSpin, stopAutoSpin, highlightLayers, destroy };
  }

  return { createRenderer };
})();

if (typeof module !== 'undefined') module.exports = Blocks3D;
