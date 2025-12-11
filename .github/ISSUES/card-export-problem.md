# Card Export Issue: Exported Images/Videos Don't Match Display

## Problem Description

When exporting entity cards as PNG images or MP4/WebM videos from the Denizen Modal popup, the exported files do not accurately represent what is displayed on screen. The exported content has visual discrepancies including:

1. **Misplaced UI Elements**: Parameter panels, text, and animated elements (scan line, particle visualizations) appear in incorrect positions or are missing entirely
2. **Incorrect Visual Appearance**: The exported card does not match the exact visual presentation shown in the popup modal
3. **Layout Issues**: Elements that are properly positioned and layered in the browser view are not preserved correctly in the export

## Expected Behavior

The exported PNG image or video file should be a **pixel-perfect representation** of the card as it appears in the popup modal, including:

- Full-bleed video background (or thumbnail for PNG) with correct aspect ratio
- All UI elements (parameter panels, text, coordinates) in their exact positions
- All animations (scan line, particle visualizations, waveforms) captured correctly
- Exact same margins, borders, and spacing as displayed
- No additional borders or unwanted background elements
- Glassmorphism effects and transparency preserved correctly

## Current Implementation

The export functionality is currently implemented using:

- **PNG Export**: `html2canvas` library to capture the card element, with manual video frame extraction for video entities
- **Video Export**: `MediaRecorder` API with `canvas.captureStream()`, manually drawing video frames and using `html2canvas` to capture UI elements separately, then compositing them together

## Relevant Files

### Primary Implementation
- `src/components/constellation/DenizenModalV3.tsx`
  - `handleExportPNG()` function (lines ~196-394)
  - `handleExportVideo()` function (lines ~396-641)
  - Card structure and styling (lines ~650-750)

### Related Components
- `src/components/constellation/EntityCard.tsx` - Card preview component (for reference on card structure)
- `src/components/admin/MediaUploadZone.tsx` - Video thumbnail extraction logic

### Dependencies
- `html2canvas` - Used for DOM-to-canvas conversion
- `MediaRecorder` API - Used for video recording

## Technical Context

### Card Structure
The card is a 4:5 aspect ratio element with:
- Full-bleed video/image background
- Semi-transparent parameter panels (left and right columns) with glassmorphism effect
- Header with coordinates and action buttons
- Footer with entity information
- Animated scan line effect
- Particle visualizations and data graphs

### Current Approach Issues
1. **Video Capture**: `html2canvas` cannot reliably capture `<video>` elements, requiring manual frame extraction and compositing
2. **Element Positioning**: The compositing process may not preserve exact positioning of UI elements
3. **Transparency Handling**: Glassmorphism effects and transparent backgrounds may not be captured correctly
4. **Animation Capture**: Animated elements (scan line, particles) may not be captured at the correct frame or position

## User Requirements

The user has explicitly requested:
- Exported files should look **exactly** like the card in the popup window
- No black borders or extra margins
- Full-bleed media (video or image) should be visible
- All UI elements and animations should be preserved
- Aspect ratio and dimensions should match exactly

## Additional Notes

- The card uses `position: absolute` for media background and various UI elements
- The card has a 1px border: `border: '1px solid rgba(236, 227, 214, 0.08)'`
- Background color is `#050403`
- Parameter panels use `rgba(5, 4, 3, 0.03)` for glassmorphism effect
- Video element has `crossOrigin="anonymous"` set to handle CORS

## Debug Information

Debug logging is currently active in the export functions and can be found in:
- `.cursor/debug.log` - Contains runtime logs of export operations

