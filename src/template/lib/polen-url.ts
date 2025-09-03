import { templateConfig } from 'virtual:polen/project/config'

/**
 * Create a Polen URL path that respects the configured base path for UI navigation.
 *
 * **Warning:** When using this with raw `<a>` tags instead of React Router's Link component,
 * you lose the following benefits:
 * - Client-side navigation (faster, no page refresh)
 * - Browser history management and back/forward optimization
 * - Scroll position restoration
 * - Route preloading and prefetching
 * - Consistent navigation state management
 * - Better accessibility features (screen reader announcements)
 *
 * Consider using React Router's `Link` component with `to={polenUrlPath(...)}` for better UX.
 *
 * @param segments - Path segments to join (e.g., 'reference', 'Pokemon')
 * @returns Full URL path with base path (e.g., '/demos/pokemon/reference/Pokemon')
 *
 * @example
 * polenUrlPath('reference', 'Pokemon') // '/demos/pokemon/reference/Pokemon'
 * polenUrlPath('/reference/Pokemon') // '/demos/pokemon/reference/Pokemon'
 * polenUrlPath('reference/Pokemon#field') // '/demos/pokemon/reference/Pokemon#field'
 */
export const polenUrlPath = (...segments: string[]): string => {
  const basePath = templateConfig.build.base // e.g., '/demos/pokemon/'

  // Join segments and normalize slashes
  const path = segments
    .join('/')
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/^\//, '') // Remove leading slash

  return basePath + path
}

/**
 * Create a Polen URL path for assets.
 *
 * This is a convenience wrapper around `polenUrlPath` that automatically
 * prepends the assets root path.
 *
 * @param segments - Path segments within the assets directory
 * @returns Full URL path to the asset
 *
 * @example
 * polenUrlPathAssets('schemas', 'latest.json') // '/demos/pokemon/assets/schemas/latest.json'
 * polenUrlPathAssets('images/logo.png') // '/demos/pokemon/assets/images/logo.png'
 */
export const polenUrlPathAssets = (...segments: string[]): string => {
  return polenUrlPath(
    templateConfig.server.routes.assets,
    ...segments,
  )
}
