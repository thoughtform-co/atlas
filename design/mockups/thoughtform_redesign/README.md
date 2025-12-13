# Thoughtform Navigation Cockpit

A scroll-driven "cockpit" experience where users navigate through latent space, encountering distinct particle landmarks at each section.

## Concept

The website is a **navigation console** traveling through AI's latent space (like a wormhole). A fixed HUD frame stays on screen while the background scrolls through a dark, spacey environment with 4 distinct particle landmarks appearing as you approach each section.

```
┌─────────────────────────────────────────────────────────────────┐
│  // NAVIGATION CONSOLE              ◆ SECTOR: MANIFESTO        │
│  ┌─────┐                                          ┌─────┐      │
│  │DEPTH│    ╔═══════════════════════════════╗     │BEAR │      │
│  │2.4km│    ║                               ║     │045° │      │
│  │     │    ║    [PARTICLE LANDMARK]        ║     │     │      │
│  │VECTR│    ║    (zooms in as you scroll)   ║     │SIGNL│      │
│  │Creat│    ║                               ║     │Strng│      │
│  │     │    ╚═══════════════════════════════╝     │     │      │
│  └─────┘                                          └─────┘      │
│  LAT: 47.38°   [━━━━●━━━━━━━]   LONG: 8.54°                    │
└─────────────────────────────────────────────────────────────────┘
```

## The 4 Particle Landmarks

| Section | Landmark | Visual |
|---------|----------|--------|
| Hero | **Terrain Mesh** | Isometric topological grid (gold) |
| Manifesto | **Smith Chart** | Polar coordinate system with spiral data |
| Services | **Tunnel Grid** | Perspective grid receding to vanishing point |
| Contact | **Event Horizon** | Gravitational ring with particles being pulled in |

## Scroll Behavior (Star Atlas style)

As you scroll towards a section:
1. **Far away**: Landmark is small (scale 0.1), invisible
2. **Approaching**: Scales up, fades in
3. **At section**: Full size, full opacity
4. **Passing**: Zooms past (scale 1.5), fades out

## HUD Data Updates

The cockpit readouts change based on your position:
- **Sector**: Current section name
- **Depth**: Distance traveled (km)
- **Vector**: Direction (Entry, Creative, Strategic, Destination)
- **Bearing**: Compass heading
- **Status**: Current state
- **Coordinates**: Slowly drift as you scroll

## Files

```
thoughtform_redesign/
├── index.html      # HUD frame + section content
├── styles.css      # HUD styles, terminal frames, layout
├── particles.js    # Wormhole bg + 4 landmark visualizations
├── animations.js   # GSAP scroll triggers + HUD binding
└── README.md       # This file
```

## Stack

- **GSAP 3.12 + ScrollTrigger** - Scroll-driven animations
- **Lenis** - Smooth scrolling
- **Canvas API** - All particle visualizations
- **PP Mondwest** - Display font

## Usage

Open `index.html` in browser. All dependencies load from CDN.

## Inspired By

- [Star Atlas](https://experience.staratlas.com/) - Parallax zoom, orbital rings
- [Hello Monday](https://www.hellomonday.com/work/staratlas) - The agency that built Star Atlas
- Retrofuturistic navigation interfaces, cockpit HUDs
