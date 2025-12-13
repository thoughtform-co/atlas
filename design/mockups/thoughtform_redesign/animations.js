// ═══════════════════════════════════════════════════════════════
// THOUGHTFORM NAVIGATION ANIMATIONS
// HUD data binding + scroll-driven landmarks + radar ticks
// ═══════════════════════════════════════════════════════════════

// Smooth scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
gsap.registerPlugin(ScrollTrigger);

// ───────────────────────────────────────────────────────────────
// SECTION DATA MAPPING
// ───────────────────────────────────────────────────────────────
const sectionData = {
  hero: { 
    sector: 'Origin', 
    depth: 0.0,
    vector: 'Entry',
    signal: 61,
    landmark: 1
  },
  manifesto: { 
    sector: 'Manifesto', 
    depth: 2.4,
    vector: 'Creative',
    signal: 74,
    landmark: 2
  },
  services: { 
    sector: 'Services', 
    depth: 5.8,
    vector: 'Strategic',
    signal: 88,
    landmark: 3
  },
  contact: { 
    sector: 'Contact', 
    depth: 9.2,
    vector: 'Destination',
    signal: 95,
    landmark: 4
  }
};

// ───────────────────────────────────────────────────────────────
// GENERATE RADAR TICKS
// ───────────────────────────────────────────────────────────────
function generateTicks() {
  const leftTicks = document.getElementById('leftTicks');
  const rightTicks = document.getElementById('rightTicks');
  
  if (!leftTicks || !rightTicks) return;
  
  const tickCount = 20;
  const labels = ['0', '', '', '', '', '2', '', '', '', '', '5', '', '', '', '', '7', '', '', '', '10'];
  
  // Left ticks
  leftTicks.innerHTML = '';
  for (let i = 0; i <= tickCount; i++) {
    const tick = document.createElement('div');
    tick.className = i % 5 === 0 ? 'tick tick-major' : 'tick tick-minor';
    
    if (labels[i]) {
      const label = document.createElement('span');
      label.className = 'tick-label';
      label.textContent = labels[i];
      label.style.top = `${(i / tickCount) * 100}%`;
      leftTicks.appendChild(label);
    }
    
    leftTicks.appendChild(tick);
  }
  
  // Right ticks (simpler)
  rightTicks.innerHTML = '';
  for (let i = 0; i <= tickCount; i++) {
    const tick = document.createElement('div');
    tick.className = i % 5 === 0 ? 'tick tick-major' : 'tick tick-minor';
    rightTicks.appendChild(tick);
  }
}

// ───────────────────────────────────────────────────────────────
// HUD ELEMENTS
// ───────────────────────────────────────────────────────────────
const hud = {
  sector: document.getElementById('hudSector'),
  depth: document.getElementById('hudDepth'),
  vector: document.getElementById('hudVector'),
  signal: document.getElementById('hudSignal'),
  delta: document.getElementById('hudDelta'),
  theta: document.getElementById('hudTheta'),
  rho: document.getElementById('hudRho'),
  zeta: document.getElementById('hudZeta'),
  depthIndicator: document.getElementById('depthIndicator'),
  instruction: document.getElementById('hudInstruction')
};

const navLinks = document.querySelectorAll('.nav-link');
const sectionMarkers = document.querySelectorAll('.section-marker');

function updateHUD(sectionId, progress = 0) {
  const data = sectionData[sectionId];
  if (!data) return;
  
  // Sector
  if (hud.sector && hud.sector.textContent !== data.sector) {
    gsap.to(hud.sector, {
      duration: 0.1,
      opacity: 0,
      onComplete: () => {
        hud.sector.textContent = data.sector;
        gsap.to(hud.sector, { duration: 0.2, opacity: 1 });
      }
    });
  }
  
  // Depth
  if (hud.depth) hud.depth.textContent = data.depth.toFixed(1);
  
  // Vector
  if (hud.vector) hud.vector.textContent = data.vector;
  
  // Signal
  if (hud.signal) hud.signal.textContent = `${data.signal}%`;
  
  // Nav links
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.section === sectionId);
  });
  
  // Section markers
  sectionMarkers.forEach(marker => {
    const isActive = marker.dataset.section === sectionId;
    const isPast = Object.keys(sectionData).indexOf(marker.dataset.section) <= 
                   Object.keys(sectionData).indexOf(sectionId);
    marker.classList.toggle('active', isActive || isPast);
  });
}

