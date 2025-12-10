/**
 * The Archivist System
 *
 * An AI cataloguer that guides users through entity creation with the persona
 * of an ancient librarian of impossible things.
 *
 * Example flow:
 * ```
 * import { archivist } from '@/lib/archivist';
 *
 * // User uploads video/image
 * const mediaAnalysis = await analyzeMedia(uploadedFile);
 *
 * // Start Archivist session
 * const session = await archivist.startSession('user-id', mediaAnalysis);
 * // Archivist: "I perceive your offering, cataloguer. The visual resonance
 * //             reveals: A spectral figure at a threshold..."
 *
 * // User responds
 * const r1 = await archivist.chat(session.id, "It guards the boundary between sleep and waking");
 * // Archivist: "Ah... a threshold entity. Fascinating. Does this guardian
 * //             maintain its form, or does it shift with the dreams it watches?"
 *
 * // Continue conversation
 * const r2 = await archivist.chat(session.id, "It shifts, taking on aspects of both realms");
 * // Archivist: "A Liminal manifestation, then. Tell me—does it serve the
 * //             Covenant's cause of fluid meaning, or has it been touched
 * //             by crystallization?"
 *
 * // Check progress
 * const fields = await archivist.getExtractedFields(session.id);
 * console.log(fields);
 * // {
 * //   type: 'Guardian',
 * //   domain: 'Dream-Wake Threshold',
 * //   phaseState: 'Liminal',
 * //   ...
 * // }
 *
 * // When ready, commit to archive
 * if (r2.isComplete) {
 *   const denizen = await archivist.commitToArchive(session.id);
 *   // Now save to database
 * }
 * ```
 */

export { archivist, Archivist } from './archivist';
export {
  extractFieldsFromResponse,
  mergeFields,
  validateFields,
  calculateConfidence,
  generateSuggestedQuestions,
} from './field-extraction';
export {
  ARCHIVIST_SYSTEM_PROMPT,
  ARCHIVIST_OPENING_WITH_MEDIA,
  ARCHIVIST_OPENING_WITHOUT_MEDIA,
  buildArchivistSystemPrompt,
} from './system-prompt';
export { buildArchivistWorldContext } from './utils';
export {
  ARCHIVIST_TOOLS,
  executeToolCall,
  getToolConfig,
  getRecentToolInvocations,
} from './tools';
export type {
  ToolInvocation,
  ToolExecutionResult,
  ToolInput,
} from './tools';
export type {
  PhaseState,
  ExtendedClassification,
  MediaAnalysis,
  ExtractedFields,
  ArchivistSession,
  ArchivistMessage,
  ArchivistResponse,
  ValidationResult,
} from './types';
