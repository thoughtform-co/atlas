# ATL-008: Multi-Media Entity Cards Visibility and Performance Optimization

## Problem

After implementing multi-media support for entity cards, floating cards in the modal popup were not clearly visible, and the Constellation View was rendering full EntityCard components for stacked cards, causing unnecessary resource usage. Users could not see additional media cards when clicking on entities, and the performance impact of rendering multiple full cards was a concern.

### Symptoms

- Floating cards in modal popup were obscured by the main card or positioned off-screen
- Additional media cards were not visible when clicking on entities with multiple media
- Constellation View was rendering full EntityCard components (with images/videos) for stacked cards, consuming GPU and bandwidth resources unnecessarily
- Initial implementation used blur effects which further obscured the floating cards

## Root Causes

1. **Insufficient 3D Positioning**: 
   - Floating cards were positioned too close to the main card, making them fully obscured
   - Z-axis depth (`translateZ`) was not sufficient to create visible separation
   - Cards were not scaled down, making them compete for visual space with the main card

2. **Blur Overlay Obscuring Content**:
   - Backdrop blur overlay (`blur(4px)`) was applied between floating cards and main card
   - Blur filter on floating cards themselves (`blur(8px)`) made them hard to see
   - Combined blur effects made floating cards nearly invisible

3. **Resource-Intensive Stacked Cards**:
   - Constellation View was rendering actual `EntityCard` components for stacked cards
   - Each stacked card loaded full images/videos, consuming bandwidth and GPU resources
   - Multiple full card renders per entity multiplied resource usage across the entire constellation

4. **Inadequate Visual Feedback**:
   - Users couldn't tell that additional media existed when viewing entities
   - No clear indication that clicking on floating cards would switch the main media

## Solution

### 1. Z-Axis Depth Instead of Blur

**Pattern: 3D Transform Depth for Layered UI**

Replaced blur-based depth with 3D transforms using `translateZ`:

```typescript
// ❌ BAD: Using blur to create depth
filter: 'blur(8px)',
backdropFilter: 'blur(4px)',

// ✅ GOOD: Using z-axis depth for 3D separation
transform: `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${offsetZ}px) scale(${scale}) rotate(${rotation}deg)`,
// offsetZ = -100 - (cardIdx * 50) // Push back in 3D space
// scale = 0.7 - (cardIdx * 0.1) // Scale down for depth perception
```

**Why it matters:** Blur filters obscure content and reduce visibility. 3D transforms create natural depth perception without hiding information, and enable GPU-accelerated rendering.

### 2. Optimized Floating Card Positioning

Positioned floating cards to be partially visible behind the main card:

- **Scale down**: `0.7 - (cardIdx * 0.1)` - First card at 70% size, subsequent cards smaller
- **Move left**: `offsetX = -120 - (cardIdx * 30)` - Positioned to the left of main card
- **Push back**: `offsetZ = -100 - (cardIdx * 50)` - Pushed back in 3D space
- **Move down**: `offsetY = 40 + (cardIdx * 30)` - Slightly below center
- **Enable perspective**: Added `perspective: '1000px'` to container for 3D transforms

This ensures approximately half of each floating card is visible, clearly indicating additional media exists.

### 3. CSS-Only Visual Hints for Stacked Cards

**Pattern: Visual Hints Over Full Component Rendering**

Replaced full `EntityCard` rendering with lightweight CSS-only visual hints in Constellation View:

```typescript
// ❌ BAD: Rendering full EntityCard components
{stackMedia.map((media, idx) => (
  <EntityCard
    denizen={denizen}
    activeMedia={media}
    // ... full card with image/video loading
  />
))}

// ✅ GOOD: CSS-only visual hints
{Array.from({ length: stackedLayers }).map((_, layerIdx) => (
  <div
    style={{
      border: '1px solid rgba(236, 227, 214, 0.08)',
      background: 'rgba(5, 4, 3, 0.3)',
      opacity: 0.15 - (layerIdx * 0.03),
      // No image/video loading
    }}
  />
))}
```

**Why it matters:** Visual hints provide the same user feedback (indicating multiple media exists) without loading images/videos. This reduces bandwidth usage, GPU memory, and render complexity, especially important when displaying many entities in the constellation.

### 4. Removed Blur Overlay

Completely removed the backdrop blur overlay that was obscuring floating cards:

```typescript
// ❌ BAD: Blur overlay hiding content
<div style={{ backdropFilter: 'blur(4px)' }} />

// ✅ GOOD: No overlay, rely on z-axis depth
// Removed entirely
```

## Files Changed

- `src/components/constellation/FloatingMediaCards.tsx`
  - Added `scale` prop to FloatingCard component (lines 86, 101, 122, 136)
  - Updated transform to use `translate3d` with `offsetZ` and `scale` (line 152)
  - Removed `filter: 'blur()'` from floating cards (line 160)
  - Increased opacity from `0.3` to `0.5` since no blur (line 158)
  - Updated offsets: `offsetX = -120`, `offsetY = 40`, `offsetZ = -100` (lines 84-86)
  - Added `perspective: '1000px'` to container (line 70)

- `src/components/constellation/DenizenModalV3.tsx`
  - Removed blur overlay div entirely (lines 871-883 removed)
  - Added comment explaining removal (line 871)

- `src/components/constellation/ConstellationView.tsx`
  - Replaced `EntityCard` rendering for stacked cards with CSS-only visual hints (lines 213-235)
  - Removed `stackMedia` array and `activeMedia` prop usage
  - Added lightweight `div` elements with borders/backgrounds for visual hints (lines 220-234)
  - Reduced opacity and simplified styling for performance

## Testing

- ✅ Floating cards are clearly visible behind main card in modal popup
- ✅ Approximately half of each floating card is visible, indicating additional media
- ✅ Clicking floating cards successfully switches to that media
- ✅ Constellation View shows visual hints for stacked cards without loading images/videos
- ✅ Performance improved: no unnecessary image/video loading for stacked hints
- ✅ 3D transforms work correctly with perspective enabled
- ✅ Cards scale appropriately for depth perception
- ✅ No blur effects obscuring content

## Branch

`main`

## Commits

- `cf1a650` - "fix: Use z-axis depth instead of blur for floating cards"
- `cf85fd9` - "fix: Optimize floating cards and constellation stacked cards"
- `e098308` - "fix: Update floating cards opacity and blur for better visibility"
- `2a39d05` - "fix: Improve visibility of stacked and floating media cards"

## Product Learning

**3D Depth Over Visual Effects**: When creating layered UI elements, use 3D transforms (`translateZ`, `scale`) instead of visual effects like blur. Blur filters obscure content and reduce usability, while 3D transforms create natural depth perception without hiding information. This is especially important for interactive elements like floating cards that users need to see and click.

**Performance-First Visual Feedback**: For visual indicators that don't require full content rendering (like stacked card hints), use CSS-only styling instead of full component rendering. This reduces bandwidth, GPU memory, and render complexity while providing the same user feedback. When displaying many items (like in a constellation view), this optimization compounds significantly.

**Progressive Visibility**: Position secondary UI elements (like floating cards) so they're partially visible rather than fully hidden or fully visible. This creates a clear visual hierarchy: users can see that additional content exists without it competing with the primary content. Approximately 50% visibility is a good target for "peek" elements.

Stakeholders: Frontend developers working on layered UI components and performance optimization

