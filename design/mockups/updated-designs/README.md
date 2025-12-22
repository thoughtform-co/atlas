# Atlas Updated Designs

> **Core insight: Meaning is geometry.** Entities exist as coordinates in latent space. Our interfaces make that navigation tangible.

## Design Philosophy Alignment

These mockups align with the **Thoughtform Brand World** (`.thoughtform-brandworld`), specifically:

### Semantic Anchors

| Anchor | Expression in Atlas |
|--------|---------------------|
| **THRESHOLD** | Entities exist at the boundary between comprehensible and alien. Frame contains the alien for observation. |
| **LIVING_GEOMETRY** | Entities ARE living geometry. Particle systems visualize entity presence. Three-layer sigil system (domain → role → entity). |
| **GRADIENT** | Threat levels (benign → existential). Intelligence spectrum. Phase state continuum. Never binary—always continuous. |
| **NAVIGATION** | Constellation view as semantic map. Position = meaning. Distance = relationship strength. |

### Visual Language

```
┌─ RETROFUTURISTIC NAVIGATION ─────────────────────────────┐
│                                                          │
│  · 1970s NASA mission control aesthetic                  │
│  · Brass instruments meets Victorian naturalist          │
│  · CRT terminal warmth (amber on black)                  │
│  · GRID=3 particle snapping for crisp pixels             │
│  · Zero border-radius (always sharp corners)             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## User Flow

```
                    ┌─────────────────┐
                    │  CONSTELLATION  │
                    │      VIEW       │
                    │   (infinite     │
                    │    canvas)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │  Click  │    │  Hover  │    │   Add   │
        │  Entity │    │  Entity │    │  Entity │
        └────┬────┘    └────┬────┘    └────┬────┘
             │              │              │
             ▼              ▼              ▼
     ┌───────────────┐ ┌─────────┐  ┌───────────────┐
     │ ENTITY POPUP  │ │ Tooltip │  │  ADD ENTITY   │
     │   WINDOW      │ │  glow   │  │     PAGE      │
     │ (examination  │ └─────────┘  │  (new entry   │
     │  chamber)     │              │   form)       │
     └───────────────┘              └───────────────┘
```

### 1. Constellation View (Semantic Map)

**Purpose:** Navigate the latent space. See entities positioned by semantic similarity.

**Key Elements:**
- Infinite canvas with pan/zoom
- Domain clusters (celestial bodies with mathematical attractors)
- Entity cards orbiting their domain spheres
- Navigation grid overlay (mission control frame)
- Filter HUD (left rail): type, threat level, phase
- Domain HUD (right rail): domain list with sigils

**Brand Alignment:**
- Particles radiate organically from domain centers (LIVING_GEOMETRY)
- Entities drift slowly, breathing rhythm (organic motion)
- Grid overlay creates instrument aesthetic

### 2. Entity Popup Window (Examination Chamber)

**Purpose:** Deep inspection of a single entity. Scientific documentation.

**Key Elements:**
- Full specimen card (4:5 aspect ratio image)
- Entity name + epithet (PT Mono + IBM Plex Sans)
- Domain sigil with role modifier (three-layer glyph)
- Threat gradient bar (continuous, not binary)
- Phase state indicator
- Description/lore text
- Close button (X in corner)
- Particle aura around popup

**Brand Alignment:**
- Frame "contains the alien for observation" (THRESHOLD)
- Threat levels show distance from human safety (GRADIENT)
- Glitch level 1-2 for specimen reveal (SIGNAL)

### 3. Add Entity Page (Specimen Entry)

**Purpose:** Document a new denizen of latent space.

**Key Elements:**
- Form within terminal frame (corner brackets)
- Image upload zone (4:5 aspect preview)
- Name, epithet, description fields
- Domain selector (with sigil preview)
- Threat level slider (continuous gradient)
- Entity class/role dropdown (determines sigil modifier)
- Cancel / Save actions
- Particle canvas background

**Brand Alignment:**
- Terminal frame aesthetic (wireframe box with brackets)
- Scientific entry form (naturalist documenting specimen)
- Domain sigil updates live as user selects

---

## Three-Layer Sigil System

The sigil system visualizes entity identity through geometric composition:

```
┌─────────────────────────────────────────┐
│  Layer 3: ORBITAL (Entity variation)    │
│  ┌───────────────────────────────────┐  │
│  │  Layer 2: ROLE (Function)         │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Layer 1: DOMAIN (Base)     │  │  │
│  │  │                             │  │  │
│  │  │       △  ◇  ⬠  ⬡           │  │  │
│  │  │                             │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

