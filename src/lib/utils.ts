// Alien glyph characters
const GLYPHS = '◈◇◆○●◎⬡⬢△▽▷◁⊕⊗⊙⟐⟡⧫⧪∆∇≋≈∞⌬⌭⍟⎔⎕';

/**
 * Generate a random string of alien glyphs
 */
export function generateGlyphs(minLength = 4, maxLength = 8): string {
  const length = minLength + Math.floor(Math.random() * (maxLength - minLength + 1));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return result;
}

/**
 * Format a cardinal coordinate value for display
 */
export function formatCoordinate(value: number): string {
  return value.toFixed(3);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
