/**
 * Error boundary for GraphQL Interactive components
 *
 * Provides graceful fallback rendering when the interactive GraphQL parser
 * encounters errors. Falls back to static syntax highlighting.
 */

import type { React } from '#dep/react/index'
import { React as ReactHooks } from '#dep/react/index'
import { Box } from '@radix-ui/themes'

interface GraphQLErrorBoundaryProps {
  /** Child components to protect */
  children: React.ReactNode
  /** Fallback code to display if interactive parsing fails */
  fallbackCode: string
  /** Optional callback when errors occur */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface GraphQLErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary that catches React errors in GraphQL Interactive components
 * and provides a fallback static code display.
 *
 * @example
 * ```tsx
 * <GraphQLErrorBoundary fallbackCode={codeblock.code}>
 *   <GraphQLInteractive codeblock={codeblock} schema={schema} />
 * </GraphQLErrorBoundary>
 * ```
 */
export class GraphQLErrorBoundary extends ReactHooks.Component<
  GraphQLErrorBoundaryProps,
  GraphQLErrorBoundaryState
> {
  constructor(props: GraphQLErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): GraphQLErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error or send to error reporting service
    console.error('GraphQL Interactive Error:', error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Box
          className='graphql-error-fallback'
          p={'4'}
          style={{
            borderRadius: 'var(--radius-2)',
            backgroundColor: 'var(--gray-2)',
            position: 'relative',
            borderLeft: '3px solid var(--red-9)',
          }}
        >
          <pre style={{ margin: 0, whiteSpace: 'pre' }}>
            <code>{this.props.fallbackCode}</code>
          </pre>
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '12px',
              color: 'var(--red-11)',
              backgroundColor: 'var(--red-a3)',
              padding: '2px 6px',
              borderRadius: '3px',
            }}
            title={this.state.error?.message || 'Interactive features failed to load'}
          >
            Interactive mode unavailable
          </div>
        </Box>
      )
    }

    return this.props.children
  }
}
