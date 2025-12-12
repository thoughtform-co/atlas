# ATL-010: Text Positioning Jumps in Video Exports

**Status:** RESOLVED ✓  
**Created:** 2024-12-12  
**Resolved:** 2024-12-13

---

## Problem

When downloading entity cards as video files (MP4/WebM) or PNG images, text elements related to parameters (PHASE STATE, LATENT POSITION, MANIFOLD CURVATURE, EMBEDDING SIGNATURE, etc.) jump around between frames instead of remaining stable. The text appears perfectly aligned in the Atlas view (both in the DOM modal and in the canvas preview), but exported videos show text elements shifting position frame-by-frame.

### User Impact

- **Severity:** High - Exported videos are visually unstable and unprofessional
- **User Experience:** Users expect exported videos to match what they see in Atlas exactly
- **Functionality:** Video export feature is degraded - exports don't match the display
- **Professional Quality:** Jumping text makes exports unsuitable for professional use

### Visual Evidence

- **Atlas View:** Text is perfectly aligned and stable
- **Exported Video:** Now matches Atlas view exactly ✓

---

## Root Causes (All Fixed)

### 1. Dynamic Text Measurement (Fixed)
The canvas rendering loop called `ctx.measureText()` on every frame to calculate text widths for positioning, causing micro-variations.

**Fix:** Pre-calculate all text positions once after fonts load, store in `textLayoutRef` cache.

### 2. Export Canvas Not Rendering (Fixed)
The hidden export canvas container used `visibility: hidden`, which causes browsers to throttle/skip `requestAnimationFrame` callbacks.

**Fix:** Removed `visibility: hidden`, kept only off-screen positioning with `pointerEvents: 'none'`.

### 3. Silent ReferenceError (Fixed)
The variable `spectralCenterY` was referenced in the layout object but never declared, causing a silent error that prevented layout initialization.

**Fix:** Added proper variable definition before use.

### 4. Label Positioning (Fixed)
Parameter section labels had hardcoded Y positions (48, 68, 88) instead of being derived from section anchors, causing all labels to stack at the top.

**Fix:** Derived Y positions from section anchors (`phaseY`, `superY`, `hallucY`, `coordsY`, `manifoldY`, `spectralY`) with explicit right-column Y fields for future-proofing.

### 5. Embedding Signature Bar Drift (Fixed)
Bars were anchored to vertical center of panel, but UI shows them anchored to bottom.

**Fix:** Changed from `spectralCenterY` to `spectralBaseY` (bottom of panel minus padding, snapped to pixel grid).

---

## Solution Summary

### Key Changes to `DenizenCardCanvas.tsx`

1. **Static Text Layer**: Render all static text once to offscreen canvas (`staticTextCanvasRef`), composite every frame instead of re-rendering.

2. **Comprehensive Layout Cache**: `textLayoutRef` stores all pre-calculated positions:
   - Header text positions
   - Parameter label Y positions derived from section anchors
   - Explicit right-column Y fields (future-proof for asymmetric layouts)
   - Visualization positions with pixel-grid snapping

3. **Section-Anchored Labels**: Y positions derived from panel anchors:
   ```typescript
   phaseStateLabelY: Math.round(phaseY + 16),
   superpositionLabelY: Math.round(superY + 16),
   hallucinationLabelY: Math.round(hallucY + 16),
   latentPositionLabelY: Math.round(coordsY + 16),
   manifoldLabelY: Math.round(manifoldY + 16),
   embeddingLabelY: Math.round(spectralY + 16),
   ```

4. **Bottom-Anchored Bars**: Embedding Signature bars anchored to bottom of panel:
   ```typescript
   const SPECTRAL_BASE_PADDING = 12;
   const spectralBaseY = Math.floor((spectralY + spectralHeight - SPECTRAL_BASE_PADDING) / GRID) * GRID;
   ```

### Key Changes to `DenizenModalV3.tsx`

1. **Removed `visibility: hidden`**: Hidden export canvas now uses only off-screen positioning to allow `requestAnimationFrame` to run normally.

---

## Relevant Components

### Primary Component
- `src/components/constellation/DenizenCardCanvas.tsx` - Canvas-based card renderer

### Related Components
- `src/components/constellation/DenizenModalV3.tsx` - Modal that triggers exports

---

## Product Learning

1. **Browser Optimization Awareness**: `visibility: hidden` causes browsers to throttle animations - use only off-screen positioning for hidden but active canvases
2. **Silent Errors in Async Functions**: Undefined variables in async effects can silently fail without breaking the app, but prevent initialization from completing
3. **Debug with Runtime Evidence**: Pixel sampling and state logging proved essential for diagnosing the invisible export issue
4. **Future-Proof Layouts**: Use explicit position fields for each column rather than sharing values, even if currently symmetric
5. **Pixel Grid Snapping**: For particle/pixel-based animations, snap positions to the pixel grid to prevent subpixel jitter

---

## Notes

- This issue was discovered after implementing the canvas-based export system (ATL-006)
- The canvas approach was chosen specifically to avoid html2canvas positioning issues
- Static text layer approach successfully eliminated text jumping between frames
- Total debugging session involved 6 attempted fixes before full resolution
