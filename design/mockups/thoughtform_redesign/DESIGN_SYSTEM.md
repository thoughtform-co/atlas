# Design System — Navigation Cockpit

Detailed design decisions and rationale for the Thoughtform website redesign.

---

## 1. Core Concept: The Navigation Metaphor

### Why Navigation?

Thoughtform's mission is helping people **navigate AI's latent space**. The website embodies this literally:

- Users **scroll to descend** through Z-space
- The **HUD frame stays fixed** (the instrument)
- The **world changes** around them (the territory)
- **Landmarks appear** at specific depths (meaning as geometry)

### Inspiration Sources

| Source | What We Took |
|--------|-------------|
| Star Atlas | Parallax zoom, orbital rings, chapter navigation |
| Flight HUDs | Radar ticks, readouts, targeting reticles |
| Terminal UIs | Monospace data, sharp frames, minimal decoration |
| Astrolabes | Brass/gold accents, measurement instruments |

---

## 2. Layout System

### Split Screen Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    ┌──────────────┐                    ┌──────────────────┐    │
│    │              │                    │                  │    │
│    │   CONTENT    │                    │    LANDMARK      │    │
│    │   (Left)     │                    │    (Right)       │    │
│    │              │                    │                  │    │
│    └──────────────┘                    └──────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Left side (45%)**: Text content, terminal-style cards
- **Right side (55%)**: Particle landmarks, empty space for breathing

### Why This Split?

1. **Reading flow**: Western readers scan left-to-right
2. **Visual hierarchy**: Text demands attention first, then visualization
3. **Cockpit metaphor**: Like looking out a spacecraft window

---

## 3. HUD Frame Design

### Fixed Elements

The HUD frame is `position: fixed` and stays on screen always:

```
Top Bar     →  Brand + Navigation + Signal
Left Rail   →  Depth scale (radar ticks) + Readouts
Right Rail  →  Section markers (01, 02, 03, 04)
Bottom Bar  →  Coordinates + Scroll instruction
Corners     →  Gold L-brackets
```

### Spacing Rules

| Element | Distance from Edge |
|---------|-------------------|
| Corner brackets | `var(--hud-padding)` (32-64px) |
| Top/bottom bars | `var(--hud-padding) + 24px` |
| Side rails | `var(--hud-padding) + 16px` |
| Content | Clears rails + 48px padding |

**Rationale**: Elements should never hug the corner brackets. There should always be breathing room.

### Information Density

- **Top bar**: Brand identity (always visible)
- **Side rails**: Navigation aids (glanceable)
- **Bottom bar**: Technical data (for engaged users)

---

## 4. Particle System Architecture

### Vanishing Point Split

The key innovation is using **two vanishing points**:

```javascript
const cx_stars = width * 0.5;   // Stars: center
const cx_geo = width * 0.72;    // Landmarks: right side
```

This creates the sensation of **flying past** landmarks rather than through them.

### Landmark Design

Each landmark represents a conceptual territory:

| Landmark | Concept | Visual Language |
|----------|---------|-----------------|
| Semantic Terrain | Meaning as topology | Wireframe mountain, sine waves |
| Polar Orbit | Circular thinking, cycles | Concentric rings, spiral |
| Trajectory Tunnel | Direction, purpose | Receding rectangles, helix |
| Event Horizon | Destination, singularity | Sphere, gravitational pull |

### ASCII Characters

Close particles display semantic characters:

```javascript
const CHARS = ['λ', 'δ', 'θ', 'φ', 'ψ', 'Σ', 'π', '∇', '∞', '∂', '⟨', '⟩'];
```

**Why**: Reinforces "navigating language/meaning" — particles ARE symbols.

### Color Coding

| Element | Color | Hex |
|---------|-------|-----|
| Stars | Dawn (white) | `#ebe3d6` |
| Most landmarks | Gold | `#caa554` |
| Tunnel helix | White | `#ffffff` |
| Event Horizon sphere | Alert (orange) | `#ff6b35` |

---

## 5. Typography Decisions

### The Two-Font System

```
PP Mondwest          IBM Plex Sans
─────────────        ─────────────
Headlines            Navigation
Hero tagline         HUD data
Section titles       Body text
                     Buttons
                     Labels
```

### Why Not All PP Mondwest?

PP Mondwest is a **display font** — beautiful at large sizes but challenging to read at 9-12px. IBM Plex Sans is designed for UI and remains legible at small sizes.

### Size Scale

```css
/* Headlines */
font-size: clamp(28px, 4vw, 42px);

/* Hero tagline */
font-size: clamp(20px, 2.5vw, 26px);

/* Navigation */
font-size: 12px;

/* HUD data */
font-size: 9-11px;

/* Body text */
font-size: 15px;
```

---

## 6. Animation Principles

### Scroll-Driven Motion

Everything animates based on scroll position:

```javascript
ScrollTrigger.create({
  onUpdate: (self) => {
    const progress = self.progress; // 0 to 1
    scrollZ = progress * 7500;      // Z position
  }
});
```

### Entrance Animations

Content reveals with `gsap.from`:

```javascript
gsap.from(element, {
  opacity: 0,
  y: 25,
  duration: 0.6,
  ease: 'power3.out'
});
```

### HUD Updates

Section changes trigger smooth HUD transitions:

```javascript
gsap.to(hudElement, {
  duration: 0.15,
  opacity: 0,
  onComplete: () => {
    hudElement.textContent = newValue;
    gsap.to(hudElement, { duration: 0.2, opacity: 1 });
  }
});
```

---

## 7. Responsive Behavior

### Breakpoints

| Breakpoint | Changes |
|------------|---------|
| `< 1100px` | Single-column layout, hide visualization placeholder |
| `< 900px` | Hide side rails, reduce nav spacing |
| `< 600px` | Hide brand text, hide coordinates |

### Mobile Philosophy

On mobile, the **particle system remains** but landmarks are centered. The HUD simplifies to essentials.

---

## 8. Brand Alignment Checklist

### ✅ Following

- [x] Void backgrounds (`#0a0908`)
- [x] Dawn text with opacity variants
- [x] Gold accent for navigation
- [x] Sharp geometry (no rounded corners)
- [x] Grid-snapped particles (`GRID = 3`)
- [x] Token-driven design (CSS variables)
- [x] Restraint over decoration

### ❌ Avoided

- [x] Purple gradients
- [x] Rounded corners
- [x] Box shadows
- [x] System fonts
- [x] Pure black/white
- [x] More than 3 accent colors

---

## 9. Future Considerations

### Potential Enhancements

1. **Mouse parallax**: Subtle movement on mouse position
2. **Sound design**: Ambient audio, scroll sounds
3. **Section transitions**: More dramatic landmark morphs
4. **Mobile gestures**: Swipe navigation

### Performance Optimization

1. Bundle GSAP/Lenis (not CDN)
2. Lazy-load below-fold content
3. WebGL for particle system (if needed)
4. Intersection Observer for animations

---

## 10. Implementation Notes

### Font Loading

PP Mondwest requires local font files:

```css
@font-face {
  font-family: 'PP Mondwest';
  src: url('/fonts/PPMondwest-Regular.woff2') format('woff2');
  font-display: swap;
}
```

### Canvas Performance

The particle system uses:
- Single canvas (not multiple)
- Trail effect (semi-transparent clear)
- Depth sorting for proper layering
- Culling for off-screen particles

### Scroll Smoothness

Lenis provides buttery smooth scrolling:

```javascript
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true
});
```
