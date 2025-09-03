/**
 * Interactive GraphQL code block with tree-sitter parsing
 *
 * This component replaces CodeHike's default rendering for GraphQL code blocks
 * that have the "interactive" meta flag. It provides:
 * - Syntax highlighting using tree-sitter
 * - Hover tooltips showing type information (when schema is available)
 * - Click navigation to reference documentation
 * - Integration with CodeHike's annotation system
 */

import type { React } from '#dep/react/index'
import { React as ReactHooks } from '#dep/react/index'
import { Box } from '@radix-ui/themes'
import type { HighlightedCode } from 'codehike/code'
import type { GraphQLSchema } from 'graphql'
import { GraphQLErrorBoundary } from './components/GraphQLErrorBoundary.js'
import { GraphQLTokenPopover } from './components/GraphQLTokenPopover.js'
import { usePopoverState } from './hooks/use-popover-state.js'
import { type GraphQLToken, parseGraphQLWithTreeSitter } from './lib/parser.js'

interface GraphQLInteractiveProps {
  /** The code block from CodeHike with code and annotations */
  codeblock: HighlightedCode

  /** The GraphQL schema for providing type information and validation */
  schema?: GraphQLSchema | undefined

  /** Whether to show a warning indicator when schema is missing */
  showWarningIfNoSchema?: boolean | undefined
}

/**
 * Main component that renders an interactive GraphQL code block
 *
 * This component:
 * 1. Parses the GraphQL code into tokens using tree-sitter
 * 2. Renders each token with appropriate styling
 * 3. Adds interactivity to certain token types (types and fields)
 * 4. Shows loading/error states during parsing
 */
/**
 * Internal GraphQL Interactive implementation
 * Wrapped by error boundary in the main export
 */
const GraphQLInteractiveImpl: React.FC<GraphQLInteractiveProps> = ({
  codeblock,
  schema,
  showWarningIfNoSchema = true,
}) => {
  // State to hold the parsed tokens
  const [tokens, setTokens] = ReactHooks.useState<GraphQLToken[] | null>(null)

  // Loading state while parser initializes and processes the code
  const [isLoading, setIsLoading] = ReactHooks.useState(true)

  // Error state if parsing fails
  const [error, setError] = ReactHooks.useState<string | null>(null)

  // Retry attempt counter
  const [retryCount, setRetryCount] = ReactHooks.useState(0)

  // Popover state management - must be called at top level for hooks rules
  const popoverState = usePopoverState({
    showDelay: 300,
    hideDelay: 100,
    allowMultiplePins: true,
  })

  // Memoize token parsing to avoid re-computation on unrelated renders
  const parseTokens = ReactHooks.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Parse the code into tokens with semantic analysis
      const parsedTokens = await parseGraphQLWithTreeSitter(
        codeblock.code,
        codeblock.annotations,
        schema, // Pass the schema for semantic analysis
      )

      setTokens(parsedTokens)
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      // Provide detailed error information to users
      const errorMessage = err instanceof Error ? err.message : 'Unknown parsing error'
      setError(errorMessage)
      setTokens([]) // Set empty tokens on error for fallback rendering
    } finally {
      setIsLoading(false)
    }
  }, [codeblock.code, codeblock.annotations, schema])

  // Retry function for users
  const handleRetry = ReactHooks.useCallback(() => {
    setRetryCount(prev => prev + 1)
    parseTokens()
  }, [parseTokens])

  // Parse the GraphQL code whenever dependencies change
  ReactHooks.useEffect(() => {
    parseTokens()
  }, [parseTokens])

  // Render loading state
  // Shows the code with reduced opacity and a loading indicator
  if (isLoading) {
    return (
      <div className='graphql-loading'>
        <pre style={{ opacity: 0.5 }}>
          <code>{codeblock.code}</code>
        </pre>
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '12px',
            color: '#666',
            backgroundColor: '#f0f0f0',
            padding: '2px 6px',
            borderRadius: '3px',
          }}
        >
          Loading tree-sitter...
        </div>
      </div>
    )
  }

  // Render error state with retry option
  if (error) {
    return (
      <Box
        className='graphql-error'
        p={'4'}
        style={{
          borderRadius: 'var(--radius-2)',
          backgroundColor: 'var(--gray-2)',
          position: 'relative',
          borderLeft: '3px solid var(--red-9)',
        }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre' }}>
          <code>{codeblock.code}</code>
        </pre>
        <div
          style={{
            color: 'var(--red-11)',
            fontSize: '12px',
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'var(--red-a3)',
            borderRadius: '3px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Interactive parsing failed: {error}</span>
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              style={{
                backgroundColor: 'var(--red-9)',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Retry ({retryCount + 1}/3)
            </button>
          )}
        </div>
      </Box>
    )
  }

  // Fallback if no tokens were parsed or parsing failed
  if (!tokens || tokens.length === 0) {
    return (
      <Box
        className='graphql-fallback'
        p={'4'}
        style={{
          borderRadius: 'var(--radius-2)',
          backgroundColor: 'var(--gray-2)',
          position: 'relative',
        }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre' }}>
          <code>{codeblock.code}</code>
        </pre>
        {error && (
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
              maxWidth: '200px',
            }}
            title={error}
          >
            Interactive features unavailable
          </div>
        )}
      </Box>
    )
  }

  // Main render: Show the parsed and interactive code
  return (
    <Box
      className='graphql-interactive'
      p={'4'}
      position={'relative'}
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--gray-2)',
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      {/* Render each token as a separate span with appropriate styling */}
      <pre style={{ margin: 0, whiteSpace: 'pre' }}>
        <code>
          {tokens.map((token, index) => {
            const tokenId = `${token.start}-${token.end}-${index}`
            return (
              <TokenComponent
                key={tokenId}
                token={token}
                tokenId={tokenId}
                popoverState={popoverState}
                {...(schema !== undefined && { schema })}
              />
            )
          })}
        </code>
      </pre>
      {!schema && showWarningIfNoSchema && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '12px',
            color: 'var(--amber-11)',
            backgroundColor: 'var(--amber-a3)',
            padding: '2px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title='Interactive features are not available because no GraphQL schema is configured'
        >
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
            <line x1='12' y1='9' x2='12' y2='13' />
            <line x1='12' y1='17' x2='12.01' y2='17' />
          </svg>
          No schema configured
        </div>
      )}
    </Box>
  )
}

