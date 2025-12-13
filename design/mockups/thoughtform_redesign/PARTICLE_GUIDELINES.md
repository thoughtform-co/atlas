# Particle System Guidelines

Instructions for creating on-brand particle visualizations across Thoughtform products.

---

## Core Constraints

These are **rules, not suggestions**. Breaking them breaks the universe.

### 1. Sharp Geometry Only

```javascript
// ✅ CORRECT: Squares via fillRect
ctx.fillRect(x, y, size, size);

// ❌ WRONG: Circles via arc
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
```

**Why:** Sharp edges reinforce precision and measurement. We are observing, not decorating.

---

### 2. Grid Snapping (GRID = 3)

All particle positions must snap to a 3px grid:

```javascript
const GRID = 3;

function snap(value) {
  return Math.floor(value / GRID) * GRID;
}

// In render:
ctx.fillRect(snap(x), snap(y), size - 1, size - 1);
```

**Why:** Creates the "observed data" aesthetic — like readings from an instrument, not smooth graphics.

---

### 3. Particle Count Limits

| Visualization Type | Max Particles |
|-------------------|---------------|
| Background ambient | 20-30 |
| Single landmark | 50-200 |
| Full scene (all landmarks) | 400-600 stars + 2000-3000 geo |

**Why:** Performance and restraint. Too many particles = noise, not signal.

---

### 4. No Glow Effects

```javascript
// ❌ WRONG: Glow halos
ctx.globalAlpha = 0.3;
ctx.arc(x, y, size * 2, 0, Math.PI * 2);  // Decorative glow
ctx.fill();

// ✅ CORRECT: Single-pass rendering
ctx.globalAlpha = depthAlpha;
ctx.fillRect(x, y, size, size);
```

**Why:** "Research station, not carnival." Glows are decorative flair.

---

### 5. Color Palette

```javascript
const DAWN = '#ebe3d6';   // Stars, ambient particles
const GOLD = '#caa554';   // Landmarks, structure, navigation
const ALERT = '#ff6b35';  // Event horizon, critical emphasis
const WHITE = '#ffffff';  // Trajectory lines (rare)
```

**Usage:**
- **DAWN** for background/ambient particles
- **GOLD** for meaningful geometry (landmarks)
- **ALERT** sparingly for final destination/singularity
- Never introduce new colors

---

### 6. ASCII Characters for Close Particles

When geo particles are close enough (scale > 0.35), render semantic characters:

```javascript
const CHARS = ['λ', 'δ', 'θ', 'φ', 'ψ', 'Σ', 'π', '∇', '∞', '∂', '⟨', '⟩'];

if (p.type === 'geo' && scale > 0.35) {
  const fontSize = Math.max(8, Math.min(18, 12 * scale));
  ctx.font = `${fontSize}px "IBM Plex Sans", sans-serif`;
  ctx.fillText(p.char, x, y);
}
```

**Why:** Reinforces "navigating language" — particles ARE symbols.

---

## Landmark Patterns

Each landmark should represent a **concept**, not just look cool.

### Semantic Terrain (Entry/Hero)

**Concept:** Meaning has topology — ideas are landscapes.

```javascript
// Isometric wireframe mesh with sine-wave height
for (let r = 0; r < 40; r++) {
  for (let c = 0; c < 40; c++) {
    const x = (c - 20) * 60;
    const z = 800 + r * 30;
    const y = 350 + 
      Math.sin(c * 0.18) * 120 + 
      Math.cos(r * 0.12) * 100 +
      Math.sin(c * 0.4 + r * 0.2) * 40;
    particles.push(createPoint(x, y, z, 'geo', GOLD));
  }
}
```

---

### Polar Orbit (Manifesto)

**Concept:** Cyclical thinking, recursive patterns.

```javascript
// Concentric rings + spiral core
for (let ring = 0; ring < 6; ring++) {
  const radius = 150 + ring * 80;
  const points = 40 + ring * 10;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    particles.push(createPoint(x, y, z, 'geo', GOLD));
  }
}
```

---

### Trajectory Tunnel (Services)

**Concept:** Direction, purpose, moving toward a goal.