// ───────────────────────────────────────────────────────────────
// SCROLL-DRIVEN COORDINATES + PARTICLE Z-POSITION
// ───────────────────────────────────────────────────────────────
function initCoordinates() {
  ScrollTrigger.create({
    trigger: '.scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;
      
      // UPDATE PARTICLE SYSTEM Z-POSITION (key for 3D navigation)
      if (window.particleSystem && window.particleSystem.setScrollProgress) {
        window.particleSystem.setScrollProgress(p);
      }
      
      // Animate semantic coordinates
      if (hud.delta) hud.delta.textContent = (0.27 + p * 0.5).toFixed(2);
      if (hud.theta) hud.theta.textContent = (58.1 + p * 30).toFixed(1) + '°';
      if (hud.rho) hud.rho.textContent = (0.63 + p * 0.3).toFixed(2);
      if (hud.zeta) hud.zeta.textContent = (2.4 + p * 7).toFixed(1);
      
      // Depth indicator position
      if (hud.depthIndicator) {
        hud.depthIndicator.style.top = `${p * 100}%`;
      }
      
      // Update depth readout (Z position in km)
      if (hud.depth) {
        hud.depth.textContent = (p * 7.5).toFixed(1);
      }
      
      // Update instruction text
      if (hud.instruction) {
        if (p < 0.1) {
          hud.instruction.textContent = 'Scroll to descend. The window stays. The world changes.';
        } else if (p < 0.3) {
          hud.instruction.textContent = 'Entering the manifesto. Recalibrating perspective.';
        } else if (p < 0.6) {
          hud.instruction.textContent = 'Navigation services detected. Plotting course.';
        } else if (p < 0.9) {
          hud.instruction.textContent = 'Approaching destination. Signal strengthening.';
        } else {
          hud.instruction.textContent = 'Arrival imminent. Initiating contact protocols.';
        }
      }
    }
  });
}

// ───────────────────────────────────────────────────────────────
// SECTION SCROLL TRIGGERS (for HUD updates)
// ───────────────────────────────────────────────────────────────
function initSectionTriggers() {
  const sections = document.querySelectorAll('.section');
  
  sections.forEach((section) => {
    const sectionId = section.dataset.section;
    
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => updateHUD(sectionId),
      onEnterBack: () => updateHUD(sectionId)
    });
  });
}

// ───────────────────────────────────────────────────────────────
// CONTENT ANIMATIONS
// ───────────────────────────────────────────────────────────────
function initContent() {
  // Animate elements on scroll
  gsap.utils.toArray('[data-animate]').forEach(el => {
    const delay = parseFloat(el.dataset.delay) || 0;
    
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 25,
      duration: 0.6,
      delay: delay,
      ease: 'power3.out'
    });
  });
}

// ───────────────────────────────────────────────────────────────
// HUD ENTRANCE
// ───────────────────────────────────────────────────────────────
function initHUDEntrance() {
  gsap.from('.hud-top', {
    opacity: 0,
    y: -15,
    duration: 0.6,
    delay: 0.2,
    ease: 'power3.out'
  });
  
  gsap.from('.hud-bottom', {
    opacity: 0,
    y: 15,
    duration: 0.6,
    delay: 0.3,
    ease: 'power3.out'
  });
  
  gsap.from('.hud-rail-left', {
    opacity: 0,
    x: -15,
    duration: 0.6,
    delay: 0.4,
    ease: 'power3.out'
  });
  
  gsap.from('.hud-rail-right', {
    opacity: 0,
    x: 15,
    duration: 0.6,
    delay: 0.4,
    ease: 'power3.out'
  });
  
  gsap.from('.hud-corner', {
    opacity: 0,
    duration: 0.6,
    stagger: 0.05,
    delay: 0.5,
    ease: 'power2.out'
  });
}

// ───────────────────────────────────────────────────────────────
// NAV LINKS
// ───────────────────────────────────────────────────────────────
function initNavLinks() {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        lenis.scrollTo(target, { offset: 0 });
      }
    });
  });
}

// ───────────────────────────────────────────────────────────────
// INIT
// ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Generate radar ticks
  generateTicks();
  
  // Init particle system (3D Z-based navigation)
  if (window.particleSystem) {
    window.particleSystem.init();
  }
  
  // Init all animations
  initCoordinates();
  initSectionTriggers();
  initContent();
  initHUDEntrance();
  initNavLinks();
  
  // Set initial state
  updateHUD('hero');
  
  ScrollTrigger.refresh();
});

window.addEventListener('resize', () => {
  ScrollTrigger.refresh();
});
