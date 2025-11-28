# ATL-001: Fix EntityCard and DenizenModal spacing issues

## Problem

Text spacing in EntityCard and DenizenModal components was too close to borders, creating a cramped visual appearance that didn't match design specifications. Multiple attempts to fix using Tailwind's spacing scale resulted in values that were either too close or too far from the edges.

## Root Causes

1. Initial implementation used Tailwind's rem-based spacing classes which scale with root font-size
2. HTML mockups use hard pixel values that don't scale
3. Font-size differences between mockup environment and React app caused visual drift
4. Meta row was using `justify-between` which stretched content to edges
5. Approximating mockup pixel values with Tailwind's spacing scale introduced inaccuracies

## Solution

Created interactive HTML mockups to test spacing values, then converted all spacing values from Tailwind rem-based classes to hard pixel values matching the HTML mockups exactly:

**EntityCard:**
- Info overlay padding: `14px` horizontal, `16px` bottom, `48px` top
- Meta row: `8px` margin-top, `8px` padding-top, `16px` gap between type and coordinates
- Coordinates container: `4px` gap between items

**DenizenModal:**
- Identity section: `28px/36px` (mobile/desktop) horizontal, `24px` top, `32px` bottom
- Content column: `28px/36px` (mobile/desktop) horizontal, `24px/56px` top
- Coordinate bars: `8px` left margin, `16px` right margin

All values now use inline styles with hard pixel values to eliminate font-size scaling drift. The solution involved:
1. Creating interactive HTML mockups in `design/mockups/` for experimentation
2. Iteratively testing spacing values until finding the perfect balance
3. Converting all Tailwind classes to inline pixel values
4. Adding desktop breakpoint overrides via CSS media queries

## Files Changed

- `src/components/constellation/EntityCard.tsx`
- `src/components/constellation/DenizenModal.tsx`
- `design/mockups/entity-card.html` (interactive mockup)
- `design/mockups/denizen-modal.html` (interactive mockup)
- `design/mockups/README.md` (mockup documentation)

## Testing

- Created interactive HTML mockups with real-time spacing controls to test values
- Verified spacing matches mockups exactly using DevTools computed styles
- Tested on both mobile and desktop breakpoints
- Confirmed no visual drift with different font sizes
- Visual verification showed spacing matches design specifications perfectly

## Branch

`claude/setup-atlas-eidolon-01Ho1bComD939FM9h9nTzf8P`

## Commits

- `f2e2701` - Add Linear integration documentation and issue formatting guide
- `a964c23` - Convert spacing to pixel-exact values matching HTML mockups
- `bebf824` - Apply finalized spacing values from mockups: EntityCard 14px horizontal padding
- `2b8f4e4` - Add interactive HTML mockups for spacing experimentation
- `24519e5` - Fine-tune card/modal padding to balanced middle ground

## Product Learning

Framework upgrades cascade unpredictably. Spacing systems built on relative units (rem/em) create visual drift when fonts or root font-size differ between environments. The lesson: for pixel-perfect design systems, use hard pixel values in critical spacing areas, especially for UI components where visual precision matters. Mockups are the source of truth—mirror their pixel values 1:1 rather than reinterpreting them into a spacing scale. Creating interactive HTML mockups for design experimentation before implementing in code saves significant iteration time and prevents drift between design and implementation.

Stakeholders: Senior Frontend Developer with Design Systems expertise.