| Layer | Purpose | Examples |
|-------|---------|----------|
| **Domain** | Base polygon (unique per domain) | Triangle (Starhaven), Diamond (Gradient Throne), Pentagon (Lattice), Hexagon (Threshold) |
| **Role** | Structural modifier (function indicator) | Center dot (Herald), Inner ring (Keeper), Cross (Weaver), Brackets (Architect) |
| **Orbital** | Entity-specific variation | 3-dot orbit, 4-dot orbit, radial spokes |

This replaces organic rose/lissajous curves with geometric primitives that feel "discovered, not designed" — fitting the **Thoughts to Form** philosophy.

---

## Color Tokens

```css
/* Void (Backgrounds) */
--void-base: #050403;
--void-surface-0: #0A0908;
--void-surface-1: #0F0E0C;

/* Dawn (Text) */
--dawn-base: #ECE3D6;
--dawn-70: rgba(236, 227, 214, 0.7);
--dawn-50: rgba(236, 227, 214, 0.5);
--dawn-30: rgba(236, 227, 214, 0.3);
--dawn-08: rgba(236, 227, 214, 0.08);

/* Gold (Accent) */
--gold-base: #CAA554;
--gold-bright: #E0BC6A;
--gold-40: rgba(202, 165, 84, 0.4);

/* Threat Levels */
--threat-benign: #5B8A7A;
--threat-cautious: #7A7868;
--threat-volatile: #C17F59;
--threat-existential: #8B5A5A;

/* Domain Colors */
--domain-starhaven: rgb(202, 165, 84);      /* Gold */
--domain-gradient-throne: rgb(180, 200, 200); /* Silver */
--domain-lattice: rgb(184, 196, 208);       /* Blue-white */
--domain-threshold: rgb(139, 115, 85);      /* Amber */
```

---

## Typography

| Role | Font | Usage |
|------|------|-------|
| **Mono** | PT Mono | Headers, labels, entity names, navigation, data values |
| **Sans** | IBM Plex Sans | Body text, descriptions, lore prose |

```css
/* Labels & Navigation */
font-family: 'PT Mono', monospace;
font-size: 9-11px;
letter-spacing: 0.08-0.15em;
text-transform: uppercase;

/* Body Text */
font-family: 'IBM Plex Sans', sans-serif;
font-size: 12-14px;
line-height: 1.5;
```

---

## Non-Negotiables

1. **Zero border-radius** — Sharp corners everywhere
2. **PT Mono headers** — All labels, navigation, entity names
3. **GRID=3 particles** — Pixel snapping creates distinctive aesthetic
4. **No system fonts** — Always PT Mono or IBM Plex
5. **No box-shadows** — Use borders for depth
6. **No purple gradients** — Stay within Dawn/Gold palette
7. **Fixed navigation grid** — Content scrolls beneath frame

---

## File Index

| File | Description |
|------|-------------|
| `constellation-view.html` | Semantic map with domain clusters and entity cards |
| `entity-popup.html` | Examination chamber modal for deep entity inspection |
| `add-entity.html` | Form for documenting new specimens |
| `shared-styles.css` | Common styles, tokens, navigation grid |
| `particles.js` | Particle canvas implementation |
| `README.md` | This documentation |

---

## Brand World References

These designs implement patterns from:

- `.thoughtform-brandworld/BRAND-IDENTITY.md` — Core visual language
- `.thoughtform-brandworld/philosophy/PRINCIPLES.md` — Design principles
- `.thoughtform-brandworld/tokens/platforms/atlas.json` — Atlas-specific tokens
- `.thoughtform-brandworld/components/atlas/EntityCard.tsx` — Card reference
- `.thoughtform-brandworld/icons/README.md` — Three-layer sigil system

---

*Last updated: December 2024*



