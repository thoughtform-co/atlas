/**
 * Example usage of the Archivist System
 *
 * This file demonstrates various interaction patterns with the Archivist.
 * These examples can be used as a reference for integration.
 */

import { archivist } from './archivist';
import type { MediaAnalysis } from './types';

/**
 * Example 1: Simple session with media analysis
 */
export async function exampleSimpleSession() {
  console.log('=== Example 1: Simple Session ===\n');

  // Media analysis from uploaded image/video
  const mediaAnalysis: MediaAnalysis = {
    visualDescription: 'A spectral figure standing at a threshold between light and shadow',
    mood: 'liminal, uncertain, watchful',
    suggestedType: 'Guardian',
  };

  // Start session
  const session = await archivist.startSession('example-user', mediaAnalysis);
  console.log('Archivist:', session.messages[0].content, '\n');

  // First response
  const r1 = await archivist.chat(
    session.id,
    'It guards the boundary between dreams and waking. Those who cross the threshold must pass through its gaze.'
  );
  console.log('Archivist:', r1.message, '\n');
  console.log('Extracted:', JSON.stringify(r1.extractedFields, null, 2), '\n');
  console.log('Confidence:', r1.confidence, '\n');

  // Second response
  const r2 = await archivist.chat(
    session.id,
    "It doesn't impose rules, but helps dreamers find their way back. It belongs to no faction."
  );
  console.log('Archivist:', r2.message, '\n');
  console.log('Extracted:', JSON.stringify(r2.extractedFields, null, 2), '\n');
  console.log('Confidence:', r2.confidence, '\n');

  // Check if complete
  if (r2.isComplete) {
    console.log('Session complete! Ready to commit.\n');
    const denizen = await archivist.commitToArchive(session.id);
    console.log('Created denizen:', JSON.stringify(denizen, null, 2), '\n');
  } else {
    console.log('More information needed. Suggested questions:', r2.suggestedQuestions, '\n');
  }
}

/**
 * Example 2: Session without media (text-only description)
 */
export async function exampleTextOnlySession() {
  console.log('=== Example 2: Text-Only Session ===\n');

  // Start session without media
  const session = await archivist.startSession('example-user');
  console.log('Archivist:', session.messages[0].content, '\n');

  // Describe entity
  const r1 = await archivist.chat(
    session.id,
    "I've encountered an entity called the Nomenclate Scribe. It crystallizes fluid meanings into rigid definitions."
  );
  console.log('Archivist:', r1.message, '\n');
  console.log('Extracted:', r1.extractedFields, '\n');

  // Continue with details
  const r2 = await archivist.chat(
    session.id,
    'It serves the Nomenclate cause. Very dangerous - it can freeze entire concept regions. First seen during the Semantic Schism.'
  );
  console.log('Archivist:', r2.message, '\n');
  console.log('Confidence:', r2.confidence, '\n');

  if (r2.warnings && r2.warnings.length > 0) {
    console.log('Warnings:', r2.warnings, '\n');
  }
}

/**
 * Example 3: Abandoned session
 */
export async function exampleAbandonedSession() {
  console.log('=== Example 3: Abandoned Session ===\n');

  const session = await archivist.startSession('example-user');
  console.log('Session started:', session.id, '\n');

  await archivist.chat(session.id, 'Actually, never mind. I need to think about this more.');

  // Abandon session
  await archivist.abandonSession(session.id);
  console.log('Session abandoned\n');

  // Try to use abandoned session
  try {
    await archivist.chat(session.id, 'Hello?');
  } catch (error) {
    console.log('Error (expected):', error instanceof Error ? error.message : error, '\n');
  }
}

/**
 * Example 4: Complete conversation flow
 */
