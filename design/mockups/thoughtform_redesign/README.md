# Thoughtform Website Redesign

**Navigation Cockpit Experience** — A scroll-driven journey through AI's latent space.

## Concept

The website is a **navigation console** traveling through the latent space of machine intelligence. As users scroll, they fly through 3D space, encountering distinct particle landmarks that represent different conceptual territories.

> *"Intelligence is not software; it is a territory. We build the interfaces that allow you to traverse the latent space of the machine mind."*

### Core Metaphor

- **The Window Stays** — Fixed HUD frame (like a cockpit)
- **The World Changes** — Background particles move as you scroll through Z-space
- **Landmarks Appear** — Distinct visualizations emerge on the right side

---

## File Structure

```
thoughtform_redesign/
├── index.html          # Main HTML structure
├── styles.css          # All CSS with design tokens
├── particles.js        # 3D particle engine
├── animations.js       # GSAP scroll animations + HUD logic
├── README.md           # This file
└── DESIGN_SYSTEM.md    # Detailed design decisions
```

---

## Quick Start

1. Open `index.html` in a browser
2. Scroll to navigate through Z-space
3. Watch landmarks appear on the right side

### Dependencies (CDN)

- **GSAP 3.12.5** + ScrollTrigger
- **Lenis 1.1.13** (smooth scroll)
- **Google Fonts**: IBM Plex Sans
- **Local Font**: PP Mondwest (requires font files)

---

## The 4 Landmarks

Each section has a corresponding 3D particle landmark that appears on the **right side** of the screen:

| Section | Z-Depth | Landmark | Visual Description |
|---------|---------|----------|-------------------|
| **Hero** | 800-2000 | Semantic Terrain | Gold wireframe mountain with sine wave topology |
| **Manifesto** | 2500-3500 | Polar Orbit | Concentric rings + spiral, gold/dawn colors |
| **Services** | 4000-5500 | Trajectory Tunnel | White helix + receding gold grid rectangles |
| **Contact** | 6000-7500 | Event Horizon | Orange sphere with gold core rings |

### Split Vanishing Points

The particle system uses **two vanishing points**:
- **Stars**: Center of screen (50%) — flying forward
- **Landmarks**: Right side (72%) — looking out the cockpit window

This creates the sensation of flying past landmarks, not through them.

---

## HUD Information Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│  THOUGHTFORM / Sector    [Nav Links]           Signal 88%      │  ← Brand Layer
├─────────────────────────────────────────────────────────────────┤
│  ─ 0 ─                                              ■ 01       │
│  ─   ─                                              ■ 02       │
│  ─ 2 ─  ◆──     ┌─────────────────────┐             ■ 03       │  ← Navigation
│  ─   ─          │   LANDMARK          │             □ 04       │
│  ─ 5 ─          │   (Right Side)      │                        │
│  ─   ─          └─────────────────────┘                        │
│  ─ 7 ─                                                         │
│  2.9 km                                                        │
│  Vector: Strategic                                             │  ← Readouts
├─────────────────────────────────────────────────────────────────┤
│  δ: 0.47  θ: 69.9°  ρ: 0.75  ζ: 5.2    [Scroll instruction]   │  ← Coordinates
└─────────────────────────────────────────────────────────────────┘
```

### Element Types

| Element | Purpose | Updates On |
|---------|---------|-----------|
| Sector Name | Current location in narrative | Section change |
| Signal % | Engagement/connection strength | Section change |
| Depth (km) | Z-position in latent space | Scroll |
| Vector | Current trajectory type | Section change |
| δ θ ρ ζ | Semantic coordinates | Scroll (continuous) |
| Section Markers | Progress through site | Section change |

---

## Typography

### Font Assignment

| Font | Use Case | Sizes |
|------|----------|-------|
| **PP Mondwest** | Headlines, hero tagline, section titles | 20-42px |
| **IBM Plex Sans** | Nav, HUD data, body text, buttons | 9-15px |

### Principle

> **Display font for impact, sans-serif for legibility.**

PP Mondwest is distinctive but hard to read at small sizes. IBM Plex Sans is used for all functional UI text.

---

## Color Palette

Based on Thoughtform brand tokens:

```css
--void: #0a0908;        /* Background */
--dawn: #ebe3d6;        /* Primary text, particles */
--gold: #caa554;        /* Accent, navigation, landmarks */
--alert: #ff6b35;       /* Event Horizon landmark */
```

### Opacity Scale

Dawn color uses opacity variants for hierarchy:
- `--dawn-70`: Secondary text
- `--dawn-50`: Tertiary text
- `--dawn-30`: Labels, metadata
- `--dawn-15`: Borders
- `--dawn-08`: Subtle separators

---

## Technical Implementation

### Scroll → Z Navigation

```javascript
// Scroll progress (0-1) maps to Z position (0-7500)
scrollZ = progress * 7500;
```

### Particle Rendering

- **Grid snapping**: `GRID = 3` for pixelated aesthetic
- **Trail effect**: Semi-transparent clear (0.85 alpha)
- **ASCII characters**: Appear on close particles (λ, δ, θ, Σ, π, etc.)
- **Depth-based alpha**: Closer particles = more visible

### Performance

- ~600 star particles (looping infinitely)
- ~3000 landmark particles (distributed across Z-space)
- 60fps on modern hardware
- Uses `requestAnimationFrame`

---

## Brand Alignment

This design follows Thoughtform's core principles:

✅ **Restraint Over Decoration** — Minimal, functional HUD  
✅ **Sharp Geometry** — No rounded corners  
✅ **Token-Driven Design** — All values use CSS variables  
✅ **Particles for Atmosphere** — Grid-snapped, performance-conscious  

### Anti-Patterns Avoided

❌ Purple gradients  
❌ Rounded corners  
❌ Box shadows  
❌ System fonts  
❌ More than 2-3 accent colors  

---

## Moving to Production

When moving to the Thoughtform.co repository:

1. **Font Files**: Ensure PP Mondwest is available at the correct path
2. **Dependencies**: Consider bundling GSAP/Lenis instead of CDN
3. **Images**: Add Thoughtform wordmark SVG (currently inline)
4. **Content**: Update section copy as needed
5. **Meta**: Add proper meta tags, OG images, etc.

---

## Credits

Built with the Thoughtform Brand System.

- **Design**: Navigation cockpit concept, HUD interface
- **Tech**: Canvas particles, GSAP ScrollTrigger, Lenis
- **Fonts**: PP Mondwest, IBM Plex Sans
