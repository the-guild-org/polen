import React from 'react'

interface PreProps {
  children: React.ReactNode
  className?: string
  'data-enhanced'?: string
}

interface CodeProps {
  children: string
  className?: string
}

/**
 * Custom pre component that intercepts GraphQL code blocks
 */
const Pre: React.FC<PreProps> = ({ children, className, ...props }) => {
  // Check if this is a Shiki-enhanced code block
  const isShiki = props['data-enhanced'] === 'true'

  // Extract the code element
  const codeElement = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === 'code',
  ) as React.ReactElement<CodeProps> | undefined

  if (!codeElement) {
    return <pre className={className} {...props}>{children}</pre>
  }

  // Check if it's a GraphQL code block
  const codeClassName = codeElement.props.className || ''
  const isGraphQL = codeClassName.includes('language-graphql') || codeClassName.includes('language-gql')

  if (isGraphQL && isShiki) {
    // Extract the plain text content from the code element
    const plainText = extractPlainText(codeElement.props.children)

    // For now, just render the Shiki-highlighted code normally
    // The GraphQLDocument component will be enhanced client-side
    return (
      <div data-testid='graphql-document' data-graphql-code={plainText}>
        <pre className={className} {...props}>{children}</pre>
      </div>
    )
  }

  // For non-GraphQL code blocks, render normally
  return <pre className={className} {...props}>{children}</pre>
}

/**
 * Extract plain text from React children (recursive)
 */
function extractPlainText(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children
  }

  if (Array.isArray(children)) {
    return children.map(extractPlainText).join('')
  }

  if (React.isValidElement(children)) {
    const props = (children as React.ReactElement<any>).props
    if (props?.children) {
      return extractPlainText(props.children)
    }
  }

  return ''
}

/**
 * Simple server-side rendering of React element to HTML string
 */
function renderToStaticMarkup(element: React.ReactNode): string {
  // For server-side, we just need to preserve the structure
  if (typeof element === 'string') return element

  if (React.isValidElement(element)) {
    const { type, props } = element as React.ReactElement<any>
    const tagName = typeof type === 'string' ? type : 'div'
    const attrs = Object.entries(props || {})
      .filter(([key]) => key !== 'children' && !key.startsWith('__'))
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')

    const children = props?.children ? renderToStaticMarkup(props.children) : ''
    return `<${tagName}${attrs ? ' ' + attrs : ''}>${children}</${tagName}>`
  }

  if (Array.isArray(element)) {
    return element.map(renderToStaticMarkup).join('')
  }

  return ''
}

export const mdxComponents = {
  pre: Pre,
}
