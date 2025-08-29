import { Catalog } from '#lib/catalog/$'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Effect } from 'effect'
import { catalogBridge } from '../catalog-bridge.js'

import { ChangelogLayout } from '#template/layouts/index'
import { Changelog } from '../components/Changelog/Changelog.js'

const schema = Catalog.Catalog

const changelogLoader = async () => {
  const catalog = await Effect.runPromise(catalogBridge.view())
  return catalog!
}

const Component = () => {
  const catalog = useLoaderData(schema)

  return (
    <ChangelogLayout catalog={catalog}>
      <Changelog catalog={catalog} />
    </ChangelogLayout>
  )
}

export const changelog = route({
  schema,
  path: `changelog`,
  loader: changelogLoader,
  Component,
  children: [
    // Support deep linking to specific version
    route({
      path: `version/:version`,
      loader: changelogLoader,
      Component,
    }),
    // Support deep linking to specific version/revision
    route({
      path: `version/:version/revision/:revision`,
      loader: changelogLoader,
      Component,
    }),
  ],
})
