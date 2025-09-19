import { O, S } from '#dep/effect'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Http } from '@wollybeard/kit'
import { Effect, HashMap } from 'effect'
import { Catalog, Schema, Version } from 'graphql-kit'
import { redirect } from 'react-router'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { Container, Grid, GridItem } from '../../components/ui/index.js'
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
    const urlVersion = Version.encodeSync(O.getOrThrow(latestVersion))
    throw redirect(`/changelog/version/${urlVersion}`)
  }

  const schemaMaybe = ((): O.Option<Schema.Schema> => {
    if (Catalog.Versioned.is(catalog)) {
      const version = Version.decodeSync(params.version!)
      const schema = HashMap.get(catalog.entries, version)
      return schema
    }
    return O.some(catalog.schema)
  })()

  if (O.isNone(schemaMaybe)) {
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
    <Container>
      <Grid cols={12} gap='lg'>
        <GridItem span={4}>
          <ChangelogSidebar schema={schema} catalog={catalog} />
        </GridItem>
        <GridItem span={8}>
          <ChangelogBody schema={schema} />
        </GridItem>
      </Grid>
    </Container>
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
