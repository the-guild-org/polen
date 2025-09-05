/**
 * Pollinations.ai provider for AI image generation
 * Free service, no API key required
 */

import type { GeneratedImage } from '../ai-image-generation.js'

export interface PollinationsOptions {
  prompt: string
  width?: number
  height?: number
  seed?: number
  nologo?: boolean
}

/**
 * Generate an image using Pollinations.ai
 * This is a free service that doesn't require authentication
 */
export const generateImage = async (options: PollinationsOptions): Promise<GeneratedImage> => {
  const {
    prompt,
    width = 1200,
    height = 400,
    seed,
    nologo = true,
  } = options

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
}

/**
 * Check if the Pollinations service is available
 */
export const isAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://image.pollinations.ai/prompt/test', {
      method: 'HEAD',
    })
    return response.ok || response.status === 200
  } catch {
    return false
  }
}
