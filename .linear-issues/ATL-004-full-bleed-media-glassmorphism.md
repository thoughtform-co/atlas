# ATL-004: Feature: Full-Bleed Media Background with Glassmorphism UI

**Issue ID:** ATL-004  
**Title:** Feature: Full-Bleed Media Background with Glassmorphism UI on Entity Card Preview

---

## Problem

When uploading media (image/video) to the Entity Card Preview on the new-entity page:

1. Media was only displayed in the center area of the card
2. Side panels (Phase State, Latent Position, etc.) had solid black backgrounds
3. No visual cohesion between the uploaded media and the UI panels
4. The design didn't match the established pattern in `DenizenModalV3.tsx`

## Root Causes

1. Original implementation rendered media only in the center grid cell
2. Side columns and header/footer used opaque `var(--void)` backgrounds
3. No `backdrop-filter` blur effects were applied to create glass effect
4. CSS structure didn't support a full-bleed background layer

## Solution

**Full-bleed media background:**

- Media now renders as a position-absolute background layer (`inset: 0`, `z-index: 0`) covering the entire card
- Added gradient overlay for text readability: `linear-gradient(to bottom, rgba(5, 4, 3, 0.4) 0%, rgba(5, 4, 3, 0.2) 50%, rgba(5, 4, 3, 0.6) 100%)`
- Center area set to `background: transparent` so media shows through
- Particle canvas only renders when no media is present

**Glassmorphism effect on all UI panels:**

- Header, footer, left/right columns use `backdrop-filter: blur(12px)`
- Panel backgrounds set to 10% opacity (`rgba(5, 4, 3, 0.1)`)
- Readout panels use matching semi-transparent background
- Upload buttons centered with glass effect styling
- Alignment overlay (compass) has frosted glass styling with border

**Pattern consistency:**

- Matches the established visual treatment in `DenizenModalV3.tsx` (commit `aaf9aaf`)
- Uses `-webkit-backdrop-filter` for Safari compatibility

## Files Changed

- `src/components/admin/EntityCardPreview.tsx` - Full-bleed media background layer, transparent center, conditional particle canvas
- `src/components/admin/EntityCardPreview.module.css` - Glassmorphism styles, 10% opacity panels, media background classes
- `src/components/admin/MediaUploadZone.module.css` - Glass effect on compact upload buttons

## Testing

- Uploaded image to new entity page
- Verified image fills entire card as background
- Confirmed glass blur effect visible on all side panels
- Checked text remains readable with gradient overlay
- Tested video upload with same visual treatment
- Verified particle canvas only shows when no media present

## Branch

`main`

## Commits

- `[commit]` - Add glassmorphism effect to EntityCardPreview with full-bleed media background
- `[commit]` - Lower glass panel opacity to 10% for more transparent effect

## Product Learning

Visual consistency across similar components (modal views, card previews) requires explicit pattern replication. When one component establishes a successful visual treatment (full-bleed media + glassmorphism), that pattern should be documented and applied systematically to related components. The key CSS properties for this effect are `backdrop-filter: blur()` combined with low-opacity backgrounds (`0.1`) and proper `z-index` layering to ensure the blur samples from the background media layer.

Stakeholders: Frontend developers, Design system maintainers.

