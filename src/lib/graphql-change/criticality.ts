import { CriticalityLevel } from '@graphql-inspector/core'
import type { BadgeProps } from '@radix-ui/themes'
import type { Change } from './change-types.js'

export { CriticalityLevel } from '@graphql-inspector/core'

// Type guard functions
export const isCriticalityBreaking = (change: Change): boolean => change.criticality.level === CriticalityLevel.Breaking

export const isCriticalityDangerous = (change: Change): boolean =>
  change.criticality.level === CriticalityLevel.Dangerous

export const isCriticalitySafe = (change: Change): boolean => change.criticality.level === CriticalityLevel.NonBreaking

/** Ordered array for iteration (from most to least critical) */
export const CRITICALITY_LEVELS = [
  CriticalityLevel.Breaking,
  CriticalityLevel.Dangerous,
  CriticalityLevel.NonBreaking,
] as const

// Config for UI display
interface CriticalityConfig {
  color: Exclude<BadgeProps['color'], undefined>
  label: string
  shortLabel: string
}

export const CRITICALITY_CONFIG = {
  [CriticalityLevel.Breaking]: {
    color: 'red',
    label: 'Breaking Changes',
    shortLabel: 'Breaking',
  },
  [CriticalityLevel.Dangerous]: {
    color: 'yellow',
    label: 'Dangerous Changes',
    shortLabel: 'Dangerous',
  },
  [CriticalityLevel.NonBreaking]: {
    color: 'green',
    label: 'Safe Changes',
    shortLabel: 'Safe',
  },
} satisfies Record<CriticalityLevel, CriticalityConfig>
