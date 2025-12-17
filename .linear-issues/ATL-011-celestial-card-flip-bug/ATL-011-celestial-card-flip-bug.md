# ATL-011: Celestial Constellation - Card Flip Bug on Horizontal X-Axis

## Status: ✅ RESOLVED

## Priority: High

## Summary
In the Celestial Constellation mockup (`/mockups/celestial-constellation`), 3D entity cards that orbit around domain spheres exhibit an unwanted **horizontal flip on their X-axis** when they pass through the back of the orbital sphere (when z becomes negative / card is behind the sphere center).

## Expected Behavior
Cards should be **tidally locked** to the sphere:
- Front of card faces outward from sphere center at all times
- When card is at **front** of sphere (z > 0): we see the **front** of the card
- When card is at **back** of sphere (z < 0): we see the **back** of the card (mirrored content, like a transparent tablet)
- Rotation should be smooth and continuous — NO sudden flips or jumps

## Actual Behavior
When a card crosses from the front to the back of the sphere (or vice versa), it suddenly flips 180° on its horizontal axis, causing a jarring visual jump.

## Technical Root Cause Analysis

### The Problem with `atan2`

The current rotation calculation uses:

```typescript
const rotationY = Math.atan2(pos.x, pos.z) * (180 / Math.PI);
```

`Math.atan2(x, z)` returns the angle in radians between the positive Z-axis and the point (x, z), which ranges from **-π to +π** (or -180° to +180°).

**The discontinuity occurs when:**
- A card crosses from z slightly positive to z slightly negative while x is positive → angle jumps from ~90° to ~90°
- A card crosses from z slightly positive to z slightly negative while x is negative → angle jumps from ~-90° to ~-90°
- **BUT** when crossing through z=0 at x≈0 (the "back" of the orbit), the angle jumps from +180° to -180° (or vice versa)

This 360° jump in the calculated angle causes the card to suddenly flip.

### Why This Happens Geometrically

The orbit path in the XZ plane is:
```
x = r * sin(theta) * cos(phi + rotation)
z = r * sin(theta) * sin(phi + rotation)
```

As `phi + rotation` increases continuously from 0 to 2π:
- At φ=0: (x=0, z=r) → atan2 = 0°
- At φ=π/2: (x=r, z=0) → atan2 = 90°
- At φ=π: (x=0, z=-r) → atan2 = 180° (approaching from positive x) OR -180° (approaching from negative x)
- At φ=3π/2: (x=-r, z=0) → atan2 = -90°

The `atan2` function has a **branch cut** at ±180°, causing the discontinuity.

## Approaches Tried

### Attempt 1: Use continuous phi angle directly
```typescript
const currentPhi = entity.basePhi + rotationAngle;
const rotationY = currentPhi * (180 / Math.PI);
```
**Result:** Cards no longer face outward from sphere — they all face the same global direction.

### Attempt 2: Remove X rotation
```typescript
const rotationX = 0; // Prevents vertical flip
```
**Result:** Helped prevent some artifacts but didn't solve the horizontal flip.

### Attempt 3: Billboard approach (cards always face camera)
```typescript
// Remove rotationY entirely, cards always face viewer
transform: `scale(${depthScale})`
```
**Result:** Removed the flip but lost the 3D tidal-lock effect entirely — cards no longer show their edges/backs.

### Attempt 4: backface-visibility: visible
```css
.cardFront {
  backface-visibility: visible;
}
```
**Result:** Allows seeing content from behind (mirrored) but doesn't prevent the flip itself.

### Attempt 5: Normalize angle to prevent wrap-around
Various attempts to use modulo or clamp the angle — all failed to produce smooth continuous rotation.

## Key Constraint

The desired behavior is **tidal locking**, NOT billboarding:
- Cards MUST rotate with the sphere
- Cards MUST show edges when viewed from the side
- Cards MUST show mirrored back when behind the sphere
- The rotation MUST be continuous without jumps

## Files Involved

See the attached files in this folder:
- `page.tsx` - Main component with rotation logic
- `celestial.module.css` - 3D card styling

## Potential Solutions to Investigate

1. **Quaternion-based rotation** - Use quaternions instead of Euler angles to avoid gimbal lock and discontinuities

2. **Accumulate rotation delta** - Instead of calculating absolute angle with atan2, track the continuous rotation angle and apply it directly

3. **Smooth angle transitions** - Detect when angle is about to wrap and interpolate smoothly across the discontinuity

4. **CSS `rotate3d()` with axis-angle** - Use axis-angle representation instead of separate rotateX/rotateY

5. **Two-pass rendering** - Render front-facing cards in one pass, back-facing in another, with different transforms

## Visual Reference

The HTML mockup at `design/mockups/celestial-constellation/index.html` exhibits the same issue, proving it's a fundamental math problem, not a React/CSS-specific issue.

## ✅ THE FIX

### Insight
You already **know** the angle—it's `entity.basePhi + rotationAngle`. No need to recalculate it from position coordinates using `atan2`.

### Before (broken):
```typescript
const rotationY = Math.atan2(pos.x, pos.z) * (180 / Math.PI);
```

### After (fixed):
```typescript
const continuousPhi = entity.basePhi + rotationAngle;
const rotationY = 90 - (continuousPhi * (180 / Math.PI));
```

### Why It Works
| Approach | Transition |
|----------|------------|
| `atan2(x, z)` | **JUMPS** at ±180° branch cut |
| `90 - phi°` | **SMOOTH** always (continuous) |

## Related Commits

- `f874a6f` - Last working state (has flip but 3D structure intact)
- `891ecc1` - Transparent tablet implementation
- `cbf9e25` - Billboard attempt (broke tidal locking)
- `84b203c` - Attempted fix with continuous phi (also broke it)
