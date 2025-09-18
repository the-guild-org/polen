/**
 * AI Image Generation Service
 * Manages Pollinations.ai image generation with caching
 */

import { O } from '#dep/effect'
import { Path } from '@wollybeard/kit'
import { Data, Effect, pipe } from 'effect'
import type { GraphQLSchema } from 'graphql'
import * as FS from 'node:fs/promises'
import {
  type AiImageConfig,
  analyzeSchema,
  type ArtStyle,
  buildPrompt,
  type GeneratedImage,
} from './ai-image-generation.js'
import * as Pollinations from './providers/pollinations.js'

export interface GenerateOptions {
  config: AiImageConfig
  schema?: GraphQLSchema | undefined
  projectName?: string | undefined
  cacheDir?: string | undefined
  layout?: 'asymmetric' | 'cinematic' | 'auto' | undefined
}

/**
 * Main service for generating AI hero images
 */
export class AiImageGenerationService {
  private cacheDir: string

  constructor(cacheDir: string = 'node_modules/.vite/polen-assets/ai-images') {
    this.cacheDir = cacheDir
  }

  /**
   * Generate a hero image based on configuration and schema
   */
  generate(
    options: GenerateOptions,
  ): Effect.Effect<O.Option<GeneratedImage>, Pollinations.ImageGenerationError, never> {
    const { config, schema, projectName, layout } = options

    if (!config.enabled) {
      return Effect.succeed(O.none())
    }

    const style = config.style || 'modern'
    const width = config.width || 1200
    const height = config.height || 400
    const seed = config.seed
    const nologo = config.nologo !== false
    const shouldCache = config.cache !== false

    // Build or use custom prompt
    let prompt: string
    if (config.prompt) {
      prompt = config.prompt
    } else if (schema) {
      const context = analyzeSchema(schema)
      if (projectName) {
        context.name = projectName
      }
      prompt = buildPrompt(context, style as ArtStyle, config.prompt, layout)
    } else {
      // Fallback generic prompt
      prompt = buildPrompt(
        {
          mainTypes: [],
          queryNames: [],
          mutationNames: [],
          subscriptionNames: [],
          suggestedTheme: 'modern API',
        },
        style as ArtStyle,
        undefined,
        layout,
      )
    }

    // Skip cache for now to ensure fresh images
    // TODO: Consider adding timestamp to cache key for time-based invalidation
    // if (shouldCache) {
    //   const cached = await this.getCachedImage(prompt)
    //   if (cached) {
    //     return cached
    //   }
    // }

    // Generate image using Pollinations
    // Use provided seed or generate random one for unique images
    const finalSeed = seed || Math.floor(Math.random() * 1000000)

    return pipe(
      Pollinations.generateImage({
        prompt,
        width,
        height,
        seed: finalSeed,
        nologo,
      }),
      Effect.map(result => {
        // Skip caching for now to ensure fresh images
        // TODO: Consider adding timestamp to cache key
        // if (shouldCache) {
        //   await this.cacheImage(result)
        // }
        return O.some(result)
      }),
    )
  }

  /**
   * Get a cached image if it exists
   */
  private getCachedImage(
    prompt: string,
  ): Effect.Effect<O.Option<GeneratedImage>, never, never> {
    const self = this
    return Effect.gen(function*() {
      const cacheKey = self.getCacheKey(prompt)
      const cachePath = Path.join(self.cacheDir, `${cacheKey}.json`)

      const exists = yield* Effect.tryPromise({
        try: () => FS.access(cachePath).then(() => true),
        catch: () => false,
      })

      if (!exists) {
        return O.none()
      }

      const data = yield* Effect.tryPromise({
        try: () => FS.readFile(cachePath, 'utf-8'),
        catch: (error) => {
          console.warn('Failed to read cached image:', error)
          return null as any
        },
      })

      if (!data) return O.none()

      const cached = JSON.parse(data) as GeneratedImage
      // Return with cached flag set to true
      return O.some({
        ...cached,
        cached: true,
      })
    }).pipe(
      Effect.catchAll(() => Effect.succeed(O.none())),
    )
  }

  /**
   * Cache an image result
   */
  private cacheImage(image: GeneratedImage): Effect.Effect<void, never, never> {
    const self = this
    return Effect.gen(function*() {
      const cacheKey = self.getCacheKey(image.prompt)
      const cachePath = Path.join(self.cacheDir, `${cacheKey}.json`)

      // Ensure cache directory exists
      yield* Effect.tryPromise({
        try: () => FS.mkdir(self.cacheDir, { recursive: true }),
        catch: () => undefined,
      })

      // Write cache file
      yield* Effect.tryPromise({
        try: () => FS.writeFile(cachePath, JSON.stringify(image, null, 2)),
        catch: (error) => {
          console.warn('Failed to cache image:', error)
        },
      })
    }).pipe(
      Effect.catchAll(() => Effect.void),
    )
  }

  /**
   * Generate a cache key from prompt
   */
  private getCacheKey(prompt: string): string {
    // Create a simple hash from the prompt
    const hash = prompt
      .split('')
      .reduce((acc, char) => {
        const charCode = char.charCodeAt(0)
        return ((acc << 5) - acc) + charCode
      }, 0)
      .toString(36)
      .replace('-', 'n') // Replace negative sign

    return `hero-pollinations-${hash}`
  }

  /**
   * Clear the cache
   */
  clearCache(): Effect.Effect<void, never, never> {
    return Effect.tryPromise({
      try: () => FS.rm(this.cacheDir, { recursive: true, force: true }),
      catch: (error) => {
        console.warn('Failed to clear cache:', error)
      },
    }).pipe(
      Effect.catchAll(() => Effect.void),
    )
  }
}

// Default service instance
export const defaultService = new AiImageGenerationService()
