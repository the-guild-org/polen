import type { React } from '#dep/react/index'
import { Badge, Box, Card, Flex, Text } from '@radix-ui/themes'
import { useEffect, useRef, useState } from 'react'
import type { DOMPosition } from '../positioning-simple.ts'
import type { Documentation } from '../schema-integration.ts'
import type { Identifier } from '../types.ts'

/**
 * Props for the HoverTooltip component
 */
export interface HoverTooltipProps {
  /** The identifier being hovered */
  identifier: Identifier
  /** Documentation from schema */
  documentation: Documentation
  /** Position of the identifier */
  position: DOMPosition
  /** Whether this identifier has an error */
  hasError?: boolean
  /** Reference URL for "View docs" link */
  referenceUrl: string
  /** Callback to close the tooltip */
  onClose?: () => void
  /** Callback to navigate to docs */
  onNavigate?: () => void
}

/**
 * Tooltip shown on hover over GraphQL identifiers
 *
 * Displays type information, descriptions, deprecation warnings,
 * and links to full documentation.
 */
export const HoverTooltip: React.FC<HoverTooltipProps> = ({
  identifier,
  documentation,
  position,
  hasError = false,
  referenceUrl,
  onClose,
  onNavigate,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  // Calculate tooltip position to avoid viewport edges
  useEffect(() => {
    if (!tooltipRef.current) return

    const tooltip = tooltipRef.current
    const rect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Default position: above the identifier
    let top = position.top - rect.height - 8
    let left = position.left

    // Adjust if tooltip would go off screen
    if (top < 0) {
      // Show below if not enough space above
      top = position.top + position.height + 8
    }

    if (left + rect.width > viewportWidth) {
      // Align right edge with identifier if too wide
      left = position.left + position.width - rect.width
    }

    if (left < 0) {
      // Keep on screen
      left = 8
    }

    setTooltipPosition({ top, left })
  }, [position])

  // Determine badge color based on identifier kind
  const getBadgeColor = () => {
    switch (identifier.kind) {
      case 'Type':
        return 'blue'
      case 'Field':
        return 'green'
      case 'Argument':
        return 'orange'
      case 'Variable':
        return 'purple'
      case 'Directive':
        return 'amber'
      case 'Fragment':
        return 'cyan'
      default:
        return 'gray'
    }
  }

  return (
    <div
      ref={tooltipRef}
      className='graphql-hover-tooltip'
      style={{
        position: 'absolute',
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        zIndex: 100,
        maxWidth: '400px',
        pointerEvents: 'auto', // Make tooltip interactive
      }}
    >
      <Card size='2' variant='surface'>
        <Flex direction='column' gap='2'>
          {/* Header with name, kind, and close button */}
          <Flex justify='between' align='center'>
            <Flex align='center' gap='2'>
              <Text size='2' weight='bold'>
                {identifier.name}
              </Text>
              <Badge color={getBadgeColor()} size='1'>
                {identifier.kind}
              </Badge>
            </Flex>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--gray-11)',
                  fontSize: '18px',
                  lineHeight: '1',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--gray-a3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                aria-label='Close tooltip'
              >
                ×
              </button>
            )}
          </Flex>

          {/* Type signature */}
          <Box>
            <Text size='1' color='gray'>
              Type: <Text as='span' size='1' style={{ fontFamily: 'monospace' }}>{documentation.typeInfo}</Text>
            </Text>
          </Box>

          {/* Description */}
          {documentation.description && (
            <Box>
              <Text size='1'>
                {documentation.description}
              </Text>
            </Box>
          )}

          {/* Default value for arguments */}
          {documentation.defaultValue && (
            <Box>
              <Text size='1' color='gray'>
                Default:{' '}
                <Text as='span' size='1' style={{ fontFamily: 'monospace' }}>{documentation.defaultValue}</Text>
              </Text>
            </Box>
          )}

          {/* Deprecation warning */}
          {documentation.deprecated && (
            <Box
              style={{
                padding: '8px',
                backgroundColor: 'var(--amber-2)',
                borderRadius: '4px',
                border: '1px solid var(--amber-6)',
              }}
            >
              <Text size='1' color='amber'>
                ⚠️ Deprecated: {documentation.deprecated.reason}
              </Text>
              {documentation.deprecated.replacement && (
                <Text size='1' color='amber'>
                  Use {documentation.deprecated.replacement} instead.
                </Text>
              )}
            </Box>
          )}

          {/* Error message */}
          {hasError && (
            <Box
              style={{
                padding: '8px',
                backgroundColor: 'var(--red-2)',
                borderRadius: '4px',
                border: '1px solid var(--red-6)',
              }}
            >
              <Text size='1' color='red'>
                ❌ {identifier.kind} not found in schema
              </Text>
            </Box>
          )}

          {/* Schema path */}
          <Box>
            <Text size='1' color='gray'>
              Path: {identifier.schemaPath.join(' → ')}
            </Text>
          </Box>

          {/* View docs link */}
          {onNavigate && (
            <Box>
              <Text size='1'>
                <a
                  href={referenceUrl}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate()
                    onClose?.()
                  }}
                  style={{
                    color: 'var(--accent-9)',
                    textDecoration: 'none',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = 'var(--accent-9)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = 'transparent'
                  }}
                >
                  View full documentation →
                </a>
              </Text>
            </Box>
          )}
        </Flex>
      </Card>
    </div>
  )
}

/**
 * Default styles for hover tooltips
 */
export const hoverTooltipStyles = `
.graphql-hover-tooltip {
  /* Tooltip animation */
  animation: graphql-tooltip-fade-in 0.2s ease-out;
}

@keyframes graphql-tooltip-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ensure tooltips appear above other content */
.graphql-hover-tooltip .rt-Card {
  box-shadow: 0 10px 38px -10px rgba(22, 23, 24, 0.35), 
              0 10px 20px -15px rgba(22, 23, 24, 0.2);
}
`
