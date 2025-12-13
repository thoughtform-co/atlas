// ═══════════════════════════════════════════════════════════════
// THOUGHTFORM LATENT ENGINE
// 3D particle system with split vanishing points
// Stars: center | Landmarks: right side (like looking out a window)
// ═══════════════════════════════════════════════════════════════

const GRID = 3;
const DAWN = '#ebe3d6';
const GOLD = '#caa554';
const ALERT = '#ff6b35';

// Semantic ASCII characters for close particles
const CHARS = ['λ', 'δ', 'θ', 'φ', 'ψ', 'Σ', 'π', '∇', '∞', '∂', '⟨', '⟩'];

// ───────────────────────────────────────────────────────────────
// CANVAS SETUP
// ───────────────────────────────────────────────────────────────
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
let width, height;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}
window.addEventListener('resize', resize);
resize();

// ───────────────────────────────────────────────────────────────
// PARTICLE SYSTEM
// ───────────────────────────────────────────────────────────────
const particles = [];

function createPoint(x, y, z, type, color) {
  return {
    x, y, z,
    type, // 'star' | 'geo'
    color,
    char: CHARS[Math.floor(Math.random() * CHARS.length)],
    size: 1 + Math.random()
  };
}

// ─── A. STARFIELD (Background, loops infinitely) ───
for (let i = 0; i < 600; i++) {
  particles.push(createPoint(
    (Math.random() - 0.5) * 6000,
    (Math.random() - 0.5) * 6000,
    Math.random() * 8000,
    'star',
    DAWN
  ));
}

// ─── B. LANDMARK 1: SEMANTIC TERRAIN (Z: 800-2000) ───
// Isometric topology mesh - appears during Hero section
for (let r = 0; r < 40; r++) {
  for (let c = 0; c < 40; c++) {
    const x = (c - 20) * 60;
    const z = 800 + r * 30;
    // Multi-wave terrain
    const y = 350 + 
      Math.sin(c * 0.18) * 120 + 
      Math.cos(r * 0.12) * 100 +
      Math.sin(c * 0.4 + r * 0.2) * 40;
    particles.push(createPoint(x, y, z, 'geo', GOLD));
  }
}

// ─── C. LANDMARK 2: POLAR ORBIT (Z: 2500-3500) ───
// Concentric rings + spiral - appears during Manifesto
for (let ring = 0; ring < 6; ring++) {
  const baseZ = 2800;
  const radius = 150 + ring * 80;
  const points = 40 + ring * 10;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = baseZ + Math.sin(angle * 3) * 100;
    particles.push(createPoint(x, y, z, 'geo', GOLD));
  }
}
// Spiral core
for (let i = 0; i < 200; i++) {
  const t = i / 200;
  const angle = t * Math.PI * 2 * 4;
  const radius = t * 350;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const z = 2600 + t * 600;
  particles.push(createPoint(x, y, z, 'geo', DAWN));
}

// ─── D. LANDMARK 3: TRAJECTORY TUNNEL (Z: 4000-5500) ───
// Receding perspective grid - appears during Services
for (let i = 0; i < 500; i++) {
  const z = 4200 + i * 2.5;
  const radius = 350 + Math.sin(i * 0.08) * 80;
  const angle = i * 0.15;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  particles.push(createPoint(x, y, z, 'geo', '#ffffff'));
}
// Grid lines
for (let layer = 0; layer < 12; layer++) {
  const z = 4200 + layer * 100;
  const size = 300 - layer * 15;
  // Rectangle edges
  for (let i = 0; i < 40; i++) {
    const t = (i / 40) * 2 - 1;
    particles.push(createPoint(t * size, -size, z, 'geo', GOLD));
    particles.push(createPoint(t * size, size, z, 'geo', GOLD));
    particles.push(createPoint(-size, t * size, z, 'geo', GOLD));
    particles.push(createPoint(size, t * size, z, 'geo', GOLD));
  }
}

// ─── E. LANDMARK 4: EVENT HORIZON (Z: 6000-7500) ───
// Gravitational sphere with infalling particles - Contact
for (let i = 0; i < 800; i++) {
  const r = 450;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = 6500 + r * Math.cos(phi) * 0.5;
  particles.push(createPoint(x, y, z, 'geo', ALERT));
}
// Core rings
for (let ring = 0; ring < 4; ring++) {
  const radius = 100 + ring * 60;
  const z = 6500;
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    particles.push(createPoint(x, y, z, 'geo', GOLD));
  }
}

// ───────────────────────────────────────────────────────────────
// RENDER ENGINE
// ───────────────────────────────────────────────────────────────
let scrollZ = 0;
const FOCAL = 400;
const MAX_DEPTH = 3500;

function render() {
  // Clear with slight trail for motion feel
  ctx.fillStyle = 'rgba(5, 5, 4, 0.85)';
  ctx.fillRect(0, 0, width, height);
  
  // SPLIT VANISHING POINTS
  // Stars: center (flying forward)
  // Geo: right side (looking out the cockpit window)
  const cx_stars = width * 0.5;
  const cx_geo = width * 0.72;  // Landmarks on the right
  const cy = height * 0.5;

  // Sort by depth for proper layering
  const sorted = particles.slice().sort((a, b) => {
    const zA = a.z - scrollZ;
    const zB = b.z - scrollZ;
    return zB - zA;
  });

  sorted.forEach(p => {
    let relZ = p.z - scrollZ;
    
    // Loop stars infinitely
    if (p.type === 'star') {
      while (relZ < 0) relZ += 8000;
      while (relZ > 8000) relZ -= 8000;
    }

    // Culling
    if (relZ <= 10 || relZ > MAX_DEPTH) return;

    const scale = FOCAL / relZ;
    const center = p.type === 'star' ? cx_stars : cx_geo;
    const x = center + p.x * scale;
    const y = cy + p.y * scale;

    // Out of bounds check
    if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;

    // Alpha based on depth (closer = more visible)
    const depthAlpha = Math.min(1, (1 - relZ / MAX_DEPTH) * 1.8);
    ctx.globalAlpha = depthAlpha;
    ctx.fillStyle = p.color;

    if (p.type === 'geo' && scale > 0.35) {
      // Draw ASCII character for close geo particles
      const fontSize = Math.max(8, Math.min(18, 12 * scale));
      ctx.font = `${fontSize}px "IBM Plex Sans", sans-serif`;
      ctx.fillText(p.char, x, y);
    } else if (p.type === 'geo') {
      // Small particles for distant geo
      const size = Math.max(1.5, 3 * scale);
      ctx.fillRect(x, y, size, size);
    } else {
      // Stars - small squares
      const size = Math.max(1, p.size * scale);
      ctx.globalAlpha = depthAlpha * 0.4;
      ctx.fillRect(x, y, size, size);
    }
  });

  ctx.globalAlpha = 1;
  requestAnimationFrame(render);
}

// ───────────────────────────────────────────────────────────────
// SCROLL INTEGRATION
// ───────────────────────────────────────────────────────────────
function setScrollProgress(progress) {
  // Map scroll progress (0-1) to Z position (0-7500)
  scrollZ = progress * 7500;
}

// ───────────────────────────────────────────────────────────────
// INIT
// ───────────────────────────────────────────────────────────────
function init() {
  render();
}

window.particleSystem = {
  init: init,
  setScrollProgress: setScrollProgress,
  // Legacy support
  setLandmarkState: () => {}
};
