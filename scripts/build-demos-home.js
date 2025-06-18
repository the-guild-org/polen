#!/usr/bin/env node
/**
 * Legacy entry point for build-demos-home
 *
 * This file has been refactored and moved to .github/lib/demos/ui/
 * This wrapper exists for backwards compatibility during the transition.
 */
import { buildDemosHome } from '../src/lib/demos/ui/landing-page.ts'
// Re-export the main function and types for backwards compatibility
export { buildDemosHome }
// If this file is run directly, delegate to the new implementation
if (import.meta.url === `file://${process.argv[1]}`) {
  console.warn(
    '⚠️  WARNING: This script has moved to src/lib/demos/ui/landing-page.ts',
  )
  console.warn('⚠️  Please update your references to use the new location.')
  console.warn('⚠️  This wrapper will be removed in a future version.')
  // Import and run the new implementation
  const { buildDemosHome } = await import(
    '../src/lib/demos/ui/landing-page.ts'
  )
  // Parse command line arguments and run
  try {
    // Simple argument parsing for backwards compatibility
    const args = process.argv.slice(2)
    const options = {}
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i]?.replace(/^--/, '')
      const value = args[i + 1]
      if (key && value) {
        switch (key) {
          case 'basePath':
            options.basePath = value
            break
          case 'prNumber':
            options.prNumber = value
            break
          case 'currentSha':
            options.currentSha = value
            break
          case 'mode':
            options.mode = value
            break
          case 'prDeployments':
            options.prDeployments = value
            break
          case 'trunkDeployments':
            options.trunkDeployments = value
            break
          case 'distTags':
            options.distTags = value
            break
          case 'serve':
            options.serve = value === 'true'
            break
        }
      }
    }
    await buildDemosHome(options)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}
// # sourceMappingURL=build-demos-home.js.map
