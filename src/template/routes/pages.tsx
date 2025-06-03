import type { React } from '#dep/react/index.js'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader.js'
import { never } from '@wollybeard/kit/language'
import { Outlet } from 'react-router'
import * as ProjectPages from 'virtual:polen/project/pages'

const normalizeSplat = (splat: string) => `/` + splat.replace(/\/$/, ``)

export const pagesLoader = createLoader(async ({ params }: { params: { '*': string } }) => {
  const splat = normalizeSplat(params[`*`])

  // todo: switch with __COMMAND__
  // but check that vite does code elimination on it
  if (__SERVING__) {
    const content = await ProjectPages.load!(splat)
    console.log({ splat, content })
    return {
      content,
    }
  } else if (__BUILDING__) {
    const content = ProjectPages.data![splat] ?? null
    return {
      content,
    }
  } else {
    never()
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
