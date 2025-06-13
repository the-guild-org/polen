/**
 * Helper functions for generating asset URLs that respect the base path configuration.
 */

/**
 * Join a base path with an asset path, handling leading/trailing slashes correctly.
 */
export const joinPaths = (base: string, path: string): string => {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith(`/`) ? path.slice(1) : path
  // Base already has trailing slash by validation
  return base + cleanPath
}

/**
 * Create an asset URL from a path, respecting the base configuration.
 */
export const assetUrl = (path: string, base: string): string => {
  return joinPaths(base, path)
}

/**
 * Create a favicon URL from a path, respecting the base configuration.
 */
export const faviconUrl = (path: string, base: string): string => {
  return assetUrl(path, base)
}

/**
 * Create a page URL from a path, respecting the base configuration.
 */
export const pageUrl = (path: string, base: string): string => {
  // For pages, we want to ensure no double slashes
  if (path === `/` || path === ``) {
    return base
  }
  return joinPaths(base, path)
}