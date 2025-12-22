/**
 * Thoughtform Particle System
 * 
 * Simple canvas-based particle renderer with GRID=3 snapping.
 * Used for background ambient effects in mockups.
 * 
 * PRINCIPLES:
 * - GRID=3 pixel snapping for crisp rendering
 * - Dawn-colored particles (var(--dawn) = #ECE3D6)
 * - Gold accents for important elements
 * - Breathing motion (subtle oscillation)
 * - Depth via alpha (distant particles fade)
 */

const PARTICLE_CONFIG = {
  GRID: 3,
  COLORS: {
    dawn: { r: 236, g: 227, b: 214 },
    gold: { r: 202, g: 165, b: 84 },
  },
  BREATHING: {
    amplitude: 0.5,
    speed: 0.001,
  },
};

/**
 * Create a simple particle field (background stars)
 */
function createParticleField(canvas, options = {}) {
  const {
    count = 100,
    color = PARTICLE_CONFIG.COLORS.dawn,
    minAlpha = 0.05,
    maxAlpha = 0.3,
    breathe = true,
  } = options;

  const ctx = canvas.getContext('2d');
  const GRID = PARTICLE_CONFIG.GRID;
  let particles = [];
  let animationId = null;
  let time = 0;

  // Initialize particles
  function init() {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseAlpha: minAlpha + Math.random() * (maxAlpha - minAlpha),
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // Resize handler
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    init();
  }

  // Draw frame
  function draw() {
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    
    ctx.clearRect(0, 0, width, height);
    
    particles.forEach(particle => {
      // Apply breathing effect
      let alpha = particle.baseAlpha;
      if (breathe) {
        const breath = Math.sin(time * PARTICLE_CONFIG.BREATHING.speed + particle.phase);
        alpha *= 0.8 + breath * 0.2;
      }
      
      // Snap to grid
      const px = Math.floor(particle.x / GRID) * GRID;
      const py = Math.floor(particle.y / GRID) * GRID;
      
      // Draw pixel
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.fillRect(px, py, GRID - 1, GRID - 1);
    });
    
    time++;
    animationId = requestAnimationFrame(draw);
  }

  // Start
  function start() {
    resize();
    window.addEventListener('resize', resize);
    draw();
  }

  // Stop
  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    window.removeEventListener('resize', resize);
  }

  return { start, stop, resize };
}

/**
 * Create a domain cluster effect (radial particles)
 */
function createDomainCluster(canvas, options = {}) {
  const {
    centerX = 0,
    centerY = 0,
    radius = 100,
    count = 50,
    color = PARTICLE_CONFIG.COLORS.gold,
    rotationSpeed = 0.0005,
  } = options;

  const ctx = canvas.getContext('2d');
  const GRID = PARTICLE_CONFIG.GRID;
  let particles = [];
  let animationId = null;
  let angle = 0;

  // Initialize particles in radial distribution
  function init() {
    particles = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      particles.push({
        theta,
        r,
        alpha: 0.3 + (1 - r / radius) * 0.5,
        drift: (Math.random() - 0.5) * 0.001,
      });
    }
  }

  // Draw frame
  function draw() {
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    
    // Note: Don't clear - let background handle that
    
    particles.forEach(particle => {
      // Rotate around center
      particle.theta += particle.drift;
      
      const x = centerX + Math.cos(particle.theta + angle) * particle.r;
      const y = centerY + Math.sin(particle.theta + angle) * particle.r;
      
      // Snap to grid
      const px = Math.floor(x / GRID) * GRID;
      const py = Math.floor(y / GRID) * GRID;
      
      // Draw pixel
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.alpha})`;
      ctx.fillRect(px, py, GRID - 1, GRID - 1);
    });
    
    angle += rotationSpeed;
    animationId = requestAnimationFrame(draw);
  }

  function start() {
    init();
    draw();
  }

  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  return { start, stop };
}

// Export for use in mockups
if (typeof window !== 'undefined') {
  window.ParticleSystem = {
    createParticleField,
    createDomainCluster,
    CONFIG: PARTICLE_CONFIG,
  };
}



