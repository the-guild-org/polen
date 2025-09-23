import { InputSource } from '#api/schema/input-source/$'
import { createSingleRevisionCatalog, mapToInputSourceError, normalizePathToAbs } from '#api/schema/input-source/helpers'
import { Ef } from '#dep/effect'
import { Fs, FsLoc } from '@wollybeard/kit'
import { Grafaid } from 'graphql-kit'

const l = FsLoc.fromString

const defaultPaths = {
  schemaFile: l(`./schema.graphql`),
} as const

/**
 * Configuration for loading schema from a single SDL file.
 */
export interface Options {
  /**
   * Path to the GraphQL SDL file.
   *
   * Can be absolute or relative to the project root.
   *
   * @default './schema.graphql'
   *
   * @example
   * ```ts
   * // Default location
   * path: './schema.graphql'
   *
   * // Custom location
   * path: './src/graphql/schema.sdl'
   * ```
   */
  path?: string | FsLoc.AbsFile.AbsFile | FsLoc.RelFile.RelFile
}

export interface Config {
  path: FsLoc.AbsFile.AbsFile
}

export const normalizeConfig = (options: Options, projectRoot: FsLoc.AbsDir.AbsDir): Config => {
  const config: Config = {
    path: normalizePathToAbs.file(options.path, projectRoot, defaultPaths.schemaFile),
  }

  return config
}

export const loader = InputSource.create({
  name: 'file',
  isApplicable: (options: Options, context) =>
    Ef.gen(function*() {
      const config = normalizeConfig(options, context.paths.project.rootDir)

      // Check if file exists and is a .graphql file
      const result = yield* Ef.either(Fs.stat(config.path))
      if (result._tag === 'Left') {
        return false
      }

      const stats = result.right
      return stats.type === 'File' && FsLoc.encodeSync(config.path).endsWith('.graphql')
    }),
  readIfApplicableOrThrow: (options: Options, context) =>
    Ef.gen(function*() {
      const config = normalizeConfig(options, context.paths.project.rootDir)

      const content = yield* Fs.readString(config.path)

      const ast = yield* Grafaid.Parse.parseSchema(content, { source: FsLoc.encodeSync(config.path) }).pipe(
        Ef.mapError(mapToInputSourceError('file')),
      )
      const schema = yield* Grafaid.Schema.fromAST(ast).pipe(
        Ef.mapError(mapToInputSourceError('file')),
      )

      return yield* createSingleRevisionCatalog(schema, 'file')
    }),
})
