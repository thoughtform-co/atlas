# Component Spacing Mockups

Interactive HTML mockups for testing and fine-tuning spacing before implementing changes in the React components.

## Files

- **`entity-card.html`** - Mockup of `EntityCard.tsx` component
- **`denizen-modal.html`** - Mockup of `DenizenModal.tsx` component

## Usage

1. Open the HTML files directly in your browser (no server needed)
2. Use the control panel in the top-left to adjust spacing values in real-time
3. Toggle "Show spacing guides" to visualize padding boundaries
4. When you find the perfect spacing, note the values and update the React components

## Adjustable Properties

### EntityCard (`entity-card.html`)

- **Horizontal Padding** - Left/right padding for the info overlay (default: 20px)
- **Bottom Padding** - Bottom padding for the info overlay (default: 16px)
- **Meta Row Gap** - Space between type label and coordinates (default: 16px)

### DenizenModal (`denizen-modal.html`)

- **Left Column Horizontal Padding** - Mobile/desktop padding for identity section (default: 28px / 36px)
- **Right Column Horizontal Padding** - Mobile/desktop padding for content section (default: 28px / 36px)
- **Coordinate Bar Right Margin** - Space before column divider (default: 16px)

## Design System Reference

All mockups use the design tokens from `src/app/globals.css`:

- **Minimum edge padding**: `--space-md` (16px) - Content should never feel cramped
- **Card padding**: Standard spacing scale (xs: 8px, sm: 12px, md: 16px, lg: 20px, xl: 24px, 2xl: 32px)

## Current Implementation Values

When making changes, check these locations:

### EntityCard.tsx
- Line 187: Info overlay padding (`px-5 pb-4 pt-12` = 20px / 16px / 48px)
- Line 225: Meta row gap (`gap-4` = 16px)

### DenizenModal.tsx
- Line 183: Identity section padding (`px-7 md:px-9` = 28px / 36px)
- Line 278: Content section padding (`px-7 md:px-9` = 28px / 36px)
- Line 552: Coordinate bar margin (`mr-4` = 16px)

## Tips

- Start with standard spacing values (16px, 20px, 24px) following the 8pt grid
- Use the visual guides to see exactly where padding boundaries are
- Test both mobile and desktop breakpoints (modal uses responsive padding)
- Hover effects and interactive elements are simulated in the mockups
