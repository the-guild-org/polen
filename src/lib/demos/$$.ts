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
  getDisabledDemos,
  getDisabledExamples,
  getOrderedDemos,
  isDemoExcluded,
  loadConfig,
  meetsMinimumPolenVersion,
} from './config.ts'
export { buildDemosHomeWithCatalog, buildHome, type CatalogOptions, type Options } from './ui/home.ts'
export { getDemoExamples } from './utils.ts'
