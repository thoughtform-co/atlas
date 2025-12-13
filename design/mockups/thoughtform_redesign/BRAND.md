# Thoughtform Brand System

Reference guide for the Thoughtform visual identity. This document summarizes the core brand elements used in this website.

---

## Brand Philosophy

### Core Principles

1. **Restraint Over Decoration**
   - Negative space > visual noise
   - Borders for hierarchy, not shadows
   - Glass effects only where they add depth

2. **Sharp Geometry**
   - No rounded corners (except threat indicator dots)
   - Precision and measurement aesthetic
   - Research station, not carnival

3. **Token-Driven Design**
   - Always use CSS variables
   - Never hardcode values
   - Single source of truth

4. **Particles for Atmosphere**
   - Subtle, grid-snapped (`GRID = 3`)
   - Performance-conscious (max 50-100 per visualization)
   - Suggest quantum uncertainty and measurement

---

## Color Palette

### Void (Backgrounds)

The depths — infinite space, the unknown.

```css
--void: #050403;        /* Primary background */
--surface-0: #0A0908;   /* Elevated surfaces */
--surface-1: #0F0E0C;   /* Nested containers */
```

### Dawn (Text & Particles)

Emergence into light — text, particles, highlights.

```css
--dawn: #ECE3D6;                          /* Primary text */
--dawn-70: rgba(236, 227, 214, 0.7);      /* Secondary text */
--dawn-50: rgba(236, 227, 214, 0.5);      /* Tertiary text */
--dawn-30: rgba(236, 227, 214, 0.3);      /* Labels, metadata */
--dawn-15: rgba(236, 227, 214, 0.15);     /* Hover borders */
--dawn-08: rgba(236, 227, 214, 0.08);     /* Default borders */
```

### Gold (Accent)

Navigation & measurement — the astrolabe's brass.

```css
--gold: #CAA554;                          /* Active states */
--gold-dim: rgba(202, 165, 84, 0.4);      /* Hover states */
--gold-15: rgba(202, 165, 84, 0.15);      /* Background tints */
```

### Alert (Optional)

For emphasis and critical elements.

```css
--alert: #ff6b35;    /* Orange - attention-grabbing */
```

---

## Typography

### Font Stack

```css
--font-display: 'PP Mondwest', serif;           /* Headlines */
--font-body: 'IBM Plex Sans', sans-serif;       /* Body, UI */
```

### Font Loading

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">

<!-- Local PP Mondwest -->
<style>
  @font-face {
    font-family: 'PP Mondwest';
    src: url('/fonts/PPMondwest-Regular.woff2') format('woff2');
    font-display: swap;
  }
</style>
```

### Usage Rules

| Use Case | Font | Weight | Size |
|----------|------|--------|------|
| Headlines | PP Mondwest | 400 | 28-42px |
| Taglines | PP Mondwest | 400 | 20-26px |
| Navigation | IBM Plex Sans | 400 | 11-12px |
| Body text | IBM Plex Sans | 300-400 | 14-15px |
| Labels | IBM Plex Sans | 400 | 9-11px |
| Buttons | IBM Plex Sans | 500 | 11px |

---

## Spacing Scale

8px base grid:

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
--space-4xl: 96px;
```

---

## Animation

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 0.15s;
--duration-normal: 0.3s;
```

---

## Particle System

### Core Constants

```javascript
const GRID = 3;  // Pixelation grid - DO NOT CHANGE

const GOLD = '#caa554';
const DAWN = '#ebe3d6';
const ALERT = '#ff6b35';
```

### Canvas Setup

```javascript
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
}
```

### Grid Snapping

```javascript
function snap(value) {
  return Math.floor(value / GRID) * GRID;
}
```

---

## Anti-Patterns

### NEVER Do This

- ❌ Purple gradients (cliché AI aesthetic)
- ❌ Rounded corners everywhere
- ❌ System fonts (Arial, Helvetica)
- ❌ Box shadows for depth
- ❌ Pure black `#000` or white `#FFF`
- ❌ More than 2-3 accent colors per screen
- ❌ Particles without grid snapping
- ❌ `setInterval` for animation

### ALWAYS Do This

- ✅ Use CSS variables for all values
- ✅ Sharp corners (border-radius: 0)
- ✅ Opacity variants for hierarchy
- ✅ Grid-snapped particles
- ✅ `requestAnimationFrame` for animation
- ✅ DPR-aware canvas setup

---

## Product Variations

Each Thoughtform product has distinct flavor while sharing core:

| Product | Character | Particle Density |
|---------|-----------|------------------|
| **Atlas** | Research station, void-heavy | Heavy |
| **Ledger** | Data-focused, lighter | Minimal |
| **Astrolabe** | Navigation-focused | Moderate |
| **Thoughtform.co** | Editorial, balanced | Subtle |

---

## Brand Voice

### Tone

- **Precise** but not cold
- **Curious** but not naive
- **Confident** but not arrogant
- **Technical** but accessible

### Key Phrases

- *"Navigate intelligence"*
- *"Meaning is geometry"*
- *"The territory, not the map"*
- *"Alien cognition"*
- *"Latent space"*

---

## Asset Locations

When moving to production, ensure these assets are available:

```
/fonts/
  PPMondwest-Regular.woff2
  PPMondwest-Regular.woff

/logos/
  Thoughtform_Word Mark.svg
  Thoughtform_Brandmark.svg
```

---

## Resources

- **Brand Submodule**: `thoughtform-brand/` in Atlas repo
- **Design Tokens**: `thoughtform-brand/tokens/tokens.css`
- **Brand Skills**: `thoughtform-brand/skills/brand/`
