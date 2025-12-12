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

- **Attempt 1 (Partial Fix)**: Header text measurements cached - issue persisted
- **Attempt 2 (Comprehensive Fix)**: All text positions pre-calculated once after fonts load, stored in `textLayoutRef` cache
  - Fixed column anchors for parameter sections
  - Right-aligned anchors for dynamic text (time, epoch)
  - No `measureText()` calls in render loop (except description word-wrapping)
  - Issue still persists: Text still jumps in exported videos despite comprehensive caching

## Investigation Needed

Possible root causes to investigate:
1. Canvas context state variations between frames (transform, font rendering hints)
2. Font rendering inconsistencies even with same measurements
3. DevicePixelRatio handling mismatch between initialization and render loop
4. Export canvas (captureStream) using different rendering pipeline
5. Text baseline/alignment state not consistently set between frames
6. Description word-wrapping still uses `measureText()` in render loop (though x position is fixed)
