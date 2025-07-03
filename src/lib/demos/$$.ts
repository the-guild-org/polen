/**
 * Public API for the demos library
 */

// Export functions directly
export {
  build,
  buildCurrentCycle,
  buildMultipleVersions,
  // Temporary backward compatibility
  demoBuilder,
  deploy,
  updateBasePathsInFiles,
} from './builder.ts'
export type { DemoOptions } from './config-options.ts'
export {
  type DemoConfig,
  getDeploymentPath,
  getDisabledExamples,
  getOrderedDemos,
  isDemoExcluded,
  loadConfig,
  meetsMinimumPolenVersion,
} from './config.ts'
export { type BuildableVersions, getBuildableVersions, getBuildableVersionsAsMatrix } from './get-buildable-versions.ts'
export { type BuildConfig, buildHome } from './ui/home.ts'
export { getDemoExamples } from './utils.ts'
