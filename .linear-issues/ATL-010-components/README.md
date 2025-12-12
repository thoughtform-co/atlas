# ATL-010 Component Files

This folder contains copies of relevant components for issue ATL-010 (Text Positioning Jumps in Video Exports).

## Files

- `DenizenCardCanvas.tsx` - Canvas-based card renderer where text positioning occurs
- `DenizenModalV3.tsx` - Modal component that triggers video exports

## Purpose

These files are copied here for easy sharing with developers working on this issue. Once the issue is resolved, this folder and its contents will be removed.

## Current State (2024-12-13)

### What's Fixed
- **Export rendering**: Canvas export now shows full UI overlay (not just background image)
- **Text jumping**: Static text layer eliminates frame-to-frame text variations
- **Visualization jumping**: Cached visualization positions prevent floating-point precision issues

### What's Still Broken
- **Parameter label positioning**: The labels for HALLUCINATION INDEX, SUPERPOSITION, EMBEDDING SIGNATURE, and MANIFOLD CURVATURE are all stacked near the top of their columns instead of being distributed across their respective sections.

## Key Areas to Investigate

1. **Static Text Layer Building**: `buildStaticTextLayer()` function in `DenizenCardCanvas.tsx`
   - Check Y coordinates for parameter section labels
   - Verify `layout.params` contains correct Y values

2. **Layout Cache Initialization**: Text layout effect that populates `textLayoutRef.current`
   - Verify Y positions are correctly calculated for each parameter label
   - Check if section heights are properly used in Y calculations

3. **Parameter Label Y Positions**: Look for these in the layout cache:
   - `phaseStateLabelY` - should be ~48 (top of left column)
   - `superpositionLabelY` - should be in middle section of left column
   - `hallucinationLabelY` - should be in bottom section of left column
   - Similar for right column labels

## Fixes Applied

### Fix 1: Remove `visibility: hidden`
```tsx
// Before (broken - browser throttles RAF for hidden elements)
<div style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }}>

// After (working)
<div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
```

### Fix 2: Add missing `spectralCenterY`
```tsx
// Added this definition in text layout initialization
const spectralCenterY = spectralY + spectralHeight / 2;
```

## Log Evidence (from debugging session)

**Before fix:**
- `staticTextBuilt: false` when export called
- Pixel sample: `[8,9,7,255]` (dark background only)

**After fix:**
- `staticTextBuilt: true` when export called  
- Pixel sample: `[27,25,15,255]` (actual UI content)
- `layoutReady: true` in text layout init
