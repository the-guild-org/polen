import { Catalog } from '#lib/catalog'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Swiss } from '#lib/swiss'
import { Version } from '#lib/version'
import { Effect, Option } from 'effect'
import { redirect, useParams } from 'react-router'
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

const schema = Catalog.Catalog

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

  return Effect.succeed(catalog)
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Component
//
//

const Component = () => {
  const catalog = useLoaderData(schema)

  return (
    <Swiss.Body subgrid>
      <ChangelogSidebar catalog={catalog} />
      {/* Main content */}
      <Swiss.Item start={6} cols={7}>
        <ChangelogBody catalog={catalog} />
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
  : route({
    schema,
    path: `changelog`,
    loader,
    Component,
    children: [
      // Support deep linking to specific version
      route({
        path: `version/:version`,
        loader,
        Component,
      }),
      // Support deep linking to specific version/revision
      route({
        path: `version/:version/revision/:revision`,
        loader,
        Component,
      }),
    ],
  })
