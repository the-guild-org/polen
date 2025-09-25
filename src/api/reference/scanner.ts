import { Ef } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'
import { FileSystem } from '@effect/platform'
import { Fs, FsLoc } from '@wollybeard/kit'
import * as Catalog from './catalog.js'

export interface ScanParams {
  /**
   * The directory to scan for reference content
   */
  dir: FsLoc.AbsDir
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
  params: ScanParams,
): Ef.Effect<ScanResult, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const diagnostics: Diagnostic.Diagnostic[] = []

    // Check for index.md or index.mdx file
    const referenceDir = FsLoc.join(params.dir, 'reference/')
    const indexMdPathLoc = FsLoc.join(referenceDir, 'index.md')
    const indexMdxPathLoc = FsLoc.join(referenceDir, 'index.mdx')

    // Try index.md first, then index.mdx
    const indexPath = (yield* Fs.exists(indexMdPathLoc))
      ? indexMdPathLoc
      : (yield* Fs.exists(indexMdxPathLoc))
      ? indexMdxPathLoc
      : null

    const catalog = Catalog.make({
      index: indexPath ? { path: indexPath } : undefined,
    })

    return { catalog, diagnostics }
  })
