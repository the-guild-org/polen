import type { React } from '#dep/react/index.js'
import { FileRouter } from '#lib/file-router/index.js'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader.js'
import { Err, Path } from '@wollybeard/kit'
import { Outlet } from 'react-router'
import { PROJECT_DATA } from 'virtual:polen/project/data'

const stripTrailingSeparator = (str: string) => str.replace(/\/$/, ``)

export const pagesLoader = createLoader(async ({ params }: { params: { '*': string } }) => {
  const splatValue = params[`*`]
  const splatValueNormalized = `/` + stripTrailingSeparator(splatValue)

  const pagesRoute = PROJECT_DATA.pagesScanResult.routes.find((route) =>
    FileRouter.routeToString(route) === splatValueNormalized
  )

  if (!pagesRoute) return { content: null }

  const module = await Err.tryCatch(() =>
    import(Path.format(pagesRoute.file.path.absolute)) as Promise<{ default: string }>
  )

  const content = Err.is(module) ? null : module.default

  return {
    content,
  }
})

export const PagesComponent: React.FC = () => {
  const { content } = useLoaderData<typeof pagesLoader>()

  if (content) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }

  // Defer to potential next routes.
  return <Outlet />
}
