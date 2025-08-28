import { Catalog } from '#lib/catalog/$'
import { DateOnly } from '#lib/date-only/$'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'

// ============================================================================
// Layout Mode
// ============================================================================

export type LayoutMode = 'uniform' | 'temporal'

// New revision address (replacing the old Address type)
export interface RevisionAddress {
  readonly _tag: 'RevisionAddress'
  readonly schema: Schema.Versioned.Versioned
  readonly revision: Revision.Revision
}

// New version-only address
export interface VersionAddress {
  readonly _tag: 'VersionAddress'
  readonly schema: Schema.Versioned.Versioned
}

// Union type for both address types
export type Address = RevisionAddress | VersionAddress

// Helper constructors
export const RevisionAddress = {
  make: (schema: Schema.Versioned.Versioned, revision: Revision.Revision): RevisionAddress => ({
    _tag: 'RevisionAddress',
    schema,
    revision,
  }),
}

export const VersionAddress = {
  make: (schema: Schema.Versioned.Versioned): VersionAddress => ({
    _tag: 'VersionAddress',
    schema,
  }),
}

export interface RevisionClickEvent {
  address: RevisionAddress
}

export interface Dimensions {
  global: { fontSize: number }
  layout: { marginLeft: number; marginTop: number; marginBottom: number }
  track: { gap: number }
  node: { width: number; gap: number }
  versionLabel: { marginBottom: number }
  temporal: {
    pixelsPerDay: number
    /**
     * Minimum gap between nodes to ensure readability
     */
    minGap: number
  }
}

export const calculateNodePosition = (params: {
  address: RevisionAddress
  dimensions: Dimensions
  catalog: Catalog.Versioned.Versioned
  layoutMode?: LayoutMode
}): { x: number; y: number } => {
  const { address, dimensions, catalog, layoutMode = 'uniform' } = params

  // Find the track index for this schema
  const schemaIndex = catalog.entries.findIndex(schema =>
    schema === address.schema || (
      address.schema._tag === 'SchemaVersioned'
      && Version.equivalence(schema.version, address.schema.version)
    )
  )

  if (schemaIndex === -1) {
    throw new Error('Schema not found in catalog entries')
  }

  const x = dimensions.layout.marginLeft + schemaIndex * dimensions.track.gap

  // Default uniform layout
  const revisionIndex = address.schema.revisions.findIndex(rev => rev.date === address.revision.date)

  if (revisionIndex === -1) {
    throw new Error('Revision not found in schema revisions')
  }

  const y = layoutMode === 'temporal'
    ? calculateNodePositionYTemporially({ address, dimensions, catalog })
    : dimensions.layout.marginTop + revisionIndex * dimensions.node.gap

  return { x, y }
}

/**
 * Calculate temporal position for a revision based on actual date differences
 */
const calculateNodePositionYTemporially = (params: {
  address: RevisionAddress
  dimensions: Dimensions
  catalog: Catalog.Versioned.Versioned
}): number => {
  const { address, dimensions, catalog } = params
  const temporal = dimensions.temporal!

  // Find the earliest and latest dates across all catalog entries
  let earliestDate: DateOnly.DateOnly | null = null
  let latestDate: DateOnly.DateOnly | null = null

  for (const entry of catalog.entries) {
    if (entry.revisions.length > 0) {
      const oldestRevision = entry.revisions[entry.revisions.length - 1]! // Oldest is last
      const newestRevision = entry.revisions[0]! // Newest is first

      if (!earliestDate || DateOnly.lessThan(oldestRevision.date, earliestDate)) {
        earliestDate = oldestRevision.date
      }

      if (!latestDate || DateOnly.greaterThan(newestRevision.date, latestDate)) {
        latestDate = newestRevision.date
      }
    }
  }

  if (!earliestDate || !latestDate) {
    throw new Error('No revisions found in catalog')
  }

  // Calculate total date range
  const totalDays = DateOnly.getDaysBetween(earliestDate, latestDate)

  // Calculate days from earliest date to this revision
  const daysSinceEarliest = DateOnly.getDaysBetween(earliestDate, address.revision.date)

  // Invert the Y position: newest at top, oldest at bottom
  // We subtract from the total height to flip the axis
  const totalHeight = totalDays * temporal.pixelsPerDay
  let y = dimensions.layout.marginTop + (totalHeight - (daysSinceEarliest * temporal.pixelsPerDay))

  // Ensure minimum gap between nodes in the same track
  // Find next revision in same schema (since we're inverted, next in array is older/lower on screen)
  const revisionIndex = address.schema.revisions.findIndex(rev => rev.date === address.revision.date)
  if (revisionIndex < address.schema.revisions.length - 1) {
    const nextRevision = address.schema.revisions[revisionIndex + 1]! // Next in array is older
    const nextDaysSinceEarliest = DateOnly.getDaysBetween(earliestDate, nextRevision.date)
    const nextY = dimensions.layout.marginTop + (totalHeight - (nextDaysSinceEarliest * temporal.pixelsPerDay))

    // If too close to the older revision below, apply minimum gap
    const minY = nextY - temporal.minGap
    if (y > minY) {
      y = minY
    }
  }

  return y
}

/**
 * Calculate the total height needed for temporal layout
 */
export const calculateTemporalHeight = (params: {
  catalog: Catalog.Versioned.Versioned
  dimensions: Dimensions
}): number => {
  const { catalog, dimensions } = params
  const temporal = dimensions.temporal

  if (!temporal) {
    return 0
  }

  // Find the earliest and latest dates across all catalog entries
  let earliestDate: DateOnly.DateOnly | null = null
  let latestDate: DateOnly.DateOnly | null = null

  for (const entry of catalog.entries) {
    if (entry.revisions.length > 0) {
      const firstRevision = entry.revisions[entry.revisions.length - 1]! // Oldest is last
      const lastRevision = entry.revisions[0]! // Newest is first

      if (!earliestDate || DateOnly.lessThan(firstRevision.date, earliestDate)) {
        earliestDate = firstRevision.date
      }

      if (!latestDate || DateOnly.greaterThan(lastRevision.date, latestDate)) {
        latestDate = lastRevision.date
      }
    }
  }

  if (!earliestDate || !latestDate) {
    return dimensions.layout.marginTop + dimensions.layout.marginBottom
  }

  // Calculate total days span
  const totalDays = DateOnly.getDaysBetween(earliestDate, latestDate)

  // Calculate height based on temporal scale
  const contentHeight = totalDays * temporal.pixelsPerDay

  return dimensions.layout.marginTop + contentHeight + dimensions.layout.marginBottom
}
