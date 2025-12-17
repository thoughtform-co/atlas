# ATL-011: Celestial Card Flip Bug

## Issue Summary
3D cards in the celestial constellation mockup flip unexpectedly on their horizontal axis when rotating around domain spheres.

**Full issue details:** [ATL-011-celestial-card-flip-bug.md](./ATL-011-celestial-card-flip-bug.md)

## Files in this folder

### Next.js Implementation
| File | Description |
|------|-------------|
| `page.tsx` | Main React component with 3D rotation logic (lines 149-158 contain the problematic rotation calculation) |
| `celestial.module.css` | CSS Module with 3D card structure and transforms |

### HTML/JS Mockup (same issue)
| File | Description |
|------|-------------|
| `celestial-canvas.js` | Canvas rendering + card position updates (see `updateCards()` function) |
| `styles.css` | Standalone CSS with 3D card transforms |

## Key Code Location

The flip occurs due to the `atan2` discontinuity in this calculation:

```typescript
// page.tsx, line 155
const rotationY = Math.atan2(pos.x, pos.z) * (180 / Math.PI);
```

When a card crosses through z ≈ 0 at certain x values, `atan2` jumps from +180° to -180°, causing a 360° flip.

## To Reproduce

1. Run `npm run dev`
2. Navigate to `/mockups/celestial-constellation`
3. Watch any card as it rotates past the back of the sphere
4. Observe the sudden horizontal flip

## Live Instance

- Next.js: `http://localhost:3000/mockups/celestial-constellation`
- HTML mockup: Open `design/mockups/celestial-constellation/index.html` directly in browser
