import { Op, S } from '#dep/effect'
import { FsLoc, Str } from '@wollybeard/kit'
import { ParseResult } from 'effect'
import type * as _ from 'effect/SchemaAST'

// ============================================================================
// CONSTANTS
// ============================================================================

const CONVENTIONS = {
  index: {
    name: `index`,
  },
  numberedPrefix: {
    pattern: Str.pattern<{ groups: [`order`, `name`] }>(/^(?<order>\d+)[_-](?<name>.+)$/),
  },
} as const

// ============================================================================
// SCHEMA AND TYPE
// ============================================================================

export class RouteLogical extends S.Class<RouteLogical>('RouteLogical')({
  path: FsLoc.Path.Abs,
  order: S.optional(S.Number),
}) {
  static is = S.is(RouteLogical)

  /**
   * Schema for transforming from FsLoc.RelFile to RouteLogical.
   * Handles:
   * - Stripping numbered prefixes from file names (e.g., "01_intro.md" -> "intro")
   * - Stripping numbered prefixes from directory segments
   * - Index file handling (index.md represents its parent directory)
   */
  static FromRelFile = S.transformOrFail(
    FsLoc.RelFile,
    RouteLogical,
    {
      decode: (relFile) => {
        // Get the file name without extension
        const fileName = FsLoc.name(relFile)

        // Get directory segments from the relative file
        const dirPath = FsLoc.toDir(relFile)
        const dirSegments = dirPath.path.segments

        // Process directory segments to remove numbered prefixes
        const processedDirSegments = dirSegments.map(parseSegment)

        // Parse file name for numbered prefix and process
        const { order, name: processedFileName } = parseNumberedPrefix(fileName)

        // Strip file extension
        const nameWithoutExt = processedFileName.replace(/\.[^.]+$/, '')

        // Build logical path segments
        // Index files represent their parent directory
        const segments = nameWithoutExt === CONVENTIONS.index.name
          ? processedDirSegments
          : [...processedDirSegments, nameWithoutExt]

        return ParseResult.succeed(RouteLogical.make({
          path: FsLoc.Path.Abs.make({ segments }),
          order,
        }))
      },
      encode: (route) => {
        // This is lossy - we can't reconstruct the original file path
        // with numbered prefixes and file extensions
        return ParseResult.fail(
          new ParseResult.Type(
            RouteLogical.ast,
            route,
            'Cannot encode RouteLogical back to RelFile - information is lost',
          ),
        )
      },
    },
  )

  /**
   * Schema for transforming between string and RouteLogical.
   * Composes RelFile.String with FromRelFile.
   */
  static String = S.compose(
    FsLoc.RelFile.String,
    RouteLogical.FromRelFile,
  )
}

// ============================================================================
// PARSING HELPERS
// ============================================================================

const parseSegment = (segment: string): string => {
  const match = Str.match(segment, CONVENTIONS.numberedPrefix.pattern)
  return Op.match(match, {
    onNone: () => segment,
    onSome: (m) => m.groups.name,
  })
}

const parseNumberedPrefix = (name: string): { order: number | undefined; name: string } => {
  const match = Str.match(name, CONVENTIONS.numberedPrefix.pattern)
  return Op.match(match, {
    onNone: () => ({ order: undefined, name }),
    onSome: (m) => ({
      order: parseInt(m.groups.order, 10),
      name: m.groups.name,
    }),
  })
}
