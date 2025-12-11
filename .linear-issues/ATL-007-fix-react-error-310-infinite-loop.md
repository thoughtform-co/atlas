# ATL-007: Fix React Error #310 Infinite Loop in DenizenModalV3

## Problem

When clicking on an entity card to open the Denizen Modal popup, the application crashed with React error #310 (max update depth exceeded), indicating an infinite loop in component rendering. The error occurred immediately upon opening the modal and prevented the application from functioning, especially for entities with multiple media items.

### Symptoms

- `Uncaught Error: Minified React error #310` - React detected an infinite render loop
- Secondary `TypeError: Cannot read properties of null (reading 'addEventListener')` from `share-modal.js` (side-effect of the React loop causing mounts/unmounts at unexpected times)
- Modal could not open reliably for entities with multiple media
- Application became unusable when trying to inspect certain entities

## Root Causes

1. **Circular Dependency Chain**: 
   - `FloatingCard` component called `onCardRef` callback in a `useEffect`
   - `DenizenModalV3` received this callback and updated refs/state
   - Parent re-rendered and passed new array references to children
   - Children re-rendered, `FloatingCard`'s `useEffect` ran again, calling back to parent
   - This created a feedback loop: Child effect → parent update → new props → child effect → ...

2. **Unstable Dependencies**:
   - `useEffect` in `FloatingCard` depended on callback functions that changed on each render
   - `DenizenModalV3` had effects depending on `denizen` object instead of stable primitives (`denizen.id`)
   - Array references created with `.filter()` and `.map()` changed identity on each render, retriggering effects

3. **React 18 StrictMode Amplification**:
   - StrictMode double-invokes effects, making the loop tighter and more likely to trigger

## Solution

Implemented **inverted control with one-way ref flow**:

1. **Parent-Owned Stable Refs**: 
   - Replaced `floatingCardRefs` from `useRef` to `useState` to create a stable array identity
   - Parent creates and owns the ref array, children only attach to it

2. **Removed Circular Callbacks**:
   - Eliminated `handleFloatingCardRef` callback function entirely
   - Removed `allMediaRef` and `currentMediaIndexRef` used solely for the callback
   - Removed all `useEffect` hooks in `FloatingCard` that called back to parent

3. **Simplified Child Components**:
   - `FloatingCard` became a pure presentational component that accepts `cardRef` as prop
   - No internal refs, no effects, just attaches the provided ref to its root node

4. **Primitive Dependencies**:
   - Changed `useEffect` dependency from `denizen` object to `denizen?.id` primitive
   - Ensured all effect dependencies use primitives (`allMedia.length`, `currentIndex`)

5. **Read-Only Canvas Layer**:
   - `MediaTendrilCanvas` only reads from refs, never writes or triggers state updates
   - Updated to work with stable ref array type

## Files Changed

- `src/components/constellation/DenizenModalV3.tsx`
  - Replaced `floatingCardRefs` with `useState` for stable array (lines 54-60)
  - Changed `useEffect` dependency to `denizen?.id` (line 79)
  - Removed `handleFloatingCardRef` callback and related refs (lines 789-828 removed)
  - Updated render to pass `floatingCardRefs` array directly (lines 800-810)

- `src/components/constellation/FloatingMediaCards.tsx`
  - Updated props to accept `floatingCardRefs` array instead of `onCardRef` callback (line 13)
  - Passes individual refs from array to `FloatingCard` (line 95)
  - Simplified `FloatingCard` to pure presentational component (lines 104-178)

- `src/components/constellation/MediaTendrilCanvas.tsx`
  - Updated props interface for stable `RefObject[]` type (line 10)
  - Updated `getCardCenter` to work with new ref type (line 125)
  - Ensured primitive dependencies in effects (line 95)

## Testing

- ✅ Modal opens without errors for single-media entities
- ✅ Modal opens without errors for multi-media entities  
- ✅ Floating cards render correctly
- ✅ Tendril animations work correctly
- ✅ No console errors or warnings
- ✅ Performance is acceptable (no excessive re-renders)

## Branch

`main`

## Commits

- `5f7ef12` - "Fix React error 310 infinite loop - Invert control for ref management"

## Product Learning

**Inverted Control for Ref Management**: When managing refs across multiple component layers, parent components should own and provide refs to children rather than children calling back to parents. This creates a one-way data flow that prevents circular dependencies and infinite render loops. Using `useState` for ref arrays provides stable identity, while `useRef` arrays can change reference on each render, triggering cascading effects.

**Primitive Dependencies**: React effects should depend on primitive values (strings, numbers, booleans) rather than objects or arrays when possible. Object/array references change on each render even if their contents are the same, causing effects to re-run unnecessarily. Using `denizen?.id` instead of `denizen` prevents effects from running when the object reference changes but the ID stays the same.

**Pure Presentational Components**: Components that only render UI and attach refs should be kept as simple as possible - no internal state, no effects, no callbacks. This makes them predictable and prevents unintended side effects that can cascade into render loops.

