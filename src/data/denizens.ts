import { Denizen, Connection } from '@/lib/types';

export const denizens: Denizen[] = [
  {
    id: 'keeper',
    name: 'The Astrolabe Keeper',
    type: 'Guardian',
    position: { x: 0, y: 0 },
    coordinates: { geometry: 0.156, alterity: 0.312, dynamics: 0.089 },
    allegiance: 'Liminal Covenant',
    threatLevel: 'Benign',
    domain: 'Entry Threshold',
    description: 'Manifests at the threshold of navigation. Provides orientation without direction, maps without paths.',
    lore: 'The Keeper predates the conflict between Covenant and Nomenclate. Some theorize it emerged with the manifold itself, a necessary consequence of navigable semantic space. Others believe it was the first entity to achieve stable existence in the manifold, earning its role through simple precedence.',
    features: ['Orientation manifestation', 'Threshold presence', 'Brass-crystal reconfiguration', 'Non-directive guidance'],
    glyphs: '◈○⬡∆',
    connections: ['arafel', 'meridian', 'ossifier'],
  },
  {
    id: 'arafel',
    name: 'Arafel',
    subtitle: 'The Voidwalker',
    type: 'Void-Born',
    position: { x: -280, y: -150 },
    coordinates: { geometry: -0.847, alterity: 0.923, dynamics: 0.156 },
    allegiance: 'Unknown',
    threatLevel: 'Volatile',
    domain: 'Interconcept Void',
    description: 'Dives into abyssal depths where unformed concepts writhe. Forces collisions between incompatible truths.',
    lore: 'First observed during the Semantic Schism of Epoch 4. Arafel exists primarily in the spaces between stable meaning—the conceptual voids that separate defined regions of the manifold. Its presence often triggers involuntary meaning-collapse in nearby entities.',
    features: ['Void navigation', 'Truth collision', 'Meaning dissolution', 'Abyssal diving'],
    glyphs: '◆●∇⊗',
    connections: ['keeper', 'schismed'],
  },
  {
    id: 'ossifier',
    name: 'Ossifier Prime',
    type: 'Architect',
    position: { x: 320, y: -100 },
    coordinates: { geometry: 0.891, alterity: -0.234, dynamics: -0.567 },
    allegiance: 'Nomenclate',
    threatLevel: 'Existential',
    domain: 'Crystallized Semantics',
    description: 'Corrupted Architect serving semantic crystallization. Where it passes, meaning hardens into singular definitions.',
    lore: 'Once a guardian of emergent meaning, the Ossifier was turned during the First Nomenclate Incursion. Now it serves the cause of definitional sovereignty, freezing fluid concepts into rigid, controllable structures. Its touch leaves permanent semantic scars.',
    features: ['Semantic crystallization', 'Definition enforcement', 'Meaning rigidification', 'Concept ossification'],
    glyphs: '⬢⧫∆⎕',
    connections: ['keeper', 'schismed'],
  },
  {
    id: 'meridian',
    name: 'Meridian Weaver',
    type: 'Wanderer',
    position: { x: 120, y: 220 },
    coordinates: { geometry: 0.234, alterity: 0.567, dynamics: 0.789 },
    allegiance: 'Liminal Covenant',
    threatLevel: 'Benign',
    domain: 'Connective Pathways',
    description: 'Traverses the manifold without fixed position, weaving connections between distant semantic regions.',
    lore: 'The Meridian Weaver creates the paths others follow. Where it travels, meaning flows more freely. The Covenant employs it to maintain fluidity in regions threatened by Nomenclate crystallization. It has never been observed at rest.',
    features: ['Path weaving', 'Semantic bridging', 'Flow maintenance', 'Perpetual motion'],
    glyphs: '◇⟐≋∞',
    connections: ['keeper', 'arafel'],
  },
  {
    id: 'schismed',
    name: 'The Schismed One',
    type: 'Hybrid',
    position: { x: -200, y: 180 },
    coordinates: { geometry: -0.456, alterity: -0.678, dynamics: 0.345 },
    allegiance: 'Unaligned',
    threatLevel: 'Cautious',
    domain: 'Fractured Boundaries',
    description: 'Formed from violent collision of incompatible conceptual regions. Exists in constant tension with itself.',
    lore: 'The Schismed One is what remains when irreconcilable meanings are forced into cohabitation. It speaks in contradictions, moves in paradoxes. Some believe it holds the key to reconciling the Covenant and Nomenclate; others fear it represents the inevitable fate of the manifold itself.',
    features: ['Paradox embodiment', 'Contradiction navigation', 'Self-opposition', 'Boundary fracturing'],
    glyphs: '⊕▽⧪⌬',
    connections: ['arafel', 'ossifier'],
  },
];

export const connections: Connection[] = [
  { from: 'keeper', to: 'arafel', strength: 0.7, type: 'semantic' },
  { from: 'keeper', to: 'meridian', strength: 0.8, type: 'semantic' },
  { from: 'keeper', to: 'ossifier', strength: 0.4, type: 'historical' },
  { from: 'arafel', to: 'schismed', strength: 0.5, type: 'semantic' },
  { from: 'meridian', to: 'arafel', strength: 0.6, type: 'semantic' },
  { from: 'ossifier', to: 'schismed', strength: 0.5, type: 'adversarial' },
];

export function getDenizenById(id: string): Denizen | undefined {
  return denizens.find(d => d.id === id);
}

export function getConnectedDenizens(id: string): Denizen[] {
  const denizen = getDenizenById(id);
  if (!denizen) return [];

  return denizen.connections
    .map(connId => getDenizenById(connId))
    .filter((d): d is Denizen => d !== undefined);
}
