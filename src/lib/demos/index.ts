/**
 * Public API for the demos library
 */

export { demoBuilder } from './builder.ts'
export type { DemoConfigData } from './config-schema.ts'
export { DemoConfig, getDemoConfig, resetDemoConfig } from './config.ts'
export { buildDemosHome, buildDemosHomeWithCatalog, type CatalogOptions, type Options } from './ui/landing-page.ts'
export { getDemoExamples } from './utils.ts'
