# Multi-Media Entity Cards: Stacked Cards in Constellation View and Floating Cards in Modal

## Problem

We want to support multiple media items per entity (different visual manifestations of the same entity). The implementation should:

1. **Constellation View**: Additional media should appear as stacked cards behind the main entity card, with slight offsets/rotations to show depth
2. **Modal View**: Additional media should appear as floating background cards with blur effects and tendril particle connections

### Current Issues

1. **Constellation View - Stacked Cards Not Visible**: 
   - Additional media cards should be rendered behind the main card with subtle stacking effect
   - Currently, additional media cards are not appearing in the Constellation View at all
   - Expected: Multiple cards stacked with slight offsets/rotations, all showing the same entity data but different media

2. **Modal View - Media Replacement Instead of Floating**:
   - When opening the modal, additional media is either:
     - Appearing in front of the original entity card (wrong z-index)
     - Replacing the original entity card (wrong media selection logic)
   - Expected: Original media as main card, additional media as floating background cards with tendrils

## What We've Implemented

### Database & Storage
- ✅ `denizen_media` table with support for multiple media per entity
- ✅ `is_primary` flag to mark primary media
- ✅ `display_order` for media sequencing
- ✅ Storage bucket for media files (`denizen-media`)

### Upload Interface
- ✅ "Add Media" button in edit page (`src/app/admin/edit/[id]/page.tsx`)
- ✅ "Add Media" button in modal header (admin only) (`src/components/constellation/DenizenModalV3.tsx`)
- ✅ Additional media preview grid in edit page showing all non-primary media

### Media Selection Logic
- ✅ `EntityCard.tsx`: Prioritizes explicit primary media, then original `denizen.image` field
- ✅ `DenizenModalV3.tsx`: Attempts to prioritize original image field when selecting main card
- ✅ Media fetching and filtering (excludes thumbnails)

### Floating Cards Component
- ✅ `FloatingMediaCards.tsx`: Component for rendering floating background cards
- ✅ `MediaTendrilCanvas.tsx`: Particle system for tendril connections
- ✅ Blur overlay between floating cards and main card
- ✅ Staggered offsets, rotations, and opacity for depth effect

### Stacked Cards Hint
- ✅ CSS-only stacked card shadows in `EntityCard.tsx` (subtle visual hint when multiple media exist)
- ⚠️ **Not working**: Actual stacked card rendering in Constellation View

## Root Causes

### Issue 1: Stacked Cards Not Visible in Constellation View

**Problem**: Additional media cards are not being rendered in the Constellation View.

**Likely Causes**:
1. `EntityCard` component only renders a single card with the primary/original media
2. No logic to render multiple `EntityCard` instances for the same entity with different media
3. `ConstellationView` doesn't iterate through media array to create stacked cards
4. Z-index/positioning might be preventing stacked cards from being visible

**Files to Investigate**:
- `src/components/constellation/EntityCard.tsx` - Only renders one card
- `src/components/constellation/ConstellationView.tsx` - Renders denizens, but likely only one card per denizen
- `src/lib/data.ts` - How media is loaded and attached to denizens

**Expected Behavior**:
- For each denizen with multiple media, render multiple `EntityCard` components
- Position them with slight offsets (e.g., -2px, -4px for x/y)
- Apply slight rotations (e.g., -1deg, -2deg)
- Lower z-index for background cards
- All cards should show the same entity data (name, class, threat, etc.) but different media

### Issue 2: Modal Media Selection Logic

**Problem**: Additional media is replacing or appearing in front of the original card instead of behind it.

**Likely Causes**:
1. `currentMediaIndex` initialization might be selecting wrong media
2. Media matching logic for `denizen.image` field might not be working correctly
3. `allMedia` array might not include the original media if it's only in `denizen.image` field
4. Z-index ordering in modal might be incorrect

**Files to Investigate**:
- `src/components/constellation/DenizenModalV3.tsx`:
  - Lines 88-105: `loadMedia` function and primary index selection
  - Lines 277-283: `currentMedia` selection logic
  - Lines 794-813: Floating cards and tendril rendering
- `src/lib/data.ts`: How `denizen.image` field relates to `denizen.media` array

**Current Logic Flow**:
1. `loadMedia` fetches all media from `denizen_media` table
2. Tries to find primary media index
3. If no primary, tries to match `denizen.image` field
4. Falls back to index 0
5. `currentMedia` uses `allMedia[currentMediaIndex]`
6. If `allMedia` doesn't include the original media (only in `denizen.image`), it won't match

**Expected Behavior**:
- Original media (from `denizen.image` or marked as primary) should always be the main card
- Additional media should appear as floating background cards
- Floating cards should have lower z-index than main card
- Tendrils should connect main card to floating cards

## Solution Approach

### For Constellation View Stacked Cards

