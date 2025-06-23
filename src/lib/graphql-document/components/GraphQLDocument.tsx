import type { React } from '#dep/react/index'
import type { GraphQLSchema } from 'graphql'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { analyze } from '../analysis.ts'
import { createSimplePositionCalculator } from '../positioning-simple.ts'
import { createPolenSchemaResolver } from '../schema-integration.ts'
import type { Identifier } from '../types.ts'
import { hoverTooltipStyles } from './HoverTooltip.tsx'
import { IdentifierLink } from './IdentifierLink.tsx'
import { identifierLinkStyles } from './IdentifierLink.tsx'

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
  /** Pre-rendered Shiki HTML (from build time) */
  highlightedHtml?: string
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
  highlightedHtml,
}) => {
  const {
    debug = false,
    plain = false,
    onNavigate,
    validate = true,
    className = '',
  } = options

  const navigate = useNavigate()
  const handleNavigate = onNavigate || ((url: string) => navigate(url))

  // Container ref for positioning calculations
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null)

  // Handle click outside to close tooltips
  useEffect(() => {
    if (!openTooltipId) return

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the tooltip and identifier links
      const target = event.target as HTMLElement

      // Don't close if clicking on an identifier link or tooltip
      if (
        target.closest('.graphql-identifier-overlay')
        || target.closest('.graphql-hover-tooltip')
      ) {
        return
      }

      // Close the tooltip
      setOpenTooltipId(null)
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openTooltipId])

  // Layer 1: Parse and analyze
  const analysisResult = useMemo(() => {
    if (plain) return null
    const result = analyze(children, { schema })
    return result
  }, [children, plain, schema])

  // Layer 2: Schema resolution
  const resolver = useMemo(() => {
    if (!schema || plain) return null
    return createPolenSchemaResolver(schema)
  }, [schema, plain])

  const resolutions = useMemo(() => {
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
  const positionCalculator = useMemo(() => {
    if (plain) return null
    return createSimplePositionCalculator()
  }, [plain])

  const [positions, setPositions] = useState<Map<string, { position: any; identifier: Identifier }>>(new Map())

  // Prepare code block and calculate positions after render
  useEffect(() => {
    if (!containerRef.current || !analysisResult || !positionCalculator || plain) {
      return
    }

    // Get the code element within the container
    const codeElement = containerRef.current.querySelector('pre.shiki code')
      || containerRef.current.querySelector('pre code')
      || containerRef.current.querySelector('code')
    if (!codeElement) {
      return
    }

    // Prepare the code block (wrap identifiers)
    const identifiers = Array.from(analysisResult.identifiers.byPosition.values())
    positionCalculator.prepareCodeBlock(codeElement as Element, identifiers)

    // Get positions after DOM update
    requestAnimationFrame(() => {
      // Pass containerRef.current as the reference element for positioning
      if (containerRef.current) {
        const newPositions = positionCalculator.getIdentifierPositions(codeElement as Element, containerRef.current)
        setPositions(newPositions)
        setIsReady(true)
      }
    })
  }, [analysisResult, positionCalculator, plain, highlightedHtml])

  // Handle resize events
  useEffect(() => {
    if (!containerRef.current || !positionCalculator || plain) return

    const handleResize = () => {
      const codeElement = containerRef.current?.querySelector('pre.shiki code')
        || containerRef.current?.querySelector('pre code')
        || containerRef.current?.querySelector('code')
      if (codeElement && containerRef.current) {
        const newPositions = positionCalculator.getIdentifierPositions(codeElement as Element, containerRef.current)
        setPositions(newPositions)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [positionCalculator, plain])

  // Validation errors
  const validationErrors = useMemo(() => {
    if (!validate || !analysisResult || !schema) return []
    return analysisResult.errors
  }, [validate, analysisResult, schema])

  return (
    <>
      {/* Inject styles */}
      <style dangerouslySetInnerHTML={{ __html: identifierLinkStyles + '\n' + hoverTooltipStyles }} />

      <div
        ref={containerRef}
        className={`graphql-document ${className} ${debug ? 'graphql-debug-mode' : ''}`}
        style={{ position: 'relative' }}
      >
        {/* Base syntax highlighting */}
        {highlightedHtml ? <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} /> : (
          <pre className='shiki'>
            <code>{children}</code>
          </pre>
        )}

        {/* Interactive overlay layer */}
        {!plain && isReady && (
          <div className='graphql-interaction-layer' style={{ pointerEvents: 'none' }}>
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
                  isOpen={openTooltipId === id}
                  onToggle={(open) => setOpenTooltipId(open ? id : null)}
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

/**
 * Default styles for the GraphQL document component
 */
export const graphqlDocumentStyles = `
.graphql-document {
  position: relative;
}

.graphql-interaction-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.graphql-interaction-layer > * {
  pointer-events: auto;
}

.graphql-validation-errors {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: var(--red-2);
  border: 1px solid var(--red-6);
  border-radius: 4px;
}

.graphql-error {
  color: var(--red-11);
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.graphql-debug-mode [data-graphql-id] {
  background-color: rgba(59, 130, 246, 0.1);
  outline: 1px solid rgba(59, 130, 246, 0.3);
}
`
