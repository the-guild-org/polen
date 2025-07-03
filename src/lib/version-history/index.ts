export * as VersionHistory from './version-history.ts'

// Re-export types at the top level for convenience
export type { DevelopmentCycle, DistTagInfo, Version, VersionCatalog } from './types.ts'

// Re-export SemVer types and utilities
export type { SemVerInput, SemVerString } from './semver.ts'
export {
  getSemVerString,
  isSemVerString,
  normalizeSemVerInput,
  SemVerSchema,
} from './semver.ts'
