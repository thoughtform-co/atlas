/**
 * CELESTIAL CONSTELLATION MOCKUP
 * 
 * Testing spherical galaxy visualization where:
 * - Domain clusters appear as 3D-looking spheres/galaxies
 * - Entity cards are positioned on the surface of spheres
 * - Connection lines radiate inward toward the sphere center
 * - Particles distributed spherically with depth-based opacity
 * - Spheres rotate gently so all cards pass by the viewer
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // Grid size for pixel snapping
  GRID: 3,
  
  // Sphere settings
  sphereRadius: 200,
  coreIntensity: 0.6,
  particleDensity: 200,
  connectionOpacity: 0.4,
  depthEffect: 0.5,
  
  // Rotation speed (radians per frame)
  rotationSpeed: 0.002,
  
  // Card settings
  cardWidth: 100,
  cardHeight: 140,
  cardOffset: 1.3, // How far outside the sphere (multiplier of radius)
  
  // Domain colors (gold for Starhaven Reaches)
  domains: {
    'Starhaven Reaches': { r: 202, g: 165, b: 84 }, // Gold
    'The Gradient Throne': { r: 91, g: 138, b: 122 },
  },
  
  // Mock entity positions (theta and phi are initial angles on sphere)
  entities: [
    // Starhaven Reaches entities - distributed around the sphere
    { id: 1, name: 'Eigensage', domain: 'Starhaven Reaches', theta: 0.3, phi: 0.0 },
    { id: 2, name: 'Voidweaver', domain: 'Starhaven Reaches', theta: 0.5, phi: 0.5 },
    { id: 3, name: 'Starkeeper', domain: 'Starhaven Reaches', theta: 0.7, phi: 1.0 },
    { id: 4, name: 'Nullseer', domain: 'Starhaven Reaches', theta: 0.4, phi: 1.5 },
    // The Gradient Throne entities
    { id: 5, name: 'Architect', domain: 'The Gradient Throne', theta: 0.4, phi: 0.2 },
    { id: 6, name: 'Wanderer', domain: 'The Gradient Throne', theta: 0.6, phi: 0.8 },
    { id: 7, name: 'Guardian', domain: 'The Gradient Throne', theta: 0.5, phi: 1.4 },
  ],
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  canvas: null,
  ctx: null,
  cardsContainer: null,
  width: 0,
  height: 0,
  
  // View transform
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  
  // Interaction
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  
  // Animation
  time: 0,
  animationId: null,
  
  // Rotation angle (accumulated)
  rotationAngle: 0,
  
  // Domain spheres
  spheres: [],
  
  // Stars
  stars: [],
  
  // Card elements
  cardElements: new Map(),
};

// ═══════════════════════════════════════════════════════════════
// SPHERE PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Create a 3D particle distributed on/within a sphere
 * Returns { x, y, z } in local sphere coordinates
 */
function createSphereParticle(radius, isCore = false) {
  if (isCore) {
    // Core particles - concentrated near center
    const r = Math.random() * radius * 0.3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      isCore: true,
    };
  } else {
    // Shell particles - distributed throughout sphere
    const r = Math.pow(Math.random(), 0.4) * radius; // Bias toward outer regions
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      isCore: false,
    };
  }
}

/**
 * Project 3D point to 2D screen coordinates
 * Uses simple orthographic projection with depth-based opacity
 */
function project3D(x, y, z, centerX, centerY, scale, depthEffect) {
  // Simple orthographic projection
  const screenX = centerX + x * scale;
  const screenY = centerY + y * scale;
  
  // Depth affects opacity (particles behind sphere are dimmer)
  const normalizedZ = z / CONFIG.sphereRadius;
  const depthAlpha = 0.3 + (normalizedZ + 1) * 0.35 * depthEffect;
  
  return { screenX, screenY, depthAlpha, z };
}

/**
 * Initialize domain spheres with particles
 */
