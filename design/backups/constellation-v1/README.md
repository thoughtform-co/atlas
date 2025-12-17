# Constellation V1 Backup

**Date:** December 17, 2025

## Overview
This is a backup of the original constellation view before migrating to the celestial constellation design with strange attractors.

## Contents
- `page.tsx` - Main page component (src/app/page.tsx)
- `components/` - All constellation components from src/components/constellation/
  - `ConstellationView.tsx` - Main view with infinite canvas
  - `EntityCard.tsx` - Entity card component
  - `DenizenModalV3.tsx` - Modal for denizen details
  - `NavigationHUD.tsx` - Navigation and filter UI
  - `BackgroundCanvas.tsx` - Background particle effects
  - `ConnectorCanvas.tsx` - Connection lines between entities
  - `DenizenCardCanvas.tsx` - Card rendering on canvas
  - `MediaCarousel.tsx` - Media display carousel
  - `SemanticNavigator.tsx` - Semantic search navigation
  - `index.ts` - Component exports

## Restoration
To restore this version:
1. Copy `components/*` back to `src/components/constellation/`
2. Copy `page.tsx` to `src/app/page.tsx`

## Features
- Domain-based clustering with soft particle clouds
- Entity cards positioned in clusters
- Connection lines between related entities
- Infinite canvas with pan/zoom
- Filter by domain, type, allegiance