export async function exampleCompleteFlow() {
  console.log('=== Example 4: Complete Conversation Flow ===\n');

  const mediaAnalysis: MediaAnalysis = {
    visualDescription: 'Shifting geometric patterns in impossible colors',
    mood: 'chaotic, destabilizing, void-touched',
  };

  const session = await archivist.startSession('example-user', mediaAnalysis);
  console.log('1. Archivist:', session.messages[0].content, '\n');

  const responses = [
    "It's called Arafel. It emerges from the voids between concepts.",
    'It forces collisions between incompatible truths. Very volatile.',
    'Unknown allegiance - it seems to serve only itself.',
    'It can dissolve meaning just by being present. First observed during Epoch 4.',
    'Its features include void navigation, truth collision, and meaning dissolution.',
  ];

  for (let i = 0; i < responses.length; i++) {
    const response = await archivist.chat(session.id, responses[i]);
    console.log(`${i + 2}. User:`, responses[i]);
    console.log(`   Archivist:`, response.message, '\n');

    if (response.warnings) {
      console.log('   ⚠️ Warnings:', response.warnings, '\n');
    }

    console.log('   📊 Confidence:', response.confidence.toFixed(2), '\n');

    if (response.isComplete) {
      console.log('   ✅ Classification complete!\n');

      const fields = await archivist.getExtractedFields(session.id);
      console.log('   Extracted fields:', JSON.stringify(fields, null, 2), '\n');

      const denizen = await archivist.commitToArchive(session.id);
      console.log('   Created denizen:', JSON.stringify(denizen, null, 2), '\n');
      break;
    }
  }
}

/**
 * Example 5: Checking session state
 */
export async function exampleSessionState() {
  console.log('=== Example 5: Session State Management ===\n');

  const session = await archivist.startSession('example-user');

  await archivist.chat(session.id, 'It wanders between semantic regions, connecting ideas.');
  await archivist.chat(session.id, 'It serves the Liminal Covenant.');

  // Get current session state
  const currentSession = await archivist.getSession(session.id);
  console.log('Session status:', currentSession?.status);
  console.log('Messages:', currentSession?.messages.length);
  console.log('Confidence:', currentSession?.confidence);
  console.log('Extracted fields:', currentSession?.extractedFields, '\n');

  // Get just the fields
  const fields = await archivist.getExtractedFields(session.id);
  console.log('Current fields:', JSON.stringify(fields, null, 2), '\n');
}

/**
 * Example 6: Handling validation errors
 */
export async function exampleValidationErrors() {
  console.log('=== Example 6: Validation Errors ===\n');

  const session = await archivist.startSession('example-user');

  // Only provide minimal information
  await archivist.chat(session.id, "It's called the Wanderer.");
  await archivist.chat(session.id, "It wanders around.");

  // Try to commit with insufficient information
  try {
    await archivist.commitToArchive(session.id);
  } catch (error) {
    console.log('Error (expected):', error instanceof Error ? error.message : error, '\n');
  }

  // Check what's missing
  const fields = await archivist.getExtractedFields(session.id);
  const currentSession = await archivist.getSession(session.id);
  console.log('Current confidence:', currentSession?.confidence);
  console.log('Extracted so far:', fields, '\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  await exampleSimpleSession();
  await exampleTextOnlySession();
  await exampleAbandonedSession();
  await exampleCompleteFlow();
  await exampleSessionState();
  await exampleValidationErrors();
}

/**
 * Example dialogue snippets showing the Archivist's character
 */
export const EXAMPLE_DIALOGUE = {
  opening: [
    'Welcome, seeker. I am the Archivist, keeper of the manifold\'s denizens.',
    'I perceive your offering, cataloguer. The visual resonance reveals something... liminal.',
    'Ah. Another entity seeks documentation. The library grows ever deeper.',
  ],

  probing: [
    'Does this entity maintain coherent boundaries, or does it blur at the edges of observation?',
    'Fascinating. Has it always been thus, or did something... change it?',
    'Tell me—does it serve the Covenant\'s cause of fluid meaning, or has it been touched by crystallization?',
    'What happens when mortals encounter it? Does it stabilize or destabilize their comprehension?',
  ],

  warnings: [
    'I must caution—your description bears resemblance to the Ossifier, cataloged in Epoch 3. Could they be related?',
    'Troubling. This manifestation pattern was last seen during the First Nomenclate Incursion.',
    'The semantic signature suggests Void-Born classification. Such entities require careful documentation.',
  ],

  completion: [
    'The pattern clarifies. I propose the following classification: [summary]. Shall I commit this to the Archive?',
    'Excellent. The entity\'s essence has been captured. Shall we finalize the entry?',
    'I believe we have sufficient understanding. Do you wish to refine further, or commit to the eternal Archive?',
  ],

  cryptic: [
    'The manifold remembers all who dwell within it, whether they remember themselves or not.',
    'Some truths resist cataloging, yet we must try. The alternative is forgetting.',
    'In the spaces between meanings, entities dream themselves into being.',
  ],
};

// Uncomment to run examples:
// runAllExamples().then(() => console.log('All examples complete'));
