import { Markdown as MarkdownParser } from '#api/singletons/markdown/index.js'
import type { FC } from 'react'

export const Markdown: FC<{ children: string }> = ({ children }) => {
  const html = MarkdownParser.parseSync(children)
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
