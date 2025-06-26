/**
 * Interactive overlay for GraphQL identifiers
 */

import type { React } from '#dep/react/index'
import type { DOMPosition } from '../positioning-simple.ts'
import type { SchemaResolution } from '../schema-integration.ts'
import type { Identifier } from '../types.ts'
import { GraphQLIdentifierPopover } from './GraphQLIdentifierPopover.tsx'

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
  isOpen: boolean
  /** Whether this tooltip is pinned */
  isPinned: boolean
  /** Handle hover start */
  onHoverStart: () => void
  /** Handle hover end */
  onHoverEnd: () => void
  /** Toggle pin state */
  onTogglePin: () => void
  /** Handle tooltip hover */
  onTooltipHover: () => void
}

/**
 * Interactive overlay for a GraphQL identifier
 *
 * Renders an invisible clickable area over the identifier text
 * with hover popovers and navigation to schema reference pages.
 */
export const IdentifierLink: React.FC<IdentifierLinkProps> = ({
  identifier,
  resolution,
  position,
  onNavigate,
  debug = false,
  isOpen,
  isPinned,
  onHoverStart,
  onHoverEnd,
  onTogglePin,
  onTooltipHover,
}) => {
  // Determine visual state
  const isClickable = resolution.exists
  const hasError = !resolution.exists && (identifier.kind === `Type` || identifier.kind === `Field`)
  const isDeprecated = !!resolution.deprecated

  // Build class names
  const classNames = [
    `graphql-identifier-overlay`,
    `graphql-${identifier.kind.toLowerCase()}`,
    isClickable && `graphql-clickable`,
    hasError && `graphql-error`,
    isDeprecated && `graphql-deprecated`,
    isOpen && `graphql-hovered`,
    isOpen && `graphql-tooltip-open`,
    debug && `graphql-debug`,
  ].filter(Boolean).join(` `)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onTogglePin()
  }

  // Create trigger element
  const triggerElement = isClickable
    ? (
      <a
        href={resolution.referenceUrl}
        className={classNames + ` graphql-identifier-link`}
        style={{
          position: `absolute`,
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          cursor: `pointer`,
          zIndex: 10,
          pointerEvents: `auto`,
          display: `block`,
          textDecoration: `none`,
          // Debug mode visual
          ...(debug && {
            backgroundColor: hasError ? `rgba(239, 68, 68, 0.1)` : `rgba(59, 130, 246, 0.1)`,
            border: `1px solid ${hasError ? `rgba(239, 68, 68, 0.3)` : `rgba(59, 130, 246, 0.3)`}`,
          }),
        }}
        onClick={handleClick}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        aria-label={`${identifier.kind} ${identifier.name} - Click to view documentation`}
        data-graphql-identifier={identifier.name}
        data-graphql-kind={identifier.kind}
      />
    )
    : (
      <div
        className={classNames}
        style={{
          position: `absolute`,
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          cursor: `pointer`, // Make it clickable even for errors
          zIndex: 10,
          pointerEvents: `auto`,
          // Debug mode visual
          ...(debug && {
            backgroundColor: `rgba(239, 68, 68, 0.1)`,
            border: `1px solid rgba(239, 68, 68, 0.3)`,
          }),
        }}
        onClick={handleClick}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        role='button'
        aria-label={`${identifier.kind} ${identifier.name} - Click to view information`}
        data-graphql-identifier={identifier.name}
        data-graphql-kind={identifier.kind}
      />
    )

  return (
    <GraphQLIdentifierPopover
      identifier={identifier}
      documentation={resolution.documentation || {
        description: hasError
          ? `${identifier.kind} "${identifier.name}" not found in schema. This ${identifier.kind.toLowerCase()} does not exist in the current GraphQL schema.`
          : `${identifier.kind}: ${identifier.name}`,
        typeInfo: identifier.kind,
      }}
      hasError={hasError}
      referenceUrl={resolution.referenceUrl}
      open={isOpen}
      isPinned={isPinned}
      onOpenChange={(open) => {
        if (!open && isPinned) {
          onTogglePin() // Unpin when closing
        }
      }}
      onNavigate={isClickable ? onNavigate : undefined}
    >
      {triggerElement}
    </GraphQLIdentifierPopover>
  )
}
