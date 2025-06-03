import { React } from '#dep/react/index.js'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader.js'
import { never } from '@wollybeard/kit/language'
import { Outlet } from 'react-router'
import * as ProjectPages from 'virtual:polen/project/pages'

const normalizeSplat = (splat: string) => `/` + splat.replace(/\/$/, ``)

export const pagesLoader = createLoader(async ({ params }: { params: { '*': string } }) => {
  const splat = normalizeSplat(params[`*`])

  return {
    path: splat,
  }
})

export const PagesComponent: React.FC = () => {
  const { path } = useLoaderData<typeof pagesLoader>()
  const [content, setContent] = React.useState<React.ReactNode>(null)

  React.useEffect(() => {
    const loadContent = async () => {
      if (__SERVING__) {
        const loaded = await ProjectPages.load!(path)
        if (loaded) {
          // Check if it's a React component (MDX) or HTML string (MD)
          if (typeof loaded === `function`) {
            const Component = loaded as React.ComponentType
            setContent(<Component />)
          } else if (typeof loaded === `string`) {
            setContent(<div dangerouslySetInnerHTML={{ __html: loaded }} />)
          }
        }
      } else if (__BUILDING__) {
        const pageContent = ProjectPages.data![path]
        if (pageContent) {
          if (typeof pageContent === `function`) {
            const Component = pageContent as React.ComponentType
            setContent(<Component />)
          } else if (typeof pageContent === `string`) {
            setContent(<div dangerouslySetInnerHTML={{ __html: pageContent }} />)
          }
        }
      } else {
        never()
      }
    }
    // eslint-disable-next-line
    loadContent()
  }, [path])

  if (content) {
    return <>{content}</>
  }

  // Defer to potential next routes.
  return <Outlet />
}
