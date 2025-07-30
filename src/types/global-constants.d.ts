// Global build-time constants injected by Vite

/**
 * Indicates whether the code is running during a production build.
 * - `true` when running `polen build` command
 * - `false` when running `polen dev` command
 */
declare const __BUILDING__: boolean

/**
 * Convenience boolean for checking if using Static Site Generation (SSG) architecture.
 * - `true` when `__BUILD_ARCHITECTURE__ === 'ssg'`
 * - `false` otherwise
 */
declare const __BUILD_ARCHITECTURE_SSG__: boolean

/**
 * The build architecture configured for the project.
 * - `'ssg'` for Static Site Generation (default)
 * - `'ssr'` for Server-Side Rendering (future support)
 */
declare const __BUILD_ARCHITECTURE__: import('#api/config/index').Config.BuildArchitecture

/**
 * Indicates whether the code is running in development server mode.
 * - `true` when running `polen dev` command
 * - `false` when running `polen build` command
 */
declare const __SERVING__: boolean

/**
 * The raw Vite command being executed.
 * - `'build'` for production builds
 * - `'serve'` for development server
 */
declare const __COMMAND__: import('#dep/vite/index').Vite.ConfigEnv[`command`]