```javascript
// Receding perspective rectangles + helix
for (let layer = 0; layer < 12; layer++) {
  const z = 4200 + layer * 100;
  const size = 300 - layer * 15;
  for (let i = 0; i < 40; i++) {
    const t = (i / 40) * 2 - 1;
    // Rectangle edges
    particles.push(createPoint(t * size, -size, z, 'geo', GOLD));
    particles.push(createPoint(t * size, size, z, 'geo', GOLD));
  }
}
```

---

### Event Horizon (Contact/Destination)

**Concept:** The singularity, point of convergence.

```javascript
// Sphere distribution + core rings
for (let i = 0; i < 800; i++) {
  const r = 450;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  particles.push(createPoint(x, y, z, 'geo', ALERT));
}
```

---

## Animation Rules

### ✅ Allowed Motion

- **Scroll-driven Z movement** (camera moves through space)
- **Depth-based alpha fade** (closer = more visible)
- **Subtle ambient drift** for background stars (0.3px/frame max)

### ❌ Forbidden Motion

- Continuous rotation animations
- Pulsing/breathing effects
- Glow animations
- Spiral/vortex spinning

**Why:** Motion should come from the user's navigation, not intrinsic animation. The interface observes; it doesn't perform.

---

## Render Loop Pattern

```javascript
function render() {
  // Trail effect (don't fully clear)
  ctx.fillStyle = 'rgba(5, 5, 4, 0.85)';
  ctx.fillRect(0, 0, width, height);
  
  // Sort by depth
  const sorted = particles.slice().sort((a, b) => b.z - a.z);
  
  sorted.forEach(p => {
    // Calculate screen position
    const scale = FOCAL / relZ;
    const x = center + p.x * scale;
    const y = cy + p.y * scale;
    
    // Depth-based visibility
    const depthAlpha = Math.min(1, (1 - relZ / MAX_DEPTH) * 1.8);
    ctx.globalAlpha = depthAlpha;
    ctx.fillStyle = p.color;
    
    // Grid-snapped square
    const size = Math.max(GRID, GRID * scale);
    ctx.fillRect(snap(x), snap(y), size - 1, size - 1);
  });
  
  requestAnimationFrame(render);
}
```

---

## Anti-Patterns

### ❌ The Galaxy/Vortex Trap

```javascript
// ❌ WRONG: Decorative spiral with thousands of particles
for (let arm = 0; arm < 5; arm++) {
  for (let i = 0; i < 180; i++) {
    const angle = armOffset + t * Math.PI * 4;
    const radius = 50 + t * 500;
    // Creates ~900 particles in a swirl
  }
}
```

**Problem:** Looks like a screensaver, not an instrument. Decorative, not meaningful.

---

### ❌ The Glow Trap

```javascript
// ❌ WRONG: Multiple passes for "atmosphere"
// Pass 1: Large blurry glow
ctx.globalAlpha = 0.2;
ctx.arc(x, y, size * 3, 0, Math.PI * 2);
// Pass 2: Medium glow
ctx.globalAlpha = 0.4;
ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
// Pass 3: Core
ctx.arc(x, y, size, 0, Math.PI * 2);
```

**Problem:** Breaks sharp geometry. Adds decoration, not information.

---

### ❌ The Animation Trap

```javascript
// ❌ WRONG: Continuous rotation
p.angle += p.speed * 16;  // Spinning particles
```

**Problem:** The interface should observe, not perform. Motion comes from user navigation.

---

## Checklist Before Shipping

- [ ] All particles are squares (`fillRect`), no circles
- [ ] Positions snap to GRID = 3
- [ ] Particle count under limits
- [ ] No glow/blur effects
- [ ] Only DAWN, GOLD, ALERT colors
- [ ] No continuous animation (scroll-driven only)
- [ ] Landmark geometry has conceptual meaning
- [ ] ASCII characters appear on close particles
- [ ] Uses `requestAnimationFrame`, not `setInterval`
- [ ] DPR-aware canvas setup

---

## Reference Implementation

See `particles.js` in this folder for the canonical implementation used in the Thoughtform website redesign.
