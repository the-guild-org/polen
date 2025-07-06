import React from 'react'

interface PreProps {
  children: React.ReactNode
  className?: string
}

/**
 * Simple pre component that renders code blocks as-is
 */
const Pre: React.FC<PreProps> = ({ children, className, ...props }) => {
  return <pre className={className} {...props}>{children}</pre>
}

export const mdxComponents = {
  pre: Pre,
}