1. **Modify `ConstellationView.tsx`**:
   - When rendering a denizen with multiple media, create multiple `EntityCard` instances
   - For each additional media, render a card with:
     - Same entity data (name, class, threat, etc.)
     - Different media URL
     - Slight position offset (stacked behind)
     - Slight rotation
     - Lower z-index

2. **Alternative: Modify `EntityCard.tsx`**:
   - Accept optional `mediaIndex` prop
   - Render multiple cards internally if `allMedia` has multiple items
   - Position them with CSS transforms

3. **Performance Consideration**:
   - Limit stacked cards to 2-3 max to avoid performance issues
   - Use CSS transforms for positioning (GPU-accelerated)
   - Consider lazy loading for background cards

### For Modal Media Selection

1. **Ensure Original Media is in `allMedia` Array**:
   - When loading media, check if `denizen.image` exists
   - If it's not in the `denizen_media` table, create a virtual media entry
   - Or ensure the original media is always marked as primary when entity is created

2. **Fix Media Matching Logic**:
   - Improve URL matching between `denizen.image` and media storage paths
   - Handle both relative paths and full URLs
   - Account for URL encoding differences

3. **Fix Z-Index Ordering**:
   - Main card: `z-index: 40`
   - Floating cards: `z-index: 30-35`
   - Blur overlay: `z-index: 35`
   - Tendrils: `z-index: 36`

## Files Changed (So Far)

### Implemented
- `src/components/constellation/DenizenModalV3.tsx`
  - Added `allMedia` state and `currentMediaIndex` state
  - Added `handleUpload` for additional media upload
  - Integrated `FloatingMediaCards` and `MediaTendrilCanvas` components
  - Added media navigation buttons
  - Attempted to fix primary media selection (lines 88-105, 277-283)

- `src/components/constellation/FloatingMediaCards.tsx` (New)
  - Renders up to 3 floating background cards
  - Applies staggered offsets, rotations, blur, and opacity

- `src/components/constellation/MediaTendrilCanvas.tsx` (New)
  - Particle system for tendril connections
  - Connects main card to floating cards

- `src/components/constellation/EntityCard.tsx`
  - Updated media selection to prioritize original `denizen.image` field
  - Added CSS-only stacked card shadows hint (subtle visual indicator)

- `src/app/admin/edit/[id]/page.tsx`
  - Added "Add Media" button
  - Added additional media preview grid
  - Added `handleAddMedia` function

- `src/lib/media.ts`
  - `fetchDenizenMedia()` function
  - `getMediaPublicUrl()` function

### Need Investigation/Modification
- `src/components/constellation/ConstellationView.tsx`
  - Need to render multiple cards per denizen when multiple media exist
  - Need to position stacked cards with offsets/rotations

- `src/lib/data.ts`
  - Check how `denizen.image` field relates to `denizen.media` array
  - Ensure original media is included in media array or marked as primary

## Testing Checklist

### Constellation View
- [ ] Entities with multiple media show stacked cards behind main card
- [ ] Stacked cards have slight offsets (visible depth)
- [ ] Stacked cards have slight rotations
- [ ] All cards show same entity data (name, class, threat)
- [ ] Performance is acceptable with multiple stacked cards
- [ ] Cards don't overlap incorrectly

### Modal View
- [ ] Original media always appears as main card
- [ ] Additional media appears as floating background cards
- [ ] Floating cards are behind main card (correct z-index)
- [ ] Tendrils connect main card to floating cards
- [ ] Blur effect is visible between floating cards and main card
- [ ] Navigation buttons cycle through all media correctly
- [ ] Original media is selected by default when modal opens

## Related Issues

- ATL-007: Fix React Error #310 Infinite Loop (fixed ref management for floating cards)
- Previous work on multi-media feature implementation

## Next Steps

1. **Investigate Constellation View rendering**:
   - Check how `ConstellationView` renders denizens
   - Determine best approach for rendering multiple cards per denizen
   - Implement stacked card rendering with offsets/rotations

2. **Fix Modal Media Selection**:
   - Debug why original media is being replaced
   - Ensure `denizen.image` field is properly matched to media array
   - Fix z-index ordering if needed

3. **Test and Refine**:
   - Test with entities that have 2-5 media items
   - Verify performance with multiple stacked cards
   - Ensure visual hierarchy is clear (main card vs. stacked/floating cards)

## Product Learning

**Multi-Media Entity Representation**: When entities can have multiple visual manifestations, the UI needs to clearly distinguish between:
- Primary/original media (always visible, main focus)
- Additional media (supporting visuals, secondary focus)

The visual hierarchy should be:
1. **Constellation View**: Stacked cards show depth and variety without cluttering
2. **Modal View**: Floating cards with tendrils create a connected, organic feel while maintaining focus on the primary media

**Performance Considerations**: Rendering multiple cards per entity requires careful optimization:
- Limit visible stacked cards (2-3 max)
- Use CSS transforms for positioning (GPU-accelerated)
- Lazy load background cards if needed
- Consider thumbnail versions for stacked cards

