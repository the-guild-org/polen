import { Catalog } from '#lib/catalog/$'
import { Version } from '#lib/version/$'
import type { AnalyzeOptions } from './analyze-options.js'
import { analyzeSchema } from './analyze-schema.js'
import type { StabilityMetrics, VersionStatistics } from './data.js'
import type { Report } from './report.js'

/**
 * Analyze a GraphQL catalog and generate comprehensive statistics.
 */
export const analyzeCatalog = (catalog: Catalog.Catalog, options: AnalyzeOptions = {}): Report => {
  const versions: VersionStatistics[] = []
  const revisionDates: string[] = []

  // Process based on catalog type
  const processResult = Catalog.fold(
    // Versioned catalog
    (versioned) => {
      for (const entry of Catalog.Versioned.getAll(versioned)) {
        const versionId = Version.encodeSync(entry.version)
        // Analyze the schema definition for this version
        // Use the first revision date if available
        const firstRevisionDate = entry.revisions[0]?.date
        const stats = analyzeSchema(entry.definition, versionId, firstRevisionDate, options)
        versions.push(stats)

        // Collect all revision dates for this version
        for (const revision of entry.revisions) {
          revisionDates.push(revision.date)
        }
      }
    },
    // Unversioned catalog
    (unversioned) => {
      // For unversioned, we analyze the single schema definition
      // Using the latest revision date as the version identifier
      if (unversioned.schema.revisions && unversioned.schema.revisions.length > 0) {
        const latestRevisionDate = unversioned.schema.revisions[unversioned.schema.revisions.length - 1]!.date
        const stats = analyzeSchema(unversioned.schema.definition, latestRevisionDate, latestRevisionDate, options)
        versions.push(stats)

        // Collect all revision dates
        for (const revision of unversioned.schema.revisions) {
          revisionDates.push(revision.date)
        }
      } else {
        // Single schema without revisions
        versions.push(analyzeSchema(unversioned.schema.definition, 'current', undefined, options))
      }
    },
  )

  processResult(catalog)

  // Calculate stability metrics
  const stability = calculateStabilityMetrics(versions, revisionDates)

  // Get current version (first in array since sorted newest first)
  const current = versions[0]

  return {
    stability,
    versions,
    ...(current ? { current } : {}),
  }
}

/**
 * Calculate stability metrics from revision history.
 */
const calculateStabilityMetrics = (
  versions: VersionStatistics[],
  revisionDates?: string[],
): StabilityMetrics => {
  const totalRevisions = versions.length

  if (totalRevisions === 0) {
    return { totalRevisions: 0 }
  }

  // Parse dates if available
  const dates = revisionDates?.map(d => new Date(d).getTime()).filter(d => !isNaN(d)) ?? []

  // Build metrics object with all properties at once
  let firstRevisionDate: string | undefined
  let lastRevisionDate: string | undefined
  let averageRevisionInterval: number | undefined
  let averageRevisionsPerDay: number | undefined
  let churnRate: number | undefined
  let rating: 'high' | 'medium' | 'low' | undefined

  if (dates.length >= 2) {
    // Sort dates
    dates.sort((a, b) => a - b)

    const firstDate = dates[0]!
    const lastDate = dates[dates.length - 1]!
    const totalDuration = lastDate - firstDate

    firstRevisionDate = new Date(firstDate).toISOString()
    lastRevisionDate = new Date(lastDate).toISOString()

    // Calculate average interval between revisions
    if (dates.length > 1) {
      let totalIntervals = 0
      for (let i = 1; i < dates.length; i++) {
        totalIntervals += dates[i]! - dates[i - 1]!
      }
      averageRevisionInterval = totalIntervals / (dates.length - 1)
    }

    // Calculate average revisions per day
    if (totalDuration > 0) {
      const daysElapsed = totalDuration / (1000 * 60 * 60 * 24)
      averageRevisionsPerDay = totalRevisions / daysElapsed
    }
  }

  // Calculate churn rate (simplified - comparing consecutive versions)
  if (versions.length >= 2) {
    let totalChanges = 0
    for (let i = 1; i < versions.length; i++) {
      const prev = versions[i - 1]!
      const curr = versions[i]!

      // Simple change detection based on counts
      const typeChanges = Math.abs(curr.totalTypes - prev.totalTypes)
      const fieldChanges = Math.abs(curr.totalFields - prev.totalFields)
      const argChanges = Math.abs(curr.totalArguments - prev.totalArguments)

      totalChanges += typeChanges + fieldChanges + argChanges
    }

    // Average changes per version as percentage of schema size
    const avgSchemaSize = versions.reduce((sum, v) => sum + v.totalTypes + v.totalFields + v.totalArguments, 0)
      / versions.length
    churnRate = avgSchemaSize > 0 ? (totalChanges / (versions.length - 1)) / avgSchemaSize * 100 : 0

    // Determine stability rating based on churn rate
    if (churnRate < 5) {
      rating = 'high'
    } else if (churnRate < 15) {
      rating = 'medium'
    } else {
      rating = 'low'
    }
  }

  return {
    totalRevisions,
    ...(firstRevisionDate ? { firstRevisionDate } : {}),
    ...(lastRevisionDate ? { lastRevisionDate } : {}),
    ...(averageRevisionInterval !== undefined ? { averageRevisionInterval } : {}),
    ...(averageRevisionsPerDay !== undefined ? { averageRevisionsPerDay } : {}),
    ...(churnRate !== undefined ? { churnRate } : {}),
    ...(rating ? { rating } : {}),
  }
}
