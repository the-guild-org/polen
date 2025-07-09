import { FileRouter } from '#lib/file-router/index'
import { evaluate } from '@mdx-js/mdx'
import { Path } from '@wollybeard/kit'
import { type CodeHikeConfig, recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import { readFile } from 'node:fs/promises'
import * as runtime from 'react/jsx-runtime'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import projectPagesCatalog from 'virtual:polen/project/data/pages-catalog.jsonsuper'
import { getRequestContext } from '../contexts-async/request.js'

export async function Component() {
  const { request } = getRequestContext()
  const url = new URL(request.url)

  // Find the page that matches this URL path
  const matchingPage = projectPagesCatalog.pages.find(page => {
    const pagePathExpression = FileRouter.routeToPathExpression(page.route)
    return pagePathExpression === url.pathname
  })

  // console.log(matchingPage)

  if (!matchingPage) {
    return (
      <div>
        <h1>Page Not Found</h1>
        <p>No page found for path: {url.pathname}</p>
      </div>
    )
  }

  try {
    const filePath = Path.format(matchingPage.route.file.path.absolute)

    const content = await readFile(filePath, 'utf-8')

    const codeHikeConfig: CodeHikeConfig = {
      // todo
      // components: { code: 'Code' },
    }

    const { default: MDXContent } = await evaluate(content, {
      ...runtime,
      remarkPlugins: [
        remarkFrontmatter,
        remarkGfm,
        [remarkCodeHike, codeHikeConfig],
      ],
      recmaPlugins: [
        [recmaCodeHike, codeHikeConfig],
      ],
      development: false,
      baseUrl: filePath,
      useMDXComponents: () => ({
        GraphQLDocumentWithSchema,
        Callout,
        Tabs,
      }),
    })

    return <MDXContent />
  } catch (error) {
    console.error(`Error rendering MDX page for ${url.pathname}:`, error)
    return (
      <div>
        <h1>Error loading page</h1>
        <p>Failed to load content for path: {url.pathname}</p>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>
    )
  }
}

// Simple mock components for MDX
const GraphQLDocumentWithSchema = (props: React.HTMLAttributes<HTMLPreElement>) => {
  return <pre {...props} />
}

const Callout = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return <div style={{ border: '1px solid #ccc', padding: '1rem' }} {...props} />
}

const Tabs = Object.assign(
  (props: React.HTMLAttributes<HTMLDivElement>) => {
    return <div {...props} />
  },
  {
    Trigger: (props: React.HTMLAttributes<HTMLDivElement>) => {
      return <div {...props} />
    },
    Root: (props: React.HTMLAttributes<HTMLDivElement>) => {
      return <div {...props} />
    },
    List: (props: React.HTMLAttributes<HTMLDivElement>) => {
      return <div {...props} />
    },
    Content: (props: React.HTMLAttributes<HTMLDivElement>) => {
      return <div {...props} />
    },
  },
)
