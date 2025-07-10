import { Grafaid } from '#lib/grafaid/index'
import { GraphqlChange } from '#lib/graphql-change/index'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { Arr } from '@wollybeard/kit'
import type { Schema } from '../../schema.js'

/**
 * Configuration for defining schemas programmatically in memory.
 *
 * Useful for demos, testing, or when schemas are generated dynamically.
 */
export interface ConfigInput {
  /**
   * Schema versions defined as SDL strings.
   *
   * Can be:
   * - A single SDL string (no changelog)
   * - Array of SDL strings (uses current date for all)
   * - Array of objects with date and SDL (full changelog support)
   *
   * @example
   * ```ts
   * // Single schema
   * versions: `
   *   type Query {
   *     hello: String
   *   }
   * `
   *
   * // Multiple versions with explicit dates
   * versions: [
   *   {
   *     date: new Date('2024-01-15'),
   *     value: `type Query { users: [User] }`
   *   },
   *   {
   *     date: new Date('2024-03-20'),
   *     value: `type Query { users: [User], posts: [Post] }`
   *   }
   * ]
   * ```
   */
  versions:
    | string
    | string[]
    | { date: Date; value: string }[]
}

export interface Config {
  versions: { date: Date; value: string }[]
}

export const normalize = (configInput: ConfigInput): Config => {
  const config: Config = {
    versions: Arr.map(Arr.sure(configInput.versions), _ => {
      if (typeof _ === `string`) {
        return {
          date: new Date(),
          value: _,
        }
      }
      return _
    }),
  }

  return config
}

export const read = async (
  configInput: ConfigInput,
): Promise<null | Schema> => {
  const config = normalize(configInput)

  if (!Arr.isntEmpty(config.versions)) {
    return null
  }

  const versions = Arr.map(config.versions, _ => {
    return {
      date: _.date,
      schema: Grafaid.Schema.fromAST(Grafaid.Schema.AST.parse(_.value)),
    }
  })

  versions.sort((a, b) => a.date.getTime() - b.date.getTime())

  // todo: make DRY, this is same as for schema-directory
  const changesets = await Promise.all(
    Arr.map(versions, async (version, index): Promise<GraphqlChangeset.ChangeSet> => {
      const current = version
      const previous = versions[index - 1]

      const before = previous?.schema ?? Grafaid.Schema.empty
      const after = current.schema

      const changes = await GraphqlChange.calcChangeset({
        before,
        after,
      })

      return {
        date: current.date,
        before,
        after,
        changes,
      }
    }),
  )

  changesets.reverse()

  const schema: Schema = {
    versions: changesets,
  }

  return schema
}
