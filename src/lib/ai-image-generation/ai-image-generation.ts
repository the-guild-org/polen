import * as S from 'effect/Schema'
import type { GraphQLSchema } from 'graphql'

// ============================================================================
// Schemas & Types
// ============================================================================

/**
 * Art style preferences for generated images
 */
export const ArtStyle = S.Literal(
  'modern',
  'minimalist',
  'abstract',
  'technical',
  'vibrant',
  'professional',
  'futuristic',
  'gradient',
  'geometric',
  'illustration',
)
export type ArtStyle = typeof ArtStyle.Type

/**
 * Configuration for AI image generation using Pollinations
 */
export const AiImageConfig = S.Struct({
  /**
   * Enable AI hero image generation
   * @default false
   */
  enabled: S.Boolean,
  /**
   * Custom prompt override (if not provided, will generate from schema)
   */
  prompt: S.optional(S.String),
  /**
   * Art style for the generated image
   * @default 'modern'
   */
  style: S.optional(ArtStyle),
  /**
   * Image dimensions
   */
  width: S.optional(S.Number),
  height: S.optional(S.Number),
  /**
   * Random seed for reproducible generation
   */
  seed: S.optional(S.Number),
  /**
   * Whether to include Pollinations logo
   * @default false
   */
  nologo: S.optional(S.Boolean),
  /**
   * Whether to cache generated images
   * @default true
   */
  cache: S.optional(S.Boolean),
})

export type AiImageConfig = typeof AiImageConfig.Type

/**
 * Result of image generation
 */
export const GeneratedImage = S.Struct({
  url: S.String,
  prompt: S.String,
  cached: S.Boolean,
})

export type GeneratedImage = typeof GeneratedImage.Type

// ============================================================================
// Schema Context Extraction
// ============================================================================

export interface SchemaContext {
  name?: string | undefined
  description?: string | undefined
  mainTypes: string[]
  queryNames: string[]
  mutationNames: string[]
  subscriptionNames: string[]
  domain?: string | undefined // e.g., 'e-commerce', 'social', 'analytics'
  suggestedTheme?: string | undefined // e.g., 'data visualization', 'connectivity', 'growth'
  topics?: string[] | undefined // Custom or inferred topics
}

/**
 * Analyzes a GraphQL schema to extract contextual information for image generation
 */
export const analyzeSchema = (schema: GraphQLSchema): SchemaContext => {
  const typeMap = schema.getTypeMap()
  const queryType = schema.getQueryType()
  const mutationType = schema.getMutationType()
  const subscriptionType = schema.getSubscriptionType()

  // Extract main types (excluding built-ins)
  const mainTypes = Object.keys(typeMap)
    .filter(name => !name.startsWith('__') && !['Query', 'Mutation', 'Subscription'].includes(name))
    .slice(0, 10) // Limit to most important types

  // Extract operation names
  const queryNames = queryType
    ? Object.keys(queryType.getFields()).slice(0, 5)
    : []

  const mutationNames = mutationType
    ? Object.keys(mutationType.getFields()).slice(0, 5)
    : []

  const subscriptionNames = subscriptionType
    ? Object.keys(subscriptionType.getFields()).slice(0, 5)
    : []

  // Infer domain from type/operation names
  const allNames = [...mainTypes, ...queryNames, ...mutationNames].join(' ').toLowerCase()

  let domain: string | undefined
  let suggestedTheme: string | undefined

  if (allNames.includes('product') || allNames.includes('cart') || allNames.includes('order')) {
    domain = 'e-commerce'
    suggestedTheme = 'digital marketplace'
  } else if (allNames.includes('user') || allNames.includes('post') || allNames.includes('comment')) {
    domain = 'social'
    suggestedTheme = 'connected network'
  } else if (allNames.includes('metric') || allNames.includes('report') || allNames.includes('dashboard')) {
    domain = 'analytics'
    suggestedTheme = 'data visualization'
  } else if (allNames.includes('pokemon') || allNames.includes('game')) {
    domain = 'gaming'
    suggestedTheme = 'digital adventure'
  }

  return {
    mainTypes,
    queryNames,
    mutationNames,
    subscriptionNames,
    domain,
    suggestedTheme,
  }
}

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Default topics for each domain
 */
const DEFAULT_TOPICS_BY_DOMAIN: Record<string, string[]> = {
  'e-commerce': ['transactions', 'style', 'markets', 'trade', 'living'],
  'social': ['community', 'connections', 'sharing', 'communication', 'networks'],
  'analytics': ['data', 'insights', 'metrics', 'visualization', 'trends'],
  'gaming': ['adventure', 'competition', 'strategy', 'fantasy', 'achievement'],
  'technology': ['innovation', 'connectivity', 'automation', 'digital', 'future'],
}

/**
 * Builds an image generation prompt from schema context and configuration
 */
export const buildPrompt = (
  context: SchemaContext,
  style: ArtStyle = 'modern',
  customPrompt?: string,
  layout?: 'asymmetric' | 'cinematic' | 'auto',
): string => {
  // If custom prompt provided, use it with style suffix and ensure no text
  if (customPrompt) {
    return `${customPrompt}, ${getStyleDescription(style)}, no text, no words, no letters, no typography`
  }

  // Build automatic prompt from context
  const theme = context.suggestedTheme || 'modern API'
  const domain = context.domain || 'technology'

  // Create a descriptive prompt based on the schema analysis
  let prompt = layout === 'asymmetric'
    ? `Floating ${theme} illustration for a GraphQL API, no text, no words, no letters, isolated graphic element, clean edges, no background, white space around subject, perfect for placing alongside typography`
    : `Abstract ${theme} hero banner for a GraphQL API, no text, no words, no letters`

  // Use topics if provided, otherwise fall back to domain defaults
  const topics = context.topics || DEFAULT_TOPICS_BY_DOMAIN[domain] || DEFAULT_TOPICS_BY_DOMAIN['technology']
  
  // Add topics to the prompt
  if (topics && topics.length > 0) {
    prompt += `, all about ${topics.join(', ')}`
  }

  // Add style description
  prompt += `, ${getStyleDescription(style)}`

  // Add technical specifications and reinforce no text
  prompt += ', high quality, absolutely no text or typography or letters or words'

  return prompt
}

/**
 * Gets a description for the art style
 */
const getStyleDescription = (style: ArtStyle): string => {
  const styleMap: Record<ArtStyle, string> = {
    modern: 'modern clean design with subtle gradients',
    minimalist: 'minimalist flat design with simple shapes',
    abstract: 'abstract artistic representation',
    technical: 'technical blueprint style with grid patterns',
    vibrant: 'vibrant colors and dynamic composition',
    professional: 'professional corporate style',
    futuristic: 'futuristic sci-fi aesthetic with neon accents',
    gradient: 'smooth gradient mesh with flowing colors',
    geometric: 'geometric patterns and angular shapes',
    illustration: 'vector illustration style with clean lines, suitable for placement on backgrounds',
  }

  return styleMap[style]
}

// ============================================================================
// Exports
// ============================================================================

export const make = AiImageConfig.make
export const decode = S.decode(AiImageConfig)
export const encode = S.encode(AiImageConfig)