function initializeSpheres() {
  state.spheres = [];
  
  // Clear existing card elements
  if (state.cardsContainer) {
    state.cardsContainer.innerHTML = '';
  }
  state.cardElements.clear();
  
  // Group entities by domain
  const domainGroups = new Map();
  CONFIG.entities.forEach(entity => {
    const domain = entity.domain;
    if (!domainGroups.has(domain)) {
      domainGroups.set(domain, []);
    }
    domainGroups.get(domain).push(entity);
  });
  
  // Create sphere for each domain
  let domainIndex = 0;
  domainGroups.forEach((entities, domain) => {
    // Position domains horizontally
    const centerX = (domainIndex - (domainGroups.size - 1) / 2) * 600;
    const centerY = 0;
    
    // Get domain color
    const color = CONFIG.domains[domain] || { r: 200, g: 200, b: 200 };
    
    // Create particles
    const particles = [];
    const particleCount = CONFIG.particleDensity;
    
    // Core particles (brighter, near center)
    for (let i = 0; i < particleCount * 0.2; i++) {
      const p = createSphereParticle(CONFIG.sphereRadius, true);
      particles.push({
        ...p,
        alpha: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        size: CONFIG.GRID,
      });
    }
    
    // Shell particles
    for (let i = 0; i < particleCount * 0.8; i++) {
      const p = createSphereParticle(CONFIG.sphereRadius, false);
      particles.push({
        ...p,
        alpha: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        size: CONFIG.GRID,
      });
    }
    
    // Store initial angles for entities (will be rotated over time)
    const entityData = entities.map(entity => ({
      ...entity,
      baseTheta: entity.theta * Math.PI, // Store base angle
      basePhi: entity.phi * Math.PI * 2,
    }));
    
    state.spheres.push({
      domain,
      centerX,
      centerY,
      color,
      particles,
      entities: entityData,
    });
    
    // Create card elements for each entity
    entityData.forEach(entity => {
      createCardElement(entity, color);
    });
    
    domainIndex++;
  });
}

/**
 * Create a card DOM element for an entity with front, back, and edge faces
 */
