# Atlas: Design Flow & Process

> How we design, prototype, and implement UI in Atlas

---

## Overview

Atlas follows a **mockup-first, token-driven** design workflow. We prototype in static HTML, test interactively in the browser, then implement in React with CSS Modules. Every visual decision traces back to design tokens defined in `globals.css`.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DESIGN FLOW                              │
│                                                                 │
│   1. CONCEPT        2. MOCKUP         3. IMPLEMENT              │
│   ┌─────────┐      ┌─────────┐       ┌─────────┐               │
│   │ Sketch  │ ───► │  HTML   │ ───►  │  React  │               │
│   │ Ideas   │      │ Proto   │       │  + CSS  │               │
│   └─────────┘      └─────────┘       │ Modules │               │
│                         │            └─────────┘               │
│                         ▼                                       │
│                   ┌─────────┐                                   │
│                   │ Browser │                                   │
│                   │  Test   │                                   │
│                   └─────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Design Tokens

All visual properties are defined as CSS custom properties in `src/app/globals.css`. **Never hardcode colors or spacing values.**

### Color Palette

```css
/* Void - The Depths (backgrounds) */
--void: #050403;           /* Primary background */
--surface-0: #0A0908;      /* Elevated surfaces */
--surface-1: #0F0E0C;      /* Cards, modals */

/* Dawn - Emergence (text, particles) */
--dawn: #ECE3D6;           /* Primary text */
--dawn-70 → --dawn-04      /* Opacity variants for hierarchy */

/* Tensor Gold - Navigation & Measurement */
--gold: #CAA554;           /* Accents, links, highlights */
--gold-dim: rgba(202, 165, 84, 0.4);

/* Threat Levels */
--threat-benign: #5B8A7A;      /* Teal - Safe */
--threat-cautious: #7A7868;    /* Tan - Unknown */
--threat-volatile: #CAA554;    /* Gold - Active */
--threat-existential: #8B5A5A; /* Rust - Critical */

/* Cardinal Coordinates */
--cardinal-geometry: #CAA554;  /* ◆ Structure */
--cardinal-alterity: #ECE3D6;  /* ○ Otherness */
--cardinal-dynamics: #5B8A7A;  /* ◇ Change */
```

### Spacing Scale (8px Grid)

```css
--space-xs: 8px;    /* Micro gaps, inline element spacing */
--space-sm: 12px;   /* Small internal spacing, tight groups */
--space-md: 16px;   /* Default card padding, minimum edge padding */
--space-lg: 20px;   /* Larger component padding */
--space-xl: 24px;   /* Modal sections, generous breathing room */
--space-2xl: 32px;  /* Major section separation */
```

**Rule**: Minimum edge padding for framed elements is `--space-md` (16px). Content should never feel cramped against borders.

### Typography

```css
--font-mono: 'PT Mono', monospace;     /* Data, coordinates, labels */
--font-sans: 'IBM Plex Sans', sans-serif;  /* Descriptions, lore, body text */
```

---

## 2. Visual Principles

### Angular Geometry
- **No rounded corners** (enforced globally via CSS)
- Exception: threat indicator dots use `.threat-dot` class
- Sharp edges reinforce the research station aesthetic

### Void-First Design
- Start with darkness (`--void`)
- Elements emerge from the void, not placed on top of it
- Light comes from content, not backgrounds

### Gold Accents
- Navigation elements
- Interactive highlights
- Data emphasis
- Use sparingly—gold draws the eye

### Canvas Visualizations
- Particle systems for entity connections
- Animated backgrounds (star fields)
- Data readouts and waveforms
- All performance-critical animations use HTML Canvas

---

## 3. Mockup Workflow

### Location
All mockups live in `design/mockups/`:
```
design/mockups/
├── README.md              # Usage instructions
├── entity-card.html       # Entity card component
├── denizen-modal.html     # Detail modal
├── new-entity-page.html   # Admin cataloguing interface
└── archive-page.html      # Archive/Lore page layout
```

### Creating a New Mockup

