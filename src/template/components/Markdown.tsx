import { Markdown as MarkdownParser } from '#api/singletons/markdown/index.js'
import { React } from '#dep/react/index.js'
import type { FC } from 'react'

export const Markdown: FC<{ children: string }> = ({ children }) => {
  const [html, setHtml] = React.useState<string | null>(null)

  React.useEffect(() => {
    const processMarkdown = async () => {
      const result = await MarkdownParser.parse(children)
      setHtml(result)
    }

    // eslint-disable-next-line
    processMarkdown()
  }, [children])

  // Show plain text content during initial render (SSR/SSG) and while loading
  if (html === null) {
    return <div>{children}</div>
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
