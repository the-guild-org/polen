import { Diagnostic } from '#lib/diagnostic/$'
import { FileSystem } from '@effect/platform'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import * as Catalog from './catalog.js'

export interface ScanOptions {
  /**
   * The directory to scan for reference content
   */
  dir: string
}

export interface ScanResult {
  /**
   * The reference catalog with index metadata
   */
  catalog: Catalog.Catalog
  /**
   * Any diagnostics generated during scanning
   */
  diagnostics: Diagnostic.Diagnostic[]
}

/**
 * Scan for reference documentation content.
 * Currently looks for index.md or index.mdx files for custom landing pages.
 */
export const scan = (
  options: ScanOptions,
): Effect.Effect<ScanResult, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    const diagnostics: Diagnostic.Diagnostic[] = []

    // Check for index.md or index.mdx file
    const indexMdPath = Path.join(options.dir, 'reference', 'index.md')
    const indexMdxPath = Path.join(options.dir, 'reference', 'index.mdx')

    // Try index.md first, then index.mdx
    const indexPath = (yield* fs.exists(indexMdPath))
      ? indexMdPath
      : (yield* fs.exists(indexMdxPath))
      ? indexMdxPath
      : null

    const catalog = Catalog.make({
      index: indexPath ? { path: indexPath } : undefined,
    })

    return { catalog, diagnostics }
  })