1. **Start with the template structure**:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Name - Atlas Mockup</title>
  
  <!-- Google Fonts (match production) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=PT+Mono&display=swap" rel="stylesheet">
  
  <style>
    /* Copy design tokens from globals.css */
    :root {
      --void: #050403;
      --surface-0: #0A0908;
      --surface-1: #0F0E0C;
      --dawn: #ECE3D6;
      /* ... etc */
    }
    
    /* Component-specific styles */
  </style>
</head>
<body>
  <!-- Component markup -->
  
  <!-- Optional: Interactive controls -->
  <div class="control-panel">
    <label>
      Padding: <input type="range" id="padding" min="8" max="48" value="16">
      <span id="padding-value">16px</span>
    </label>
  </div>
  
  <script>
    // Interactive controls for testing
  </script>
</body>
</html>
```

2. **Add interactive controls** for adjustable properties:
   - Spacing values
   - Toggle visibility of debug guides
   - Responsive breakpoint simulation

3. **Test in browser**:
   - Open HTML file directly (no server needed)
   - Adjust values until spacing feels right
   - Check responsive behavior
   - Note final values for implementation

### Mockup Best Practices

- **Use exact design tokens** from `globals.css`
- **Include hover states** and transitions
- **Add visual guides** (toggleable) to show padding boundaries
- **Test both mobile and desktop** widths
- **Document the values** in the mockup's README section

---

## 4. React Implementation

### File Structure

```
src/components/
├── admin/                    # Admin panel components
│   ├── ComponentName.tsx     # Component logic
│   ├── ComponentName.module.css  # Scoped styles
│   └── index.ts              # Barrel export
├── constellation/            # Canvas view components
├── ui/                       # Shared UI components
└── LoginModal.tsx            # Auth modal
```

### CSS Modules Pattern

Every component gets its own `.module.css` file:

```tsx
// ComponentName.tsx
import styles from './ComponentName.module.css';

export function ComponentName() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Title</h2>
      <p className={styles.description}>Content</p>
    </div>
  );
}
```

```css
/* ComponentName.module.css */
.container {
  background: var(--surface-1);
  padding: var(--space-lg);
  border: 1px solid var(--dawn-15);
}

.title {
  font-family: var(--font-mono);
  color: var(--gold);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.description {
  font-family: var(--font-sans);
  color: var(--dawn-70);
  font-size: 0.875rem;
  line-height: 1.6;
}
```

### When to Use Tailwind vs CSS Modules

| Use Tailwind | Use CSS Modules |
|--------------|-----------------|
| Simple utilities (`flex`, `gap-4`) | Complex component styles |
| Quick prototyping | Animations and transitions |
| Layout helpers | Pseudo-elements (`::before`, `::after`) |
| Responsive modifiers | Hover/focus states with multiple properties |

**Hybrid approach** is common:

```tsx
<div className={`${styles.card} flex flex-col gap-4`}>
```

---

## 5. Component Patterns

### Card Components

```css
.card {
  background: var(--surface-1);
  border: 1px solid var(--dawn-15);
  padding: var(--space-lg);
  position: relative;
  overflow: hidden;
}

/* Optional: Decorative corner */
.card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, transparent 50%, var(--dawn-08) 50%);
}
```

### Labels & Tags

```css
.label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--dawn-50);
}

.tag {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  background: var(--dawn-08);
  border: 1px solid var(--dawn-15);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dawn-70);
}
```

### Interactive Elements

```css
.button {
  background: transparent;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: var(--space-sm) var(--space-lg);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:hover {
  background: var(--gold);
  color: var(--void);
}
```

### Section Dividers

```css
.divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--dawn-15) 20%,
    var(--dawn-15) 80%,
    transparent 100%
  );
  margin: var(--space-xl) 0;
}
```

---

## 6. Canvas Visualizations

For animated or data-driven visuals, we use HTML Canvas:

```tsx
'use client';
import { useEffect, useRef } from 'react';

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Animation loop
    let animationId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw particles...
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
```

### Canvas Best Practices

- Use `requestAnimationFrame` for smooth animation
- Clean up animation on unmount
- Set `pointer-events-none` for overlay canvases
- Consider pixel density (`devicePixelRatio`) for crisp rendering
- Keep particle counts reasonable for performance

---

## 7. Responsive Design

### Breakpoints

We use Tailwind's default breakpoints with a mobile-first approach:

```
sm: 640px   - Small tablets
md: 768px   - Tablets
lg: 1024px  - Small desktops
xl: 1280px  - Large desktops
2xl: 1536px - Extra large screens
```

### Responsive Patterns

```tsx
// Padding that increases on larger screens
<div className="px-4 md:px-6 lg:px-8">

