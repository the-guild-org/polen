import type { React } from '#dep/react/index'
import { useState } from 'react'
import type { DOMPosition } from '../positioning-simple.ts'
import type { SchemaResolution } from '../schema-integration.ts'
import type { Identifier } from '../types.ts'
import { HoverTooltip } from './HoverTooltip.tsx'

/**
 * Props for the IdentifierLink component
 */
export interface IdentifierLinkProps {
  /** The GraphQL identifier */
  identifier: Identifier
  /** Schema resolution information */
  resolution: SchemaResolution
  /** DOM position for overlay placement */
  position: DOMPosition
  /** Navigation handler */
  onNavigate: (url: string) => void
  /** Whether to show debug visuals */
  debug?: boolean
}

/**
 * Interactive overlay for a GraphQL identifier
 *
 * Renders an invisible clickable area over the identifier text
 * with hover tooltips and navigation to schema reference pages.
 */
export const IdentifierLink: React.FC<IdentifierLinkProps> = ({
  identifier,
  resolution,
  position,
  onNavigate,
  debug = false,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Determine visual state
  const isClickable = resolution.exists
  const hasError = !resolution.exists && (identifier.kind === 'Type' || identifier.kind === 'Field')
  const isDeprecated = !!resolution.deprecated

  // Build class names
  const classNames = [
    'graphql-identifier-overlay',
    `graphql-${identifier.kind.toLowerCase()}`,
    isClickable && 'graphql-clickable',
    hasError && 'graphql-error',
    isDeprecated && 'graphql-deprecated',
    isHovered && 'graphql-hovered',
    debug && 'graphql-debug',
  ].filter(Boolean).join(' ')

  const handleClick = (e: React.MouseEvent) => {
    if (isClickable) {
      e.preventDefault()
      e.stopPropagation()
      onNavigate(resolution.referenceUrl)
    }
  }

  return (
    <>
      <div
        className={classNames}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          cursor: isClickable ? 'pointer' : 'default',
          zIndex: 10,
          // Debug mode visual
          ...(debug && {
            backgroundColor: hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${hasError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
          }),
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role='link'
        aria-label={`${identifier.kind} ${identifier.name}${isClickable ? ' - Click to view documentation' : ''}`}
        data-graphql-identifier={identifier.name}
        data-graphql-kind={identifier.kind}
      />

      {/* Tooltip */}
      {isHovered && resolution.documentation && (
        <HoverTooltip
          identifier={identifier}
          documentation={resolution.documentation}
          position={position}
          hasError={hasError}
          referenceUrl={resolution.referenceUrl}
        />
      )}
    </>
  )
}

/**
 * Default styles for identifier overlays
 *
 * These can be included in the document or overridden by custom styles.
 */
export const identifierLinkStyles = `
.graphql-identifier-overlay {
  /* Base styles for all overlays */
  transition: background-color 0.2s ease;
}

.graphql-identifier-overlay.graphql-clickable:hover {
  /* Subtle highlight on hover for clickable identifiers */
  background-color: rgba(59, 130, 246, 0.05);
}

.graphql-identifier-overlay.graphql-error {
  /* Error indicator */
  border-bottom: 2px wavy red;
}

.graphql-identifier-overlay.graphql-deprecated {
  /* Deprecated indicator */
  text-decoration: line-through;
  opacity: 0.7;
}

.graphql-identifier-overlay.graphql-debug {
  /* Debug mode makes overlays visible */
  background-color: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
}

/* Kind-specific styles */
.graphql-identifier-overlay.graphql-type {
  /* Type identifiers */
}

.graphql-identifier-overlay.graphql-field {
  /* Field identifiers */
}

.graphql-identifier-overlay.graphql-argument {
  /* Argument identifiers */
  font-style: italic;
}

.graphql-identifier-overlay.graphql-variable {
  /* Variable identifiers */
  color: var(--purple-11);
}

.graphql-identifier-overlay.graphql-directive {
  /* Directive identifiers */
  color: var(--amber-11);
}
`