interface TokenComponentProps {
  /** The token to render */
  token: GraphQLToken

  /** Unique ID for this token */
  tokenId: string

  /** Popover state manager */
  popoverState: ReturnType<typeof usePopoverState>

  /** The GraphQL schema for type information */
  schema?: GraphQLSchema
}

/**
 * Component that renders a single token with interactive features
 *
 * This component handles:
 * - Applying syntax highlighting based on token type
 * - Hover effects for interactive tokens
 * - Click handlers for navigation
 * - Visual feedback for CodeHike annotations
 */
const TokenComponent: React.FC<TokenComponentProps> = ({ token, tokenId, popoverState, schema }) => {
  // Track hover state for interactive tokens
  const [isHovered, setIsHovered] = ReactHooks.useState(false)

  // Handle clicks on interactive tokens - memoized to prevent unnecessary re-renders
  const handleClick = ReactHooks.useCallback((e: React.MouseEvent) => {
    if (token.polen.isInteractive()) {
      e.preventDefault()
      e.stopPropagation()

      // Don't allow pinning for invalid fields
      if (token.semantic && 'kind' in token.semantic && token.semantic.kind === 'InvalidField') {
        return
      }

      // Toggle popover pin state only - no navigation
      popoverState.onTogglePin(tokenId)
    }
  }, [token, tokenId, popoverState])

  // Show hover effects when mouse enters an interactive token - memoized
  const handleMouseEnter = ReactHooks.useCallback(() => {
    if (token.polen.isInteractive()) {
      setIsHovered(true)
      popoverState.onHoverStart(tokenId)
    }
  }, [token, tokenId, popoverState])

  // Hide hover effects when mouse leaves - memoized
  const handleMouseLeave = ReactHooks.useCallback(() => {
    setIsHovered(false)
    popoverState.onHoverEnd(tokenId)
  }, [tokenId, popoverState])

  // Get the appropriate CSS class from the token
  const baseClass = token.highlighter.getCssClass()

  // Map class names to inline styles
  const getBaseStyle = (): React.CSSProperties => {
    switch (baseClass) {
      case 'graphql-keyword':
        return { color: 'var(--red-11)', fontWeight: 'bold' }
      case 'graphql-type-interactive':
        return { color: 'var(--blue-11)', fontWeight: 500 }
      case 'graphql-field-interactive':
        return { color: 'var(--violet-11)' }
      case 'graphql-field-error':
        return {
          color: 'var(--red-11)',
        }
      case 'graphql-error-hint':
        return {
          color: 'var(--red-11)',
          fontSize: '0.9em',
          fontStyle: 'italic',
          opacity: 0.5,
        }
      case 'graphql-comment':
        return {
          color: 'var(--gray-11)',
          fontStyle: 'italic',
          opacity: 0.6,
        }
      case 'graphql-operation':
        return { color: 'var(--violet-11)', fontStyle: 'italic' }
      case 'graphql-fragment':
        return { color: 'var(--violet-11)', fontStyle: 'italic' }
      case 'graphql-variable':
        return { color: 'var(--orange-11)' }
      case 'graphql-argument':
        return { color: 'var(--gray-12)' }
      case 'graphql-string':
        return { color: 'var(--blue-11)' }
      case 'graphql-number':
        return { color: 'var(--blue-11)' }
      case 'graphql-punctuation':
        return { color: 'var(--gray-11)', opacity: 0.5 }
      default:
        return { color: 'var(--gray-12)' }
    }
  }

  // Check if this is an invalid field
  const isInvalidField = token.semantic && 'kind' in token.semantic && token.semantic.kind === 'InvalidField'

  // Build the style object for this token
  const style: React.CSSProperties = {
    ...getBaseStyle(),
    // Interactive tokens get special styling (except invalid fields)
    ...(token.polen.isInteractive() && !isInvalidField && {
      cursor: 'pointer',
      textDecoration: isHovered ? 'underline' : 'none',
      backgroundColor: isHovered ? 'var(--accent-a3)' : 'transparent',
    }),

    // Invalid fields get different hover styling - no cursor change, no underline
    ...(isInvalidField && {
      cursor: 'default',
      textDecoration: 'underline wavy var(--red-a5)',
      textUnderlineOffset: '2px',
      // Subtle background change on hover to show it's interactive for popover
      backgroundColor: isHovered ? 'var(--red-a2)' : 'transparent',
    }),

    // Tokens with CodeHike annotations get highlighted
    ...(token.codeHike.annotations.length > 0 && {
      position: 'relative',
      backgroundColor: 'var(--yellow-a3)',
    }),
  }

  // Build the span element
  const tokenSpan = (
    <span
      className={baseClass}
      style={style}
      data-token-class={baseClass}
      data-interactive={token.polen.isInteractive()}
    >
      {token.text}
    </span>
  )

  // Wrap in popover if token has semantic information
  return (
    <GraphQLTokenPopover
      token={token}
      open={popoverState.isOpen(tokenId)}
      pinned={popoverState.isPinned(tokenId)}
      onTriggerHover={handleMouseEnter}
      onTriggerLeave={handleMouseLeave}
      onTriggerClick={handleClick}
      onContentHover={() => popoverState.onPopoverHover(tokenId)}
      onContentLeave={() => popoverState.onPopoverLeave(tokenId)}
      onClose={() => popoverState.unpin(tokenId)}
    >
      {tokenSpan}
    </GraphQLTokenPopover>
  )
}

/**
 * Main GraphQL Interactive component with error boundary protection
 *
 * This is the component that should be used in user code. It wraps the
 * internal implementation with an error boundary that provides graceful
 * fallback to static code rendering if interactive features fail.
 */
export const GraphQLInteractive: React.FC<GraphQLInteractiveProps> = (props) => {
  return (
    <GraphQLErrorBoundary
      fallbackCode={props.codeblock.code}
      onError={(error, errorInfo) => {
        // Log error for debugging (only in development)
        if (process.env['NODE_ENV'] === 'development') {
          console.error('GraphQL Interactive Error Boundary:', error, errorInfo)
        }
      }}
    >
      <GraphQLInteractiveImpl {...props} />
    </GraphQLErrorBoundary>
  )
}
