import type { FC } from 'react'
import { Marked } from '../../dep/marked/_namespace.js'

export const Markdown: FC<{ children: string }> = ({ children }) => {
  const html = Marked.parse(children)
  return (
    <div dangerouslySetInnerHTML={{ __html: html }}></div>
    // <ReactMarkdown
    //   components={{
    //     p: ({ node: _, ...props }) => <p className="rt-Text" {...props} />,
    //   }}
    // >
    //   {children}
    // </ReactMarkdown>
  )
}
