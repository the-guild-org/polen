import type { FC } from 'react'
import ReactMarkdown from 'react-markdown'

export const Markdown: FC<{ children: string }> = ({ children }) => {
  return (
    <ReactMarkdown
      components={{
        p: ({ node: _, ...props }) => <p className="rt-Text" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
