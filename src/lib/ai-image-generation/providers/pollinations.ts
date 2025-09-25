/**
 * Pollinations.ai provider for AI image generation
 * Free service, no API key required
 */

import { Ef } from '#dep/effect'
import { Data } from 'effect'
import type { GeneratedImage } from '../ai-image-generation.js'

export interface PollinationsOptions {
  prompt: string
  width?: number
  height?: number
  seed?: number
  nologo?: boolean
}

// Custom error types
export class ImageGenerationError extends Data.TaggedError('ImageGenerationError')<{
  readonly prompt: string
  readonly reason: string
}> {}

export class ServiceUnavailableError extends Data.TaggedError('ServiceUnavailableError')<{
  readonly service: string
  readonly error?: unknown
}> {}

export type PollinationsError = ImageGenerationError | ServiceUnavailableError

/**
 * Generate an image using Pollinations.ai
 * This is a free service that doesn't require authentication
 */
export const generateImage = (
  options: PollinationsOptions,
): Ef.Effect<GeneratedImage, ImageGenerationError, never> =>
  Ef.gen(function*() {
    const {
      prompt,
      width = 1200,
      height = 400,
      seed,
      nologo = true,
    } = options

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      return yield* Ef.fail(
        new ImageGenerationError({
          prompt,
          reason: 'Prompt cannot be empty',
        }),
      )
    }

    // Build the URL with query parameters
    const params = new URLSearchParams({
      prompt,
      width: width.toString(),
      height: height.toString(),
      nologo: nologo.toString(),
    })

    if (seed !== undefined) {
      params.append('seed', seed.toString())
    }

    // Pollinations.ai URL format
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`

    // The URL itself is the image endpoint - no need to fetch
    // Pollinations generates the image on-demand when the URL is accessed
    return {
      url,
      prompt,
      cached: false,
    }
  })

/**
 * Check if the Pollinations service is available
 */
export const isAvailable = (): Ef.Effect<boolean, ServiceUnavailableError, never> =>
  Ef.gen(function*() {
    const result = yield* Ef.tryPromise({
      try: () =>
        fetch('https://image.pollinations.ai/prompt/test', {
          method: 'HEAD',
        }),
      catch: (error) =>
        new ServiceUnavailableError({
          service: 'Pollinations.ai',
          error,
        }),
    })

    return result.ok || result.status === 200
  })
