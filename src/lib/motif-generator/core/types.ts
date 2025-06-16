/**
 * Core type definitions for the Motif Generator
 */

// ============================================================================
// Color Types
// ============================================================================

/**
 * Represents a color in HSL format
 */
export interface HSLColor {
  h: number // Hue: 0-360
  s: number // Saturation: 0-100
  l: number // Lightness: 0-100
  a?: number // Alpha: 0-1
}

/**
 * Color mode options
 */
export type ColorMode = 'any' | 'monochrome' | 'grayscale' | 'duotone' | 'analogous' | 'complementary' | 'triadic'

/**
 * Color palette configuration
 */
export interface ColorPalette {
  mode: ColorMode
  /**
   * Anchor hues to use as reference points (0-360)
   * The generator will create variations around these
   */
  anchors?: number[]
  /**
   * Saturation range (0-100)
   */
  saturation?: [number, number]
  /**
   * Lightness range (0-100)
   */
  lightness?: [number, number]
  /**
   * Whether to generate colors suitable for dark backgrounds
   */
  darkMode?: boolean
}

// ============================================================================
// Shape Types
// ============================================================================

/**
 * Basic shape primitives
 */
export type ShapeType = 'circle' | 'rectangle' | 'polygon' | 'ellipse' | 'star' | 'bezier' | 'line' | 'path'

/**
 * Shape configuration
 */
export interface ShapeConfig {
  /**
   * 0 = only right angles, 1 = only curves
   */
  curves: number
  /**
   * Number of points for polygonal shapes
   * Single number = exact, tuple = range, Infinity = no limit
   */
  points: number | [number, number]
}

/**
 * Ring-based generation configuration
 */
export interface RingBasedConfig {
  /**
   * Enable ring-based generation (5 overlapping rings)
   */
  enabled: boolean
  /**
   * Base stroke width or range [min, max]
   */
  strokeWidth: number | [number, number]
  /**
   * Deformation percentage (0 = perfect circles, 1 = highly deformed)
   */
  deformation: number
}

/**
 * Line-based generation configuration
 */
export interface LineBasedConfig {
  /**
   * Enable line-based generation instead of shape-based
   */
  enabled: boolean
  /**
   * Number of continuous lines to generate (1-5)
   */
  lineCount: number
  /**
   * Base line thickness
   */
  thickness: number
  /**
   * Thickness variation (0 = uniform, 1 = highly variable)
   */
  thicknessVariation: number
  /**
   * How often the line changes direction (0 = never, 1 = constantly)
   */
  turnFrequency: number
  /**
   * Range of turn angles in degrees [min, max]
   */
  turnAngles: [number, number]
  /**
   * Prefer smooth curves over sharp corners (0 = sharp, 1 = smooth)
   */
  smoothness: number
  /**
   * Path complexity (0 = simple, 1 = intricate)
   */
  complexity: number
  /**
   * Whether to fill enclosed spaces
   */
  fillEnclosed: boolean
}

/**
 * Individual shape instance
 */
export interface Shape {
  type: ShapeType | 'ring'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: HSLColor
  opacity: number
  // Additional properties based on type
  properties: Record<string, any>
}

// ============================================================================
// Animation Types
// ============================================================================

/**
 * Animation intensity patterns
 */
export type AnimationPattern = 'wave' | 'tide' | 'stream' | 'pulse' | 'float' | 'morph' | 'rotate' | null

/**
 * What property to animate
 */
export type AnimationTarget = 'color' | 'shape' | 'opacity' | 'position' | 'scale' | 'rotation'

/**
 * Animation configuration
 */
export interface AnimationConfig {
  pattern: AnimationPattern
  targets: AnimationTarget[]
  /**
   * Duration of one animation cycle in seconds
   */
  duration?: number
  /**
   * Easing function
   */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier'
  /**
   * Whether to respect prefers-reduced-motion
   */
  respectReducedMotion?: boolean
}

// ============================================================================
// Composition Types
// ============================================================================

/**
 * Symmetry options for composition
 */
export type SymmetryType = 'none' | 'horizontal' | 'vertical' | 'radial' | 'bilateral' | 'rotational'

/**
 * Overall composition style
 */