function createCardElement(entity, color) {
  if (!state.cardsContainer) return;
  
  const card = document.createElement('div');
  card.className = 'entity-card';
  card.id = `card-${entity.id}`;
  
  // Set domain color as CSS variables for dynamic theming
  card.style.setProperty('--glow-color', `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
  card.style.setProperty('--glow-color-dim', `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`);
  card.style.setProperty('--glow-color-bright', `rgba(${color.r}, ${color.g}, ${color.b}, 1)`);
  card.style.setProperty('--glow-color-subtle', `rgba(${color.r}, ${color.g}, ${color.b}, 0.08)`);
  
  card.innerHTML = `
    <div class="card-front">
      <div class="image">◇</div>
      <div class="name">${entity.name}</div>
    </div>
    <div class="card-edge"></div>
    <div class="card-back"></div>
  `;
  
  state.cardsContainer.appendChild(card);
  state.cardElements.set(entity.id, card);
}

/**
 * Calculate entity's 3D position on sphere with rotation
 */
function getEntityPosition(entity, rotationAngle) {
  const theta = entity.baseTheta;
  const phi = entity.basePhi + rotationAngle; // Rotate around Y axis
  const r = CONFIG.sphereRadius * CONFIG.cardOffset;
  
  return {
    x: r * Math.sin(theta) * Math.cos(phi),
    y: r * Math.cos(theta), // Y is vertical
    z: r * Math.sin(theta) * Math.sin(phi),
  };
}

/**
 * Update card positions and 3D rotation based on sphere rotation
 */
function updateCards() {
  state.spheres.forEach(sphere => {
    const screenCenter = worldToScreen(sphere.centerX, sphere.centerY);
    
    sphere.entities.forEach(entity => {
      const card = state.cardElements.get(entity.id);
      if (!card) return;
      
      // Get rotated position
      const pos = getEntityPosition(entity, state.rotationAngle);
      
      // Calculate the angle the card is facing (in radians)
      // This is the angle from sphere center to card position, projected onto XZ plane
      const facingAngle = Math.atan2(pos.z, pos.x);
      
      // Convert to degrees for CSS transform
      // Cards face outward from sphere, so rotate by the facing angle
      // When z > 0 (behind), card back should show
      // When z < 0 (in front), card front should show
      const rotationY = -facingAngle * (180 / Math.PI) + 90;
      
      // Add slight X rotation based on vertical position (theta)
      const verticalRatio = pos.y / (CONFIG.sphereRadius * CONFIG.cardOffset);
      const rotationX = verticalRatio * 15; // Subtle tilt
      
      // Project to screen
      const projected = project3D(
        pos.x, pos.y, pos.z,
        screenCenter.x, screenCenter.y,
        state.scale,
        CONFIG.depthEffect
      );
      
      // Position card centered on the projected point
      const cardX = projected.screenX - CONFIG.cardWidth / 2;
      const cardY = projected.screenY - CONFIG.cardHeight / 2;
      
      card.style.left = `${cardX}px`;
      card.style.top = `${cardY}px`;
      card.style.width = `${CONFIG.cardWidth}px`;
      
      // Z-index based on depth (front cards on top)
      card.style.zIndex = Math.floor(50 + pos.z / 10);
      
      // Scale based on depth for perspective effect
      const depthScale = 0.7 + projected.depthAlpha * 0.5;
      
      // Apply 3D transform: position, rotation, and scale
      card.style.transform = `
        perspective(800px)
        rotateY(${rotationY}deg)
        rotateX(${rotationX}deg)
        scale(${depthScale})
      `;
      
      // Adjust overall opacity slightly (cards at back are a bit dimmer)
      card.style.opacity = 0.6 + projected.depthAlpha * 0.4;
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// STARS
// ═══════════════════════════════════════════════════════════════

function spawnStar() {
  if (state.stars.length < 60 && Math.random() < 0.08) {
    state.stars.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      size: 1 + Math.random() * 2,
      life: 0,
      maxLife: 30 + Math.random() * 60,
      type: Math.random() < 0.3 ? 'glitch' : 'star',
    });
  }
}

function updateStars() {
  spawnStar();
  state.stars = state.stars.filter(star => {
    star.life++;
    return star.life < star.maxLife;
  });
}

function drawStars() {
  const { ctx } = state;
  
  state.stars.forEach(star => {
    const progress = star.life / star.maxLife;
    const alpha = Math.sin(progress * Math.PI) * 0.4;
    
    if (star.type === 'glitch') {
      ctx.fillStyle = `rgba(236, 227, 214, ${alpha * 0.3})`;
      const glitchWidth = 20 + Math.random() * 40;
      ctx.fillRect(star.x - glitchWidth / 2, star.y, glitchWidth, 1);
    } else {
      ctx.fillStyle = `rgba(236, 227, 214, ${alpha})`;
      const px = Math.floor(star.x / 2) * 2;
      const py = Math.floor(star.y / 2) * 2;
      ctx.fillRect(px, py, star.size, star.size);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════

function worldToScreen(worldX, worldY) {
  return {
    x: state.width / 2 + state.offsetX + worldX * state.scale,
    y: state.height / 2 + state.offsetY + worldY * state.scale,
  };
}

function drawSpheres() {
  const { ctx, time, rotationAngle } = state;
  
  state.spheres.forEach(sphere => {
    const { color, particles, centerX, centerY, entities, domain } = sphere;
    const screenCenter = worldToScreen(centerX, centerY);
    const screenRadius = CONFIG.sphereRadius * state.scale;
    
    // Rotate particles with the sphere
    const rotatedParticles = particles.map(p => {
      // Rotate around Y axis
      const cosR = Math.cos(rotationAngle);
      const sinR = Math.sin(rotationAngle);
      return {
        ...p,
        x: p.x * cosR - p.z * sinR,
        z: p.x * sinR + p.z * cosR,
      };
    });
    
    // Sort particles by Z for proper depth ordering
    const sortedParticles = [...rotatedParticles].sort((a, b) => a.z - b.z);
    
    // Draw particles
    sortedParticles.forEach(p => {
      const projected = project3D(
        p.x, p.y, p.z,
        screenCenter.x, screenCenter.y,
        state.scale,
        CONFIG.depthEffect
      );
      
      // Skip if off screen
      if (projected.screenX < -50 || projected.screenX > state.width + 50 ||
          projected.screenY < -50 || projected.screenY > state.height + 50) {
        return;
      }
      
      // Breathing animation
      const breathe = Math.sin(time * 0.02 + p.phase) * 0.3 + 0.7;
      let alpha = p.alpha * breathe * projected.depthAlpha;
      
      // Core particles are brighter
      if (p.isCore) {
        alpha *= 1.5;
      }
      
      // Pixel-snapped rendering
      const px = Math.floor(projected.screenX / CONFIG.GRID) * CONFIG.GRID;
      const py = Math.floor(projected.screenY / CONFIG.GRID) * CONFIG.GRID;
      
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.fillRect(px, py, CONFIG.GRID - 1, CONFIG.GRID - 1);
    });
    
    // Draw sphere core glow
    const gradient = ctx.createRadialGradient(
      screenCenter.x, screenCenter.y, 0,
      screenCenter.x, screenCenter.y, screenRadius * 0.5
    );
    const coreAlpha = CONFIG.coreIntensity * 0.15;
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha})`);
    gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha * 0.5})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenCenter.x, screenCenter.y, screenRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw outer glow
    const outerGradient = ctx.createRadialGradient(
      screenCenter.x, screenCenter.y, screenRadius * 0.3,
      screenCenter.x, screenCenter.y, screenRadius * 1.3
    );
    outerGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.05)`);
    outerGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.02)`);
    outerGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(screenCenter.x, screenCenter.y, screenRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw connection lines from entities to center (with rotation)
    entities.forEach(entity => {
      // Get rotated entity position
      const pos = getEntityPosition(entity, rotationAngle);
      
      const projected = project3D(
        pos.x, pos.y, pos.z,
        screenCenter.x, screenCenter.y,
        state.scale,
        CONFIG.depthEffect
      );
      
      // Line from center to entity with gradient
      const lineGradient = ctx.createLinearGradient(
        screenCenter.x, screenCenter.y,
        projected.screenX, projected.screenY
      );
      
      const lineAlpha = CONFIG.connectionOpacity * projected.depthAlpha;
      lineGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha * 0.8})`);
      lineGradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha * 0.4})`);
      lineGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha * 0.1})`);
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenCenter.x, screenCenter.y);
      ctx.lineTo(projected.screenX, projected.screenY);
      ctx.stroke();
      
      // Draw connection point where line meets card
      const nodeAlpha = lineAlpha * 1.5;
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${nodeAlpha})`;
      ctx.beginPath();
      ctx.arc(projected.screenX, projected.screenY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw small glow at connection point
      const nodeGlow = ctx.createRadialGradient(
        projected.screenX, projected.screenY, 0,
        projected.screenX, projected.screenY, 12
      );
      nodeGlow.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${nodeAlpha * 0.5})`);
      nodeGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = nodeGlow;
      ctx.beginPath();
      ctx.arc(projected.screenX, projected.screenY, 12, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function draw() {
  const { ctx, width, height } = state;
  
  // Clear with void color
  ctx.fillStyle = '#050403';
  ctx.fillRect(0, 0, width, height);
  
  // Draw stars
  updateStars();
  drawStars();
  
  // Draw spheres
  drawSpheres();
  
  // Update card positions
  updateCards();
  
  // Increment time and rotation
  state.time++;
  state.rotationAngle += CONFIG.rotationSpeed;
  
  // Continue animation
  state.animationId = requestAnimationFrame(draw);
}

// ═══════════════════════════════════════════════════════════════
// INTERACTION
// ═══════════════════════════════════════════════════════════════

function handleMouseDown(e) {
  state.isDragging = true;
  state.lastMouseX = e.clientX;
  state.lastMouseY = e.clientY;
}

function handleMouseMove(e) {
  if (!state.isDragging) return;
  
  const dx = e.clientX - state.lastMouseX;
  const dy = e.clientY - state.lastMouseY;
  
  state.offsetX += dx;
  state.offsetY += dy;
  
  state.lastMouseX = e.clientX;
  state.lastMouseY = e.clientY;
  
  // Update coordinates display
  updateCoordinates();
}

function handleMouseUp() {
  state.isDragging = false;
}

function handleWheel(e) {
  e.preventDefault();
  
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.3, Math.min(3, state.scale * zoomFactor));
  
  // Zoom toward mouse position
  const rect = state.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const worldX = (mouseX - state.width / 2 - state.offsetX) / state.scale;
  const worldY = (mouseY - state.height / 2 - state.offsetY) / state.scale;
  
  state.scale = newScale;
  
  state.offsetX = mouseX - state.width / 2 - worldX * state.scale;
  state.offsetY = mouseY - state.height / 2 - worldY * state.scale;
  
  updateCoordinates();
}

function updateCoordinates() {
  const normX = (state.offsetX / state.width).toFixed(2);
  const normY = (state.offsetY / state.height).toFixed(2);
  const normZ = ((state.scale - 0.3) / 2.7).toFixed(2);
  
  document.getElementById('coord-x').textContent = normX;
  document.getElementById('coord-y').textContent = normY;
  document.getElementById('coord-z').textContent = normZ;
}

// ═══════════════════════════════════════════════════════════════
// CONTROLS
// ═══════════════════════════════════════════════════════════════

function setupControls() {
  // Sphere radius
  const radiusSlider = document.getElementById('sphere-radius');
  const radiusValue = document.getElementById('sphere-radius-value');
  radiusSlider.addEventListener('input', (e) => {
    CONFIG.sphereRadius = parseInt(e.target.value);
    radiusValue.textContent = e.target.value;
    initializeSpheres();
  });
  
  // Core intensity
  const coreSlider = document.getElementById('core-intensity');
  const coreValue = document.getElementById('core-intensity-value');
  coreSlider.addEventListener('input', (e) => {
    CONFIG.coreIntensity = parseInt(e.target.value) / 100;
    coreValue.textContent = e.target.value;
  });
  
  // Particle density
  const densitySlider = document.getElementById('particle-density');
  const densityValue = document.getElementById('particle-density-value');
  densitySlider.addEventListener('input', (e) => {
    CONFIG.particleDensity = parseInt(e.target.value);
    densityValue.textContent = e.target.value;
    initializeSpheres();
  });
  
  // Connection opacity
  const opacitySlider = document.getElementById('connection-opacity');
  const opacityValue = document.getElementById('connection-opacity-value');
  opacitySlider.addEventListener('input', (e) => {
    CONFIG.connectionOpacity = parseInt(e.target.value) / 100;
    opacityValue.textContent = e.target.value;
  });
  
  // Depth effect
  const depthSlider = document.getElementById('depth-effect');
  const depthValue = document.getElementById('depth-effect-value');
  depthSlider.addEventListener('input', (e) => {
    CONFIG.depthEffect = parseInt(e.target.value) / 100;
    depthValue.textContent = e.target.value;
  });
  
  // Rotation speed
  const rotationSlider = document.getElementById('rotation-speed');
  const rotationValue = document.getElementById('rotation-speed-value');
  rotationSlider.addEventListener('input', (e) => {
    CONFIG.rotationSpeed = parseInt(e.target.value) / 10000; // Very slow rotation
    rotationValue.textContent = e.target.value;
  });
  
  // Reset view
  document.getElementById('reset-view').addEventListener('click', () => {
    state.offsetX = 0;
    state.offsetY = 0;
    state.scale = 1;
    state.rotationAngle = 0;
    updateCoordinates();
  });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.canvas.width = state.width;
  state.canvas.height = state.height;
}

function init() {
  // Get canvas and cards container
  state.canvas = document.getElementById('celestial-canvas');
  state.ctx = state.canvas.getContext('2d');
  state.cardsContainer = document.getElementById('cards-container');
  
  // Set up sizing
  resize();
  window.addEventListener('resize', resize);
  
  // Set up interaction
  state.canvas.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  state.canvas.addEventListener('wheel', handleWheel, { passive: false });
  
  // Set up controls
  setupControls();
  
  // Initialize spheres
  initializeSpheres();
  
  // Start animation
  draw();
  
  console.log('Celestial Constellation Mockup initialized');
  console.log('Domains:', Object.keys(CONFIG.domains));
  console.log('Total entities:', CONFIG.entities.length);
  console.log('Rotation speed:', CONFIG.rotationSpeed, 'rad/frame');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