// Grid that adjusts columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:block">
```

### CSS Module Responsive

```css
.container {
  padding: var(--space-md);
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-xl);
  }
}
```

---

## 8. Design Review Checklist

Before implementing a component, verify:

- [ ] **Tokens**: All colors/spacing use CSS variables
- [ ] **Geometry**: No rounded corners (unless intentional)
- [ ] **Typography**: Correct font family (mono vs sans)
- [ ] **Spacing**: Minimum 16px edge padding on framed elements
- [ ] **Hover states**: Interactive elements have clear feedback
- [ ] **Responsive**: Works on mobile and desktop
- [ ] **Canvas**: Animations use requestAnimationFrame
- [ ] **Accessibility**: Keyboard navigation, screen reader support

---

## 9. Adding a New Component

### Step-by-Step Process

1. **Create HTML mockup** in `design/mockups/`
   - Use design tokens
   - Add interactive controls for spacing
   - Test in browser

2. **Document values** from mockup testing
   - Note final spacing values
   - Record any animations/transitions

3. **Create React component**
   ```
   src/components/[category]/
   ├── NewComponent.tsx
   └── NewComponent.module.css
   ```

4. **Implement styles** using CSS Modules
   - Reference design tokens via `var(--token)`
   - Add responsive breakpoints

5. **Export from barrel**
   ```ts
   // index.ts
   export { NewComponent } from './NewComponent';
   ```

6. **Use in page**
   ```tsx
   import { NewComponent } from '@/components/[category]';
   ```

---

## 10. Example: Full Component Creation

### Goal: Create a "Status Badge" component

**1. Mockup** (`design/mockups/status-badge.html`):
```html
<div class="badge benign">
  <span class="dot"></span>
  <span class="label">BENIGN</span>
</div>

<style>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--dawn-04);
  border: 1px solid var(--dawn-15);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.badge.benign { color: var(--threat-benign); }
.badge.volatile { color: var(--threat-volatile); }

.label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
}
</style>
```

**2. React Component** (`StatusBadge.tsx`):
```tsx
import styles from './StatusBadge.module.css';

type ThreatLevel = 'benign' | 'cautious' | 'volatile' | 'existential';

interface StatusBadgeProps {
  level: ThreatLevel;
}

export function StatusBadge({ level }: StatusBadgeProps) {
  return (
    <div className={`${styles.badge} ${styles[level]}`}>
      <span className={`${styles.dot} threat-dot`} />
      <span className={styles.label}>{level.toUpperCase()}</span>
    </div>
  );
}
```

**3. CSS Module** (`StatusBadge.module.css`):
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--dawn-04);
  border: 1px solid var(--dawn-15);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50% !important; /* Override global no-radius */
  background: currentColor;
}

.label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
}

.benign { color: var(--threat-benign); }
.cautious { color: var(--threat-cautious); }
.volatile { color: var(--threat-volatile); }
.existential { color: var(--threat-existential); }
```

---

## Summary

| Step | Tool | Output |
|------|------|--------|
| 1. Concept | Sketches, notes | Visual direction |
| 2. Mockup | HTML + CSS | Interactive prototype |
| 3. Test | Browser | Validated spacing/interactions |
| 4. Implement | React + CSS Modules | Production component |
| 5. Integrate | Pages | Working feature |

**Key principles:**
- Design tokens are the source of truth
- Mockups are for experimentation
- CSS Modules for component isolation
- Canvas for performance-critical animation
- Mobile-first responsive design

---

*Atlas Design System v1.0 — Thoughtform Co.*

