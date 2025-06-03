import type { React } from '#dep/react/index.js'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader.js'
import { Outlet } from 'react-router'
import * as ProjectPages from 'virtual:polen/project/pages'

const stripTrailingSeparator = (str: string) => str.replace(/\/$/, ``)

export const pagesLoader = createLoader(async ({ params }: { params: { '*': string } }) => {
  const splatValue = params[`*`]
  const splatValueNormalized = `/` + stripTrailingSeparator(splatValue)

  let content: string | null = null

  if (__SERVING__ && ProjectPages.load) {
    // Development mode: load content lazily
    content = await ProjectPages.load(splatValueNormalized)
  } else if (ProjectPages.data) {
    // Production mode: use pre-built content
    content = ProjectPages.data[splatValueNormalized] ?? null
  }

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
