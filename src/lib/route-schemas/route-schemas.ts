import { Catalog } from '#lib/catalog'
import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Changelog Route Schema
// ============================================================================

export const ChangelogLoaderData = S.NullOr(Catalog.Catalog).annotations({
  identifier: 'ChangelogLoaderData',
  description: 'Loader data for the changelog route',
})

export type ChangelogLoaderData = S.Schema.Type<typeof ChangelogLoaderData>

// ============================================================================
// Reference Route Schema
// ============================================================================

export const ReferenceLoaderData = S.Struct({
  catalog: Catalog.Catalog,
  requestedVersion: S.String,
}).annotations({
  identifier: 'ReferenceLoaderData',
  description: 'Loader data for the reference route',
})

export type ReferenceLoaderData = S.Schema.Type<typeof ReferenceLoaderData>

// ============================================================================
// Pages Route Schema
// ============================================================================

export const PagesLoaderData = S.Struct({
  hasSchema: S.Boolean,
}).annotations({
  identifier: 'PagesLoaderData',
  description: 'Loader data for the pages route',
})

export type PagesLoaderData = S.Schema.Type<typeof PagesLoaderData>

// ============================================================================
// Root Route Schema
// ============================================================================

export const RootLoaderData = S.Struct({}).annotations({
  identifier: 'RootLoaderData',
  description: 'Loader data for the root route',
})

export type RootLoaderData = S.Schema.Type<typeof RootLoaderData>
