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
  /** Whether this tooltip is open */
  isOpen?: boolean
  /** Toggle tooltip open state */
  onToggle?: (open: boolean) => void
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
  isOpen = false,
  onToggle,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Use external state if provided, otherwise manage locally
  const showTooltip = isOpen
  const setShowTooltip = (show: boolean) => {
    onToggle?.(show)
  }

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
    showTooltip && 'graphql-tooltip-open',
    debug && 'graphql-debug',
  ].filter(Boolean).join(' ')

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Toggle tooltip on click
    setShowTooltip(!showTooltip)
  }

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isClickable) {
      onNavigate(resolution.referenceUrl)
    }
  }

  return (
    <>
      {isClickable
        ? (
          <a
            href={resolution.referenceUrl}
            className={classNames + ' graphql-identifier-link'}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: position.width,
              height: position.height,
              cursor: 'pointer',
              zIndex: 10,
              pointerEvents: 'auto',
              display: 'block',
              textDecoration: 'none',
              // Debug mode visual
              ...(debug && {
                backgroundColor: hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${hasError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              }),
            }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`${identifier.kind} ${identifier.name} - Click to view documentation`}
            data-graphql-identifier={identifier.name}
            data-graphql-kind={identifier.kind}
          />
        )
        : (
          <div
            className={classNames}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: position.width,
              height: position.height,
              cursor: 'pointer', // Make it clickable even for errors
              zIndex: 10,
              pointerEvents: 'auto',
              // Debug mode visual
              ...(debug && {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: `1px solid rgba(239, 68, 68, 0.3)`,
              }),
            }}
            onClick={handleClick} // Add click handler for errors too
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role='button'
            aria-label={`${identifier.kind} ${identifier.name} - Click to view information`}
            data-graphql-identifier={identifier.name}
            data-graphql-kind={identifier.kind}
          />
        )}

      {/* Tooltip - show on click, not hover */}
      {showTooltip && (
        <HoverTooltip
          identifier={identifier}
          documentation={resolution.documentation || {
            description: hasError
              ? `${identifier.kind} "${identifier.name}" not found in schema. This ${identifier.kind.toLowerCase()} does not exist in the current GraphQL schema.`
              : `${identifier.kind}: ${identifier.name}`,
            typeInfo: identifier.kind,
          }}
          position={position}
          hasError={hasError}
          referenceUrl={resolution.referenceUrl}
          onClose={() => setShowTooltip(false)}
          onNavigate={isClickable ? () => onNavigate(resolution.referenceUrl) : undefined}
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
