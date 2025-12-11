# ATL-005: Fix EntityCard video display when thumbnail missing

## Problem

Video entities in the Atlas constellation view showed broken images instead of displaying the video content. The card was attempting to render a `.mp4` URL using Next.js's `<Image>` component, which only supports image formats.

## Root Causes

1. `denizen.thumbnail` was `undefined` in the database - thumbnails weren't being persisted during entity creation
2. EntityCard's fallback logic passed video URLs to `<Image>` component when no thumbnail existed
3. Next.js `<Image>` component silently fails when given non-image URLs, showing broken image icon

## Solution

Implemented explicit media type handling with graceful fallback chain:

```typescript
// For videos: use thumbnail if available, otherwise render video element
const imageUrl = isVideo ? thumbnailUrl : rawMediaUrl;
const shouldRenderVideo = isVideo && !thumbnailUrl && rawMediaUrl;

{shouldRenderVideo ? (
  <video src={rawMediaUrl} autoPlay muted loop playsInline />
) : imageUrl ? (
  <Image src={imageUrl} />
) : (
  <Placeholder />
)}
```

- Videos with thumbnails → Display thumbnail image
- Videos without thumbnails → Render `<video>` element with autoplay/muted
- Images → Display with `<Image>` component
- No media → Show placeholder

## Files Changed

- `src/components/constellation/EntityCard.tsx` - Added video element fallback rendering

## Testing

- Debug instrumentation traced media URL resolution flow
- Confirmed `denizen.thumbnail` was `undefined` in database
- Verified video now plays in card preview when no thumbnail exists
- Tested that cards with thumbnails still display images correctly

## Branch

`main`

## Commits

- `8007b77` - debug: Add instrumentation for thumbnail issue, remove edit button from card
- `ed2e20c` - fix: EntityCard renders video when no thumbnail exists
- `8b15250` - chore: Remove debug instrumentation after fix verification
- `9951d75` - docs: Add Media Type Handling section to sentinel

## Product Learning

Media components have specific format requirements that fail silently. When displaying user-uploaded media, always implement explicit fallback chains that handle: (1) expected format available, (2) alternative format available, (3) no media available. The `<Image>` component cannot render videos, and the `<video>` element cannot render images - never assume a media URL will match your component's requirements.

Added new section to `.sentinel.md` documenting Media Type Handling patterns to prevent this class of bugs.

