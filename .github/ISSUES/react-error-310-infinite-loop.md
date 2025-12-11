# React Error #310: Infinite Loop in DenizenModalV3

## Problem Description

When clicking on an entity card to open the Denizen Modal popup, the application crashes with a React error #310, indicating an infinite loop in component rendering. The error occurs immediately upon opening the modal and prevents the application from functioning.

### Error Messages

1. **Primary Error**: `Uncaught Error: Minified React error #310`
   - This error indicates that React detected an infinite loop, typically caused by:
     - A `useEffect` hook that updates state, which triggers a re-render, which triggers the `useEffect` again
     - A component that renders infinitely due to unstable dependencies or callback functions
     - State updates during render that cause cascading re-renders

2. **Secondary Error**: `Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')`
   - This error appears in `share-modal.js:1:135`
   - May be a symptom of the infinite loop causing components to unmount/remount unexpectedly

### User Impact

- **Critical**: The application becomes completely unusable when attempting to view entity details
- The modal popup cannot be opened
- The entire application may freeze or crash
- Error appears in both development and production environments

## Expected Behavior

The Denizen Modal should:
1. Open smoothly when clicking on an entity card
2. Display the entity's details, media, and parameter visualizations
3. Allow interaction with the modal (close, edit, download, navigate between media)
4. Not trigger any infinite loops or React errors

## Current Implementation

The Denizen Modal (`DenizenModalV3`) was recently enhanced to support multiple media per entity, including:
- Floating background cards for additional media
- Particle tendril connections between cards
- Media navigation (prev/next buttons)
- Canvas-based export functionality

### Component Architecture

The modal consists of several interconnected components:
1. **DenizenModalV3** - Main modal component
2. **FloatingMediaCards** - Renders additional media as floating background cards
3. **MediaTendrilCanvas** - Draws animated particle connections between cards
4. **DenizenCardCanvas** - Canvas-based rendering for exports

## Root Cause Analysis

### Initial Hypothesis

The infinite loop was suspected to be caused by:
1. **Unstable callback functions**: `handleFloatingCardRef` being recreated on each render
2. **useEffect dependencies**: Effects depending on arrays or objects that change reference on each render
3. **Ref callback loops**: `FloatingCard` components calling `onCardRef` callback, which triggers state updates, causing re-renders

### Attempted Fixes

#### Fix Attempt #1: Stabilize `handleFloatingCardRef` Callback
**Commit**: `c8cdbb5`
- **Approach**: Used `useCallback` with empty dependency array for `handleFloatingCardRef`
- **Rationale**: Prevent the callback from being recreated on each render
- **Result**: ❌ **Failed** - Error persists

#### Fix Attempt #2: Fix `FloatingCard` Ref Notification
**Commit**: `c8cdbb5`
- **Approach**: Modified `FloatingCard`'s `useEffect` to only depend on `mediaIdx`, not `onCardRef`
- **Rationale**: Prevent the effect from re-running when `onCardRef` changes
- **Implementation**:
  - Store `onCardRef` in a ref (`onCardRefRef`)
  - Update the ref in a separate effect
  - Notification effect only depends on `mediaIdx`
- **Result**: ❌ **Failed** - Error persists

### Current State

Despite the fixes, the error continues to occur. The instrumentation logs show:
- Component renders are happening
- `useEffect` hooks are executing
- Callbacks are being called

However, the exact trigger point for the infinite loop has not been definitively identified.

## Relevant Files

### Primary Components
- `src/components/constellation/DenizenModalV3.tsx`
  - Main modal component (lines 37-2051)
  - `handleFloatingCardRef` callback (lines 803-823)
  - `allMedia` state management (lines 57-114)
  - Ref management (lines 789-801)

- `src/components/constellation/FloatingMediaCards.tsx`
  - Floating card component (lines 21-101)
  - `FloatingCard` sub-component (lines 104-202)
  - Ref notification logic (lines 131-156)

- `src/components/constellation/MediaTendrilCanvas.tsx`
  - Particle tendril rendering
  - Animation loop (lines 92-180)
  - Tendril initialization (lines 44-91)

### State Management
- `allMedia`: Array of `DenizenMedia` objects
- `currentMediaIndex`: Index of currently displayed media
- `floatingCardRefs`: Array of refs to floating card DOM elements
- `allMediaRef` / `currentMediaIndexRef`: Refs to avoid dependency issues

