import type { Config } from '#api/config/index'
import type { PolenState } from '#api/vite/state/index'
import type { Vite } from '#dep/vite/index'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { debugPolen } from '#singletons/debug'
import { superjson } from '#singletons/superjson'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { Schema } from '../../schema/index.js'
import { polenVirtual } from '../vi.js'

const viProjectSchema = polenVirtual([`project`, `data`, `schema.jsonsuper`], { allowPluginProcessing: true })

export interface Options {
  config: Config.Config
  state: PolenState
}

const debug = debugPolen.sub(`vite-schema`)

export const SchemaPlugin = ({ config, state }: Options): Vite.Plugin => {
  debug('construct')
  // Schema cache management
  let schemaCache: Awaited<ReturnType<typeof Schema.readOrThrow>> | null = null

  const readSchema = async () => {
    if (schemaCache === null) {
      const schema = await Schema.readOrThrow({
        ...config.schema,
        projectRoot: config.paths.project.rootDir,
      })
      // todo: augmentations scoped to a version
      schema?.versions.forEach(version => {
        SchemaAugmentation.apply(version.after, config.schemaAugmentations)
      })
      schemaCache = schema
    }
    return schemaCache
  }

  return {
    name: `polen:schema`,
    enforce: `pre`,

    ...ViteVirtual.IdentifiedLoader.toHooks({
      identifier: viProjectSchema,
      async loader(id) {
        debug(`load`, { id })

        const schema = await readSchema()
        if (!schema) return superjson.stringify(null)

        // ━ Schema presence causes adding some navbar items
        const navbar = state.navbar.get(`schema`)
        navbar.length = 0 // Clear existing
        debug(`update navbar`, { message: `for schema` })

        // IMPORTANT: Always ensure paths start with '/' for React Router compatibility.
        // Without the leading slash, React Router treats paths as relative, which causes
        // hydration mismatches between SSR (where base path is prepended) and client
        // (where basename is configured). This ensures consistent behavior.
        navbar.push({ pathExp: `/reference`, title: `Reference` })
        if (schema.versions.length > 1) {
          navbar.push({ pathExp: `/changelog`, title: `Changelog` })
        }

        // Return just the JSON string - let the JSON plugin handle the transformation
        return superjson.stringify(schema)
      },
    }),
  }
}
