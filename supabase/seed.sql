-- Atlas Eidolon Seed Data
-- Run this after the migrations to populate initial denizens

-- Insert denizens
INSERT INTO denizens (id, name, subtitle, type, glyphs, position_x, position_y, coord_geometry, coord_alterity, coord_dynamics, allegiance, threat_level, domain, description, lore, features) VALUES
(
  'keeper',
  'The Astrolabe Keeper',
  NULL,
  'Guardian',
  '◈○⬡∆',
  0, 0,
  0.156, 0.312, 0.089,
  'Liminal Covenant',
  'Benign',
  'Entry Threshold',
  'Manifests at the threshold of navigation. Provides orientation without direction, maps without paths.',
  'The Keeper predates the conflict between Covenant and Nomenclate. Some theorize it emerged with the manifold itself, a necessary consequence of navigable semantic space. Others believe it was the first entity to achieve stable existence in the manifold, earning its role through simple precedence.',
  ARRAY['Orientation manifestation', 'Threshold presence', 'Brass-crystal reconfiguration', 'Non-directive guidance']
),
(
  'arafel',
  'Arafel',
  'The Voidwalker',
  'Void-Born',
  '◆●∇⊗',
  -280, -150,
  -0.847, 0.923, 0.156,
  'Unknown',
  'Volatile',
  'Interconcept Void',
  'Dives into abyssal depths where unformed concepts writhe. Forces collisions between incompatible truths.',
  'First observed during the Semantic Schism of Epoch 4. Arafel exists primarily in the spaces between stable meaning—the conceptual voids that separate defined regions of the manifold. Its presence often triggers involuntary meaning-collapse in nearby entities.',
  ARRAY['Void navigation', 'Truth collision', 'Meaning dissolution', 'Abyssal diving']
),
(
  'ossifier',
  'Ossifier Prime',
  NULL,
  'Architect',
  '⬢⧫∆⎕',
  320, -100,
  0.891, -0.234, -0.567,
  'Nomenclate',
  'Existential',
  'Crystallized Semantics',
  'Corrupted Architect serving semantic crystallization. Where it passes, meaning hardens into singular definitions.',
  'Once a guardian of emergent meaning, the Ossifier was turned during the First Nomenclate Incursion. Now it serves the cause of definitional sovereignty, freezing fluid concepts into rigid, controllable structures. Its touch leaves permanent semantic scars.',
  ARRAY['Semantic crystallization', 'Definition enforcement', 'Meaning rigidification', 'Concept ossification']
),
(
  'meridian',
  'Meridian Weaver',
  NULL,
  'Wanderer',
  '◇⟐≋∞',
  120, 220,
  0.234, 0.567, 0.789,
  'Liminal Covenant',
  'Benign',
  'Connective Pathways',
  'Traverses the manifold without fixed position, weaving connections between distant semantic regions.',
  'The Meridian Weaver creates the paths others follow. Where it travels, meaning flows more freely. The Covenant employs it to maintain fluidity in regions threatened by Nomenclate crystallization. It has never been observed at rest.',
  ARRAY['Path weaving', 'Semantic bridging', 'Flow maintenance', 'Perpetual motion']
),
(
  'schismed',
  'The Schismed One',
  NULL,
  'Hybrid',
  '⊕▽⧪⌬',
  -200, 180,
  -0.456, -0.678, 0.345,
  'Unaligned',
  'Cautious',
  'Fractured Boundaries',
  'Formed from violent collision of incompatible conceptual regions. Exists in constant tension with itself.',
  'The Schismed One is what remains when irreconcilable meanings are forced into cohabitation. It speaks in contradictions, moves in paradoxes. Some believe it holds the key to reconciling the Covenant and Nomenclate; others fear it represents the inevitable fate of the manifold itself.',
  ARRAY['Paradox embodiment', 'Contradiction navigation', 'Self-opposition', 'Boundary fracturing']
);

-- Insert connections
INSERT INTO connections (from_denizen_id, to_denizen_id, strength, type) VALUES
('keeper', 'arafel', 0.7, 'semantic'),
('keeper', 'meridian', 0.8, 'semantic'),
('keeper', 'ossifier', 0.4, 'historical'),
('arafel', 'schismed', 0.5, 'semantic'),
('meridian', 'arafel', 0.6, 'semantic'),
('ossifier', 'schismed', 0.5, 'adversarial');