export type CompositionStyle =
  | 'geometric'
  | 'organic'
  | 'abstract'
  | 'minimal'
  | 'constellation'
  | 'grid'
  | 'mandala'
  | 'flow'
  | 'crystalline'

/**
 * Composition configuration
 */
export interface CompositionConfig {
  /**
   * How packed with shapes (0=sparse, 1=dense)
   */
  density: number
  /**
   * How much shapes overlap (0=none, 1=heavy)
   */
  overlap: number
  /**
   * Type of symmetry to apply
   */
  symmetry: SymmetryType
  /**
   * Number of visual layers (1-5)
   */
  layers: number
  /**
   * Overall style
   */
  style: CompositionStyle
}

// ============================================================================
// Effects Types
// ============================================================================

/**
 * Visual effects configuration
 */
export interface EffectsConfig {
  /**
   * Texture/noise overlay intensity (0-1)
   */
  grain: number
  /**
   * Blur amount (0-1)
   */
  blur: number
  /**
   * Enable glow effect
   */
  glow: boolean
  /**
   * Enable drop shadows
   */
  shadows: boolean
}

// ============================================================================
// Regeneration Types
// ============================================================================

/**
 * When to regenerate the motif
 */
export type RegenerationTrigger = 'refresh' | 'daily' | 'never'

/**
 * Regeneration configuration
 */
export interface RegenerationConfig {
  /**
   * When to generate a new motif
   */
  onChange: RegenerationTrigger
  /**
   * Manual seed override (defaults to auto-generated)
   */
  seed?: string
  /**
   * Save historical versions
   */
  persist: boolean
  /**
   * Maximum number of saved versions
   */
  historyLimit?: number
  /**
   * Directory to save history (defaults to .polen/generated)
   */
  historyPath?: string
}

// ============================================================================
// Variant Types
// ============================================================================

/**
 * Size variant configuration
 */
export interface SizeVariant {
  width: number
  height: number
  /**
   * Simplify design for small sizes
   */
  simplified?: boolean
}

/**
 * Output variants configuration
 */
export interface VariantsConfig {
  favicon?: {
    sizes: number[]
    /**
     * Use simplified design for small sizes
     */
    simplified: boolean
  }
  logo?: {
    sizes: Record<string, number>
    /**
     * Generate different designs per size
     */
    responsive: boolean
  }
}

// ============================================================================
// Accessibility Types
// ============================================================================

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /**
   * Force high contrast colors
   */
  highContrast: boolean
  /**
   * Respect prefers-reduced-motion
   */
  reduceMotion: boolean
  /**
   * Avoid problematic color combinations
   */
  colorBlindSafe: boolean
}

// ============================================================================
// Main Configuration
// ============================================================================

/**
 * Complete motif generator configuration
 */
export interface MotifConfig {
  /**
   * Color palette configuration
   */
  colors?: Partial<ColorPalette>
  /**
   * Shape generation rules
   */
  shapes?: Partial<ShapeConfig>
  /**
   * Ring-based generation configuration
   */
  rings?: Partial<RingBasedConfig>
  /**
   * Line-based generation configuration
   */
  lineBased?: Partial<LineBasedConfig>
  /**
   * Animation configuration
   */
  animations?: Partial<AnimationConfig>
  /**
   * Composition rules
   */
  composition?: Partial<CompositionConfig>
  /**
   * Visual effects
   */
  effects?: Partial<EffectsConfig>
  /**
   * Regeneration behavior
   */
  regeneration?: Partial<RegenerationConfig>
  /**
   * Size variants
   */
  variants?: Partial<VariantsConfig>
  /**
   * Accessibility options
   */
  accessibility?: Partial<AccessibilityConfig>
}

/**
 * Generated motif output
 */
export interface Motif {
  /**
   * SVG string
   */
  svg: string
  /**
   * CSS animations (if any)
   */
  css?: string
  /**
   * Metadata about the generation
   */
  metadata: {
    seed: string
    timestamp: number
    config: MotifConfig
    shapes: Shape[]
  }
}

/**
 * Options for generating a motif
 */
export interface GenerateOptions {
  /**
   * Target size
   */
  size: number
  /**
   * Whether this is for dark mode
   */
  darkMode?: boolean
  /**
   * Override configuration
   */
  config?: Partial<MotifConfig>
  /**
   * Specific seed to use
   */
  seed?: string
}
