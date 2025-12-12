# ATL-010 Component Files

This folder contains copies of relevant components for issue ATL-010 (Text Positioning Jumps in Video Exports).

## Files

- `DenizenCardCanvas.tsx` - Canvas-based card renderer where text positioning occurs
- `DenizenModalV3.tsx` - Modal component that triggers video exports

## Purpose

These files are copied here for easy sharing with developers working on this issue. Once the issue is resolved, this folder and its contents will be removed.

## Key Areas to Investigate

1. **Text Measurement Caching**: Lines ~440-456 in `DenizenCardCanvas.tsx` - Header text positioning
2. **Parameter Text Rendering**: Lines ~458-495 in `DenizenCardCanvas.tsx` - Parameter labels and values
3. **Render Loop**: Lines ~350-380 in `DenizenCardCanvas.tsx` - Main animation loop
4. **Export Trigger**: Lines ~565-580 in `DenizenModalV3.tsx` - Video export function

## Current State

- Partial fix applied: Header text measurements are cached
- Issue persists: Parameter text (PHASE STATE, LATENT POSITION, etc.) still jumps
- Need to investigate: All text measurements should be cached, not just header