### Key Dependencies
- React hooks: `useState`, `useEffect`, `useRef`, `useCallback`
- Next.js: `useRouter`
- Supabase: Media fetching (`fetchDenizenMedia`)

## Technical Details

### React Error #310
According to React documentation, error #310 occurs when:
- A component renders more than 50 times in a single update cycle
- This typically indicates an infinite loop in:
  - `useEffect` hooks with incorrect dependencies
  - State updates during render
  - Unstable callback functions causing cascading re-renders

### Potential Loop Sources

1. **`allMedia` Array Reference Changes**
   - `allMedia` is set via `setAllMedia(filteredMedia)`
   - Even if contents are the same, the array reference changes
   - This could trigger effects that depend on `allMedia.length` or the array itself

2. **`handleFloatingCardRef` Callback Chain**
   - `FloatingCard` calls `onCardRefRef.current(mediaIdx, cardRefForThis)`
   - This calls `handleFloatingCardRef` in `DenizenModalV3`
   - `handleFloatingCardRef` updates `floatingCardRefs.current`
   - This might trigger a re-render, which recreates `FloatingCard` components
   - New `FloatingCard` components call `onCardRef` again → loop

3. **`MediaTendrilCanvas` Animation Loop**
   - Uses `requestAnimationFrame` for continuous animation
   - Reads from refs that might be updated during render
   - Could potentially trigger re-renders if not properly isolated

4. **`useEffect` Dependency Arrays**
   - Effects that depend on `allMedia` (array) will re-run when array reference changes
   - Effects that depend on `currentMediaIndex` might trigger when media changes
   - Cascading effects could create a loop

## Debug Information

### Instrumentation Logs
Debug instrumentation has been added to track:
- Component render frequency
- `useEffect` execution
- Callback function calls
- State updates

Logs are written to: `.cursor/debug.log`

### Key Log Points
- `DenizenModalV3.tsx:37` - Component render start
- `DenizenModalV3.tsx:69` - Media fetch effect
- `DenizenModalV3.tsx:793` - Ref update effect
- `DenizenModalV3.tsx:803` - `handleFloatingCardRef` callback
- `FloatingMediaCards.tsx:135` - `onCardRef` update effect
- `FloatingMediaCards.tsx:148` - Ref notification effect

## Next Steps

### Immediate Actions
1. **Analyze Runtime Logs**: Review `.cursor/debug.log` to identify the exact sequence of events leading to the infinite loop
2. **Isolate Components**: Temporarily disable `FloatingMediaCards` and `MediaTendrilCanvas` to see if the error persists
3. **Check for State Updates During Render**: Ensure no state is being updated directly during render (only in effects or event handlers)

### Potential Solutions

1. **Memoize `allMedia` Array**
   - Use `useMemo` to prevent array reference changes when contents are the same
   - Only create new array when media actually changes

2. **Debounce Ref Callbacks**
   - Add debouncing to `handleFloatingCardRef` to prevent rapid-fire calls
   - Use a ref to track if notification is already pending

3. **Separate Ref Management**
   - Move ref management to a separate context or custom hook
   - Isolate ref updates from component re-renders

4. **Conditional Rendering**
   - Only render `FloatingMediaCards` and `MediaTendrilCanvas` when refs are stable
   - Add guards to prevent effects from running when dependencies are not ready

5. **Refactor Architecture**
   - Consider using a state management library (Zustand, Jotai) for complex ref coordination
   - Simplify the component hierarchy to reduce interdependencies

## Related Issues

- This issue blocks the multiple media per entity feature
- Related to the canvas-based export functionality (ATL-006)
- May be related to performance issues with particle animations

## Environment

- **Framework**: Next.js 14+ (React 18+)
- **Browser**: Chrome/Edge (latest)
- **Environment**: Both development and production (Vercel)
- **Error Frequency**: 100% reproducible when opening modal with entities that have multiple media

## Additional Notes

- The error occurs specifically when entities have multiple media items
- Single-media entities may work correctly (needs verification)
- The error appears immediately upon modal open, before any user interaction
- Console shows the error before the modal UI is fully rendered

