/**
 * Motif generator library
 * Exports the main API for generating abstract motifs
 */

export { createMotifGenerator, generateMotif } from './core/generator.ts'
export type {
  AccessibilityConfig,
  AnimationConfig,
  AnimationPattern,
  AnimationTarget,
  ColorMode,
  ColorPalette,
  CompositionConfig,
  CompositionStyle,
  EffectsConfig,
  GenerateOptions,
  HSLColor,
  Motif,
  MotifConfig,
  RegenerationConfig,
  Shape,
  ShapeConfig,
  ShapeType,
  SymmetryType,
  VariantsConfig,
} from './core/types.ts'

// Re-export commonly used utilities
export { hslToHex, hslToString } from './colors/index.ts'
export { shapeToSVG } from './shapes/index.ts'
