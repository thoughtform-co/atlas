# Celestial Constellation Mockup

A mockup for testing a new celestial/galaxy-style visualization for the Atlas constellation view.

## Concept

Instead of flat 2D particle clouds, each domain is visualized as a **spherical galaxy** with:

- **3D particle distribution** - Particles positioned in 3D space and projected to 2D with depth-based opacity
- **Bright central core** - Each domain has a glowing center that particles orbit around
- **Radial connection lines** - Entity cards connect to the sphere center via lines radiating inward
- **Depth rendering** - Particles "behind" the sphere appear dimmer, creating a 3D effect

## Visual Reference

```
           ╱ Card A
          ╱
         ╱
    ●───────────●  Card B
   ╱ ╲  Core  ╱ ╲
  ╱   ╲  ●   ╱   ╲
 ╱     ╲ │ ╱     ╲
●───────────────────●
Card C    │       Card D
          │
          ╲
           Card E

(Particles distributed spherically throughout)
```

## Files

- `index.html` - Main HTML page with canvas and HUD elements
- `styles.css` - Styling matching Atlas design system
- `celestial-canvas.js` - Canvas rendering with 3D particle projection

## Usage

Open `index.html` directly in a browser (no build step required).

### Controls

- **Drag** - Pan the view
- **Scroll** - Zoom in/out
- **Control Panel** - Adjust visualization parameters:
  - Sphere Radius
  - Core Intensity
  - Particle Density
  - Connection Opacity
  - 3D Depth Effect

## Key Implementation Details

### 3D to 2D Projection

```javascript
function project3D(x, y, z, centerX, centerY, scale, depthEffect) {
  // Orthographic projection
  const screenX = centerX + x * scale;
  const screenY = centerY + y * scale;
  
  // Depth affects opacity
  const normalizedZ = z / sphereRadius;
  const depthAlpha = 0.3 + (normalizedZ + 1) * 0.35 * depthEffect;
  
  return { screenX, screenY, depthAlpha, z };
}
```

### Spherical Particle Distribution

```javascript
function createSphereParticle(radius, isCore) {
  const r = isCore 
    ? Math.random() * radius * 0.3  // Core particles near center
    : Math.pow(Math.random(), 0.4) * radius; // Shell particles
  
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
  };
}
```

## Design Considerations

### Pros
- More celestial, otherworldly aesthetic
- Clear visual grouping of domains
- 3D depth adds visual interest
- Lines radiating inward create "orbit" feeling

### Cons
- More computationally expensive
- May be harder to see individual entities
- 3D projection can cause overlapping

## Next Steps

1. Test with different parameter values
2. Evaluate performance with many particles
3. Consider adding slow rotation to spheres
4. Experiment with different projection styles (perspective vs orthographic)
5. If successful, integrate into main constellation view
