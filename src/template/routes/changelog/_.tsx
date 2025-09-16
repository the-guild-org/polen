import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Swiss } from '#lib/swiss'
import { Http } from '@wollybeard/kit'
import { Effect, Option } from 'effect'
import { HashMap } from 'effect'
import { Catalog } from 'graphql-kit'
import { S } from 'graphql-kit'
import { Schema } from 'graphql-kit'
import { Version } from 'graphql-kit'
import { redirect } from 'react-router'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { ChangelogBody } from './ChangelogBody.js'
import { ChangelogSidebar } from './ChangelogSidebar.js'

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Schema
//
//

const LoaderSchema = S.Struct({
  catalog: Catalog.Catalog,
  schema: Schema.Schema,
})

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Loader
//
//

const loader = ({ params }: { params: { version?: string } }) => {
  const catalog = schemasCatalog!

  // If catalog is versioned and no version is provided in URL, redirect to latest version
  if (Catalog.Versioned.is(catalog) && !params.version) {
    const latestVersion = Catalog.getLatestVersion(catalog)
    const urlVersion = Version.encodeSync(Option.getOrThrow(latestVersion))
    throw redirect(`/changelog/version/${urlVersion}`)
  }

  const schemaMaybe = ((): Option.Option<Schema.Schema> => {
    if (Catalog.Versioned.is(catalog)) {
      const version = Version.decodeSync(params.version!)
      const schema = HashMap.get(catalog.entries, version)
      return schema
    }
    return Option.some(catalog.schema)
  })()

  if (Option.isNone(schemaMaybe)) {
    throw Http.Response.notFound
  }

  return Effect.succeed({ catalog, schema: schemaMaybe.value })
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Component
//
//

const Component = () => {
  const { catalog, schema } = useLoaderData(LoaderSchema)

  return (
    <Swiss.Body subgrid>
      <ChangelogSidebar schema={schema} catalog={catalog} />
      <Swiss.Item start={5} cols={8}>
        <ChangelogBody schema={schema} />
      </Swiss.Item>
    </Swiss.Body>
  )
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Routes
//
//

export const changelog = !schemasCatalog
  ? null
  : Catalog.Versioned.is(schemasCatalog)
  ? route({
    path: `changelog`,
    loader,
    Component,
    children: [
      route({
        path: `version/:version`,
        schema: LoaderSchema,
        loader,
        Component,
        // children: [
        //   route({
        //     path: `revision/:revision`,
        //     schema: LoaderSchema,
        //     loader,
        //     Component,
        //   }),
        // ],
      }),
    ],
  })
  : route({
    path: `changelog`,
    loader,
    schema: LoaderSchema,
    Component,
    // children: [
    //   route({
    //     path: `revision/:revision`,
    //     schema: LoaderSchema,
    //     loader,
    //     Component,
    //   }),
    // ],
  })
