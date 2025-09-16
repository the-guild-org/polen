import { Api } from '#api/$'
import { createNavbar, type NavbarItem } from '#api/content/navbar'
import type { AssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import { polenVirtual } from '#vite/vi'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Effect } from 'effect'
import { Catalog } from 'graphql-kit'
import type * as Vite from 'vite'

export const viProjectNavbar = polenVirtual([`project`, `navbar`])

export interface Options {
  config: Api.Config.Config
  schemaReader: AssetReader<Api.Schema.InputSource.LoadedCatalog | null, any, any>
  examplesReader: AssetReader<any, any, any>
  pagesReader: AssetReader<any, any, any>
}

/**
 * Navbar plugin that generates the navigation structure based on available content
 */
export const Navbar = ({
  config,
  schemaReader,
  examplesReader,
  pagesReader,
}: Options): Vite.Plugin => {
  return {
    name: 'polen:navbar-virtual',
    ...ViteVirtual.IdentifiedLoader.toHooks(
      {
        identifier: viProjectNavbar,
        async loader() {
          const debug = debugPolen.sub(`module-project-navbar`)
          debug(`load`, { id: viProjectNavbar.id })

          const navbar: NavbarItem[] = []

          // ━ Schema presence causes adding some navbar items
          const loadedSchemaCatalog = await Effect.runPromise(
            schemaReader.read().pipe(Effect.provide(NodeFileSystem.layer)) as Effect.Effect<
              Api.Schema.InputSource.LoadedCatalog | null,
              never
            >,
          )

          // Check if reference is enabled (explicitly or auto-detected via schema presence)
          const referenceEnabled = config.reference.enabled ?? Boolean(loadedSchemaCatalog?.data)

          if (referenceEnabled && loadedSchemaCatalog?.data) {
            // IMPORTANT: Always ensure paths start with '/' for React Router compatibility.
            // Without the leading slash, React Router treats paths as relative, which causes
            // hydration mismatches between SSR (where base path is prepended) and client
            // (where basename is configured). This ensures consistent behavior.
            const referencePath = Api.Schema.Routing.createReferenceBasePath()
            navbar.push({ pathExp: referencePath, title: `Reference`, position: 'right' })

            // Check if we have revisions to show changelog
            const catalog = loadedSchemaCatalog.data
            const hasMultipleRevisions = Catalog.fold(
              (versioned) => {
                // For versioned catalogs, count total revisions across all entries
                const totalRevisions = Catalog.Versioned.getAll(versioned).reduce(
                  (sum: number, entry) => sum + entry.revisions.length,
                  0,
                )
                return totalRevisions > 1
              },
              (unversioned) => unversioned.schema.revisions?.length > 1,
            )(catalog)

            if (hasMultipleRevisions) {
              navbar.push({ pathExp: `/changelog`, title: `Changelog`, position: 'right' })
            }
          }

          // ━ Examples presence causes adding navbar item
          const loadedExamplesCatalog = await Effect.runPromise(
            examplesReader.read().pipe(Effect.provide(NodeFileSystem.layer)) as Effect.Effect<any, never>,
          )

          // Use config.examples.enabled if explicitly set, otherwise auto-detect
          const examplesEnabled = config.examples.enabled
            ?? (loadedExamplesCatalog.catalog.examples.length > 0)

          if (examplesEnabled) {
            navbar.push({ pathExp: '/examples', title: 'Examples', position: 'right' })
          }

          // ━━ Scan pages and add to navbar
          const scanResult = await Effect.runPromise(
            pagesReader.read().pipe(Effect.provide(NodeFileSystem.layer)) as Effect.Effect<any, never>,
          )
          const data = createNavbar(scanResult.list)
          navbar.push(...data)

          // Return a JavaScript module that exports the navbar
          return `export const navbar = ${JSON.stringify(navbar)}`
        },
      },
    ),
  }
}
