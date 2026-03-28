/**
 * blocks3d.js — Isometric CSS/JS 3D block renderer.
 * No frameworks. Pure HTML/CSS/JS.
 *
 * Coordinate system:
 *   x = column (left→right in isometric view)
 *   y = row    (top→bottom depth in isometric view)
 *   z = height (bottom→top)
 *
 * Isometric projection (standard):
 *   screenX = (x - y) * TILE_W / 2
 *   screenY = (x + y) * TILE_H / 2 - z * TILE_Z
 *
 * Drag-to-rotate: we orbit the whole scene around the Y axis and tilt
 * by altering rotX/rotY CSS perspective transforms on the scene wrapper.
 */

const Blocks3D = (() => {

  /* ── Constants ─────────────────────────────────────────────────── */
  const CUBE_SIZE = 38;   // px — side of each cube face
  const COLORS = {
    top:   '#FFD93D',     // bright yellow — top face
    left:  '#FF6B6B',     // red-pink     — left face
    right: '#FF922B',     // orange       — right face
    topHL: '#FFF4CC',     // highlight top
    leftHL:'#FFB3B3',
    rightHL:'#FFD4A8',
  };

  /* ── State per instance ─────────────────────────────────────────── */
  function createRenderer(container) {
    let blocks = [];
    let rotY = -25;    // degrees: horizontal orbit
    let rotX = 20;     // degrees: tilt
    let autoSpinId = null;
    let isDragging = false;
    let dragStart = { x: 0, y: 0, rotY: 0, rotX: 0 };
    let highlightedLayer = null; // z-layer to highlight

    const scene = document.createElement('div');
    scene.className = 'block-scene';

    const world = document.createElement('div');
    world.className = 'block-world';
    scene.appendChild(world);

    container.innerHTML = '';
    container.appendChild(scene);

    /* ── Render ──────────────────────────────────────────────────── */
    function render() {
      world.innerHTML = '';

      // Sort blocks back-to-front for correct painter's order
      // In isometric view, sort by (x + y) ascending, then z ascending
      const sorted = [...blocks].sort((a, b) => {
        const da = a.x + a.y + a.z * 0.01;
        const db = b.x + b.y + b.z * 0.01;
        return da - db;
      });

      sorted.forEach(block => {
        const el = buildCube(block);
        world.appendChild(el);
      });

      applyTransform();
    }

    function buildCube({ x, y, z }) {
      const isHL = (highlightedLayer !== null && z === highlightedLayer);
      const wrapper = document.createElement('div');
      wrapper.className = 'iso-cube' + (isHL ? ' iso-cube--hl' : '');

      const S = CUBE_SIZE;
      // Isometric offsets
      const isoX = (x - y) * S;
      const isoY = (x + y) * (S * 0.5) - z * S;
      const W = S * 2;   // cube width in projection
      const H = S * 1.5; // cube height in projection

      wrapper.style.cssText = [
        `position:absolute`,
        `left:${isoX}px`,
        `top:${isoY}px`,
        `width:${W}px`,
        `height:${H + S}px`,
        `transform-style:preserve-3d`,
      ].join(';');

      // Top face
      const top = document.createElement('div');
      top.className = 'cube-face cube-top';
      top.style.cssText = buildTopStyle(S, isHL);
      wrapper.appendChild(top);

      // Left face
      const left = document.createElement('div');
      left.className = 'cube-face cube-left';
      left.style.cssText = buildLeftStyle(S, isHL);
      wrapper.appendChild(left);

      // Right face
      const right = document.createElement('div');
      right.className = 'cube-face cube-right';
      right.style.cssText = buildRightStyle(S, isHL);
      wrapper.appendChild(right);

      return wrapper;
    }

    function buildTopStyle(S, hl) {
      // Parallelogram: top face of isometric cube
      // Uses clip-path skewed diamond shape
      const c = hl ? COLORS.topHL : COLORS.top;
      return [
        `position:absolute`,
        `top:0`,
        `left:0`,
        `width:${S * 2}px`,
        `height:${S}px`,
        `background:${c}`,
        `clip-path:polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)`,
        `border:1.5px solid rgba(0,0,0,0.18)`,
        `box-sizing:border-box`,
      ].join(';');
    }

    function buildLeftStyle(S, hl) {
      const c = hl ? COLORS.leftHL : COLORS.left;
      return [
        `position:absolute`,
        `top:${S * 0.5}px`,
        `left:0`,
        `width:${S}px`,
        `height:${S}px`,
        `background:${c}`,
        `clip-path:polygon(50% 0%, 100% 0%, 50% 100%, 0% 100%)`,
        `border:1.5px solid rgba(0,0,0,0.18)`,
        `box-sizing:border-box`,
      ].join(';');
    }

    function buildRightStyle(S, hl) {
      const c = hl ? COLORS.rightHL : COLORS.right;
      return [
        `position:absolute`,
        `top:${S * 0.5}px`,
        `left:${S}px`,
        `width:${S}px`,
        `height:${S}px`,
        `background:${c}`,
        `clip-path:polygon(0% 0%, 50% 0%, 100% 100%, 50% 100%)`,
        `border:1.5px solid rgba(0,0,0,0.18)`,
        `box-sizing:border-box`,
      ].join(';');
    }

    function applyTransform() {
      // Apply rotation via CSS transform on the scene
      // We rotate the whole scene around Y (horizontal swivel) and X (tilt)
      scene.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    /* ── Drag rotation ───────────────────────────────────────────── */
    function onPointerDown(e) {
      isDragging = true;
      stopAutoSpin();
      const pt = getPoint(e);
      dragStart = { x: pt.x, y: pt.y, rotY, rotX };
      scene.style.cursor = 'grabbing';
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const pt = getPoint(e);
      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;
      rotY = dragStart.rotY + dx * 0.5;
      rotX = Math.max(-60, Math.min(60, dragStart.rotX - dy * 0.4));
      applyTransform();
    }

    function onPointerUp() {
      isDragging = false;
      scene.style.cursor = 'grab';
    }

    function getPoint(e) {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    scene.addEventListener('mousedown', onPointerDown);
    scene.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    /* ── Auto-spin ───────────────────────────────────────────────── */
    function startAutoSpin() {
      stopAutoSpin();
      autoSpinId = setInterval(() => {
        rotY += 0.8;
        applyTransform();
      }, 16);
    }

    function stopAutoSpin() {
      if (autoSpinId) { clearInterval(autoSpinId); autoSpinId = null; }
    }

    /* ── Reset view ──────────────────────────────────────────────── */
    function resetView() {
      rotY = -25;
      rotX = 20;
      applyTransform();
    }

    /* ── Highlight layers one by one ─────────────────────────────── */
    function highlightLayers(callback) {
      const maxZ = Math.max(...blocks.map(b => b.z), 0);
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

    /* ── Public interface ────────────────────────────────────────── */
    function setBlocks(newBlocks) {
      blocks = newBlocks;
      highlightedLayer = null;
      render();
    }

    function destroy() {
      stopAutoSpin();
      scene.removeEventListener('mousedown', onPointerDown);
      scene.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
    }

    return { setBlocks, render, resetView, startAutoSpin, stopAutoSpin, highlightLayers, destroy };
  }

  return { createRenderer, CUBE_SIZE, COLORS };
})();

if (typeof module !== 'undefined') module.exports = Blocks3D;
