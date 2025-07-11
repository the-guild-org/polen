import type { React } from '#dep/react/index'
import { React as ReactHooks } from '#dep/react/index'
import type { GraphQLSchema } from 'graphql'
import { useNavigate } from 'react-router'
import { analyze } from '../analysis.js'
import { useTooltipState } from '../hooks/use-tooltip-state.js'
import { createSimplePositionCalculator } from '../positioning-simple.js'
import { createPolenSchemaResolver } from '../schema-integration.js'
import type { Identifier } from '../types.js'
import { graphqlDocumentStyles } from './graphql-document-styles.js'
import { IdentifierLink } from './IdentifierLink.js'

/**
 * Options for the GraphQL document component
 */
export interface GraphQLDocumentOptions {
  /** Whether to show debug overlays */
  debug?: boolean
  /** Whether to disable interactive features */
  plain?: boolean
  /** Custom navigation handler */
  onNavigate?: (url: string) => void
  /** Whether to validate against schema */
  validate?: boolean
  /** Custom class name for the container */
  className?: string
  /** Custom render function for the code block */
  renderCode?: () => React.ReactNode
}

/**
 * Props for the GraphQL document component
 */
export interface GraphQLDocumentProps {
  /** The GraphQL document source code */
  children: string
  /** GraphQL schema for validation and linking */
  schema?: GraphQLSchema
  /** Component options */
  options?: GraphQLDocumentOptions
}

/**
 * Interactive GraphQL document component
 *
 * Transforms static GraphQL code blocks into interactive documentation
 * with hyperlinks, tooltips, and schema validation.
 */
export const GraphQLDocument: React.FC<GraphQLDocumentProps> = ({
  children,
  schema,
  options = {},
}) => {
  const {
    debug = false,
    plain = false,
    onNavigate,
    validate = true,
    className = ``,
    renderCode,
  } = options

  const navigate = useNavigate()
  const handleNavigate = onNavigate || ((url: string) => navigate(url))

  // Container ref for positioning calculations
  const containerRef = ReactHooks.useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = ReactHooks.useState(false)

  // Use tooltip state management
  const tooltipState = useTooltipState({
    showDelay: 300,
    hideDelay: 200, // Increased for smoother experience
    allowMultiplePins: true,
  })

  // Handle escape key to unpin all
  ReactHooks.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === `Escape`) {
        tooltipState.unpinAll()
      }
    }

    document.addEventListener(`keydown`, handleKeyDown)
    return () => {
      document.removeEventListener(`keydown`, handleKeyDown)
    }
  }, [tooltipState])

  // Layer 1: Parse and analyze
  const analysisResult = ReactHooks.useMemo(() => {
    if (plain) return null
    const result = analyze(children, { schema })
    // Debug logging handled by debug prop
    return result
  }, [children, plain, schema, debug])

  // Layer 2: Schema resolution
  const resolver = ReactHooks.useMemo(() => {
    if (!schema || plain) return null
    return createPolenSchemaResolver(schema)
  }, [schema, plain])

  const resolutions = ReactHooks.useMemo(() => {
    if (!analysisResult || !resolver) {
      return new Map()
    }

    const results = new Map()
    for (const [position, identifier] of analysisResult.identifiers.byPosition) {
      const resolution = resolver.resolveIdentifier(identifier)
      if (resolution) {
        results.set(position, resolution)
      }
    }
    return results
  }, [analysisResult, resolver])

  // Layer 3: Position calculation
  const positionCalculator = ReactHooks.useMemo(() => {
    if (plain) return null
    return createSimplePositionCalculator()
  }, [plain])

  const [positions, setPositions] = ReactHooks.useState<Map<string, { position: any; identifier: Identifier }>>(
    new Map(),
  )

  // Prepare code block and calculate positions after render
  ReactHooks.useEffect(() => {
    if (!containerRef.current || !analysisResult || !positionCalculator || plain) {
      // Skip position calculation - debug handled by debug prop
      return
    }

    // Get the code element within the container
    const codeElement = containerRef.current.querySelector(`pre.code-block code`)
      || containerRef.current.querySelector(`pre code`)
      || containerRef.current.querySelector(`code`)
    if (!codeElement) {
      // No code element found - skip
      return
    }

    // Prepare the code block (wrap identifiers)
    const identifiers = Array.from(analysisResult.identifiers.byPosition.values())
    // Prepare code block with identifiers
    positionCalculator.prepareCodeBlock(codeElement, identifiers)

    // Get positions after DOM update
    requestAnimationFrame(() => {
      // Pass containerRef.current as the reference element for positioning
      if (containerRef.current) {
        const newPositions = positionCalculator.getIdentifierPositions(codeElement, containerRef.current)
        // Position calculation complete
        setPositions(newPositions)
        setIsReady(true)
      }
    })
  }, [analysisResult, positionCalculator, plain])

  // Handle resize events with debouncing
  ReactHooks.useEffect(() => {
    if (!containerRef.current || !positionCalculator || plain) return

    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        const codeElement = containerRef.current?.querySelector(`pre.code-block code`)
          || containerRef.current?.querySelector(`pre code`)
          || containerRef.current?.querySelector(`code`)
        if (codeElement && containerRef.current) {
          const newPositions = positionCalculator.getIdentifierPositions(codeElement, containerRef.current)
          setPositions(newPositions)
        }
      }, 100) // Debounce resize events
    }

    window.addEventListener(`resize`, handleResize)
    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener(`resize`, handleResize)
    }
  }, [positionCalculator, plain])

  // Validation errors
  const validationErrors = ReactHooks.useMemo(() => {
    if (!validate || !analysisResult || !schema) return []
    return analysisResult.errors
  }, [validate, analysisResult, schema])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: graphqlDocumentStyles }} />
      <div
        ref={containerRef}
        className={`graphql-document ${className} ${debug ? `graphql-debug-mode` : ``} ${
          !isReady && !plain ? `graphql-loading` : ``
        }`}
        data-testid='graphql-document'
      >
        {/* Base code block */}
        {renderCode ? (
          renderCode()
        ) : (
          <pre className='code-block'>
            <code>{children}</code>
          </pre>
        )}

        {/* Interactive overlay layer */}
        {!plain && isReady && (
          <div className='graphql-interaction-layer' style={{ pointerEvents: `none` }}>
            {Array.from(positions.entries()).map(([id, { position, identifier }]) => {
              const startPos = identifier.position.start
              const resolution = resolutions.get(startPos)

              if (!resolution) return null

              return (
                <IdentifierLink
                  key={id}
                  identifier={identifier}
                  resolution={resolution}
                  position={position}
                  onNavigate={handleNavigate}
                  debug={debug}
                  isOpen={tooltipState.isOpen(id)}
                  isPinned={tooltipState.isPinned(id)}
                  onHoverStart={() => {
                    tooltipState.onHoverStart(id)
                  }}
                  onHoverEnd={() => {
                    tooltipState.onHoverEnd(id)
                  }}
                  onTogglePin={() => {
                    tooltipState.onTogglePin(id)
                  }}
                  onTooltipHover={() => {
                    tooltipState.onTooltipHover(id)
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Validation errors overlay */}
        {validationErrors.length > 0 && (
          <div className='graphql-validation-errors'>
            {validationErrors.map((error: any, index: number) => (
              <div key={index} className='graphql-error'>
                {error.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
