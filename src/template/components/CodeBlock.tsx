import React from 'react'

interface CodeBlockProps {
  children: string
  language?: string
  className?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language = `text`,
  className = ``,
}) => {
  return (
    <pre className={`code-block ${className}`}>
      <code className={`language-${language}`}>{children}</code>
    </pre>
  )
}
