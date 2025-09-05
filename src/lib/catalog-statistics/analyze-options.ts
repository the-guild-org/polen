/**
 * Options for analyzing GraphQL schemas.
 */
export interface AnalyzeOptions {
  /**
   * Whether to ignore deprecated fields/types in statistics.
   * @default false
   */
  ignoreDeprecated?: boolean
  /**
   * Whether to include detailed type breakdown.
   * @default false
   */
  includeTypeBreakdown?: boolean
}
