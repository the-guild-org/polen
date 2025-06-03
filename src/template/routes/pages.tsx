import type { React } from '#dep/react/index.js'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader.js'
import { Outlet } from 'react-router'
import { loadPageContent, pageContent } from 'virtual:polen/project/page-content'

const stripTrailingSeparator = (str: string) => str.replace(/\/$/, ``)

export const pagesLoader = createLoader(async ({ params }: { params: { '*': string } }) => {
  const splatValue = params[`*`]
  const splatValueNormalized = `/` + stripTrailingSeparator(splatValue)

  let content: string | null = null

  if (__SERVING__ && loadPageContent) {
    // Development mode: load content lazily
    content = await loadPageContent(splatValueNormalized)
  } else if (pageContent) {
    // Production mode: use pre-built content
    content = pageContent[splatValueNormalized] ?? null
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
