# ATL-010: Text Positioning Jumps in Video Exports

**Status:** UNRESOLVED  
**Created:** 2024-12-12  
**Resolved:** (pending)

---

## Problem

When downloading entity cards as video files (MP4/WebM), text elements related to parameters (PHASE STATE, LATENT POSITION, MANIFOLD CURVATURE, EMBEDDING SIGNATURE, etc.) jump around between frames instead of remaining stable. The text appears perfectly aligned in the Atlas view (both in the DOM modal and in the canvas preview), but exported videos show text elements shifting position frame-by-frame.

### User Impact

- **Severity:** High - Exported videos are visually unstable and unprofessional
- **User Experience:** Users expect exported videos to match what they see in Atlas exactly
- **Functionality:** Video export feature is degraded - exports don't match the display
- **Professional Quality:** Jumping text makes exports unsuitable for professional use

### Visual Evidence

- **Atlas View:** Text is perfectly aligned and stable (see screenshots in `ATL-010-components/`)
- **Exported Video (VLC):** Text elements shift position between frames, creating a "jumping" effect
- **Comparison:** The exported video does not match the stable appearance seen in Atlas

---

## Root Causes

### Primary Root Cause

The canvas rendering loop calls `ctx.measureText()` on every frame to calculate text widths for positioning. Canvas text measurement can return slightly different values between frames due to:

1. **Font Rendering Variations**: Browser font rendering can produce micro-variations in text width measurements
2. **Subpixel Rendering**: Text measurement may vary slightly based on subpixel positioning
3. **Canvas Context State**: Minor variations in canvas context state between frames
4. **Dynamic Positioning**: Header text uses calculated positions based on previous text measurements, amplifying any measurement variations

### Technical Details

In `DenizenCardCanvas.tsx`, the header text positioning code (lines ~430-456) calculates positions dynamically:

```typescript
let x = 12 + ctx.measureText('ATLAS RESEARCH').width + 16;
ctx.fillText('MODE: ', x, 11);
x += ctx.measureText('MODE: ').width;
ctx.fillText('ACTIVE SCAN', x, 11);
// ... continues with more dynamic positioning
```

Each frame recalculates these measurements, and any variation in `measureText()` results causes cumulative positioning errors.

### Related Context

This issue is related to ATL-006 (Canvas-Based Card Export), which implemented the canvas rendering system. The canvas approach was chosen specifically to avoid html2canvas's positioning issues, but introduced this new text measurement stability problem.

---

## Attempted Solutions

### Attempt 1: Text Metrics Caching (Partial Fix)

**What was tried:** Added `textMetricsRef` to cache text width measurements on first render, then reuse cached values for subsequent frames.

**Implementation:**
- Created `textMetricsRef` to store cached measurements
- Cache measurements on first render only
- Use cached values for header text positioning

**Files changed:**
- `src/components/constellation/DenizenCardCanvas.tsx` (lines ~125, ~440-456)

**Commits:**
- `2a9c7eb` - Fix text jumping in video exports by caching text measurements

**Why it didn't fully work:**
- Caching helps with header text, but the issue persists with parameter text (PHASE STATE, LATENT POSITION, etc.)
- Time-based text (epoch, elapsed time) still needs dynamic measurement
- May need to cache ALL text measurements, not just header
- Need to investigate if other text elements are also using dynamic positioning

**Current Status:** Partial fix applied, but issue not fully resolved. Parameter text still jumps.

---

## Relevant Components

### Primary Component
- `src/components/constellation/DenizenCardCanvas.tsx` - Canvas-based card renderer
  - Lines ~430-495: Header and parameter text rendering
  - Lines ~120-125: State refs including `textMetricsRef`
  - Lines ~350-380: Main render loop

### Related Components
- `src/components/constellation/DenizenModalV3.tsx` - Modal that triggers exports
  - Lines ~565-580: `handleExportVideo()` function
  - Lines ~857-863: `DenizenCardCanvas` component integration

### Supporting Documentation
- `.linear-issues/ATL-006-canvas-based-card-export.md` - Original canvas implementation
- `.github/ISSUES/card-export-problem.md` - Historical export issues

**See `ATL-010-components/` folder for copied component files**

---

## Solution

[To be added when resolved]

---

## Product Learning

[To be added when resolved]

---

## Notes

- This issue was discovered after implementing the canvas-based export system (ATL-006)
- The canvas approach was chosen specifically to avoid html2canvas positioning issues
- Need to balance dynamic text (time, epoch) with stable positioning
- Consider pre-rendering all text measurements at initialization
- May need to investigate font loading and ensure fonts are fully loaded before measuring
