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

### Attempt 2: Comprehensive Text Layout Cache with Fixed Anchors

**What was tried:** Pre-calculate all text positions once after fonts load, store in comprehensive `textLayoutRef` cache, and use fixed column anchors with `textAlign` for all text elements. Eliminate all `measureText()` calls from render loop.

**Implementation:**
- Created comprehensive `textLayoutRef` type storing all x/y positions for header, parameters, and footer
- Added `useEffect` that waits for `document.fonts.ready` before measuring text
- Measured all text once with correct font settings and canvas context (including devicePixelRatio scaling)
- Calculated fixed positions for:
  - Header: Fixed x positions instead of chaining widths
  - Parameters: Fixed column anchors (`leftColX`, `rightColX`) with fixed y positions
  - Footer: Fixed x positions for all elements
  - Dynamic text: Time and epoch use fixed right-aligned anchors
- Render loop skips drawing if layout not initialized
- All text rendering uses cached positions - no `measureText()` calls in render loop (except description word-wrapping which uses fixed x anchor)

**Files changed:**
- `src/components/constellation/DenizenCardCanvas.tsx` (lines ~127-161: textLayoutRef type, lines ~291-397: initialization effect, lines ~571-677: render loop updates)

**Commits:**
- `1babdcb` - Fix text positioning jumps in video exports by pre-calculating all text layout

**Why it didn't work:**
- Despite pre-calculating all positions and eliminating measureText from render loop, text still jumps in exported videos
- Possible causes:
  1. **Canvas context state variations**: Even with same coordinates, canvas context state (transform, font rendering hints) may vary between frames
  2. **Font rendering inconsistencies**: Browser font rendering may still produce subpixel variations even with same measurements
  3. **DevicePixelRatio handling**: The initialization effect scales context with `dpr`, but render loop also scales - potential mismatch
  4. **Export canvas differences**: The export path (captureStream) may use a different canvas context or rendering pipeline
  5. **Text baseline/alignment state**: Canvas text alignment state may not be consistently set between frames
  6. **Description word-wrapping**: Still uses `measureText()` in render loop for wrapping logic (though x position is fixed)

**Current Status:** Comprehensive fix attempted but issue persists. Text still jumps in exported videos.

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
