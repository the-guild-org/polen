/**
 * GraphQL Identifier Popover using Radix Themes
 *
 * Displays rich information about GraphQL identifiers on hover/click
 */

import type { React } from '#dep/react/index'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Badge, Box, Flex, IconButton, Link, Popover, Text } from '@radix-ui/themes'
import type { Documentation } from '../schema-integration.ts'
import type { Identifier } from '../types.ts'

export interface GraphQLIdentifierPopoverProps {
  /** The identifier being shown */
  identifier: Identifier
  /** Documentation from schema */
  documentation: Documentation
  /** Whether this identifier has an error */
  hasError?: boolean
  /** Reference URL for "View docs" link */
  referenceUrl: string
  /** Whether popover is open */
  open: boolean
  /** Whether popover is pinned */
  isPinned: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback to navigate to docs */
  onNavigate?: (url: string) => void
  /** The trigger element */
  children: React.ReactNode
}

/**
 * Popover content for GraphQL identifiers
 */
export const GraphQLIdentifierPopover: React.FC<GraphQLIdentifierPopoverProps> = ({
  identifier,
  documentation,
  hasError = false,
  referenceUrl,
  open,
  isPinned,
  onOpenChange,
  onNavigate,
  children,
}) => {
  // Determine badge color based on identifier kind
  const getBadgeColor = () => {
    switch (identifier.kind) {
      case `Type`:
        return `blue`
      case `Field`:
        return `green`
      case `Argument`:
        return `orange`
      case `Variable`:
        return `purple`
      case `Directive`:
        return `amber`
      case `Fragment`:
        return `cyan`
      default:
        return `gray`
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger>
        {children}
      </Popover.Trigger>

      <Popover.Content
        className='graphql-identifier-popover'
        style={{ maxWidth: 400 }}
        onInteractOutside={(e) => {
          // Prevent closing when clicking inside popover if pinned
          if (isPinned) {
            e.preventDefault()
          }
        }}
      >
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
            {isPinned && (
              <IconButton
                size='1'
                variant='ghost'
                onClick={() => {
                  onOpenChange(false)
                }}
                aria-label='Close popover'
              >
                <Cross2Icon />
              </IconButton>
            )}
          </Flex>

          {/* Type signature */}
          <Box>
            <Text size='1' color='gray'>
              Type: <Text as='span' size='1' style={{ fontFamily: `monospace` }}>{documentation.typeInfo}</Text>
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
                Default:{` `}
                <Text as='span' size='1' style={{ fontFamily: `monospace` }}>{documentation.defaultValue}</Text>
              </Text>
            </Box>
          )}

          {/* Deprecation warning */}
          {documentation.deprecated && (
            <Box
              style={{
                padding: `8px`,
                backgroundColor: `var(--amber-2)`,
                borderRadius: `4px`,
                border: `1px solid var(--amber-6)`,
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
                padding: `8px`,
                backgroundColor: `var(--red-2)`,
                borderRadius: `4px`,
                border: `1px solid var(--red-6)`,
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
              Path: {identifier.schemaPath.join(` → `)}
            </Text>
          </Box>

          {/* View docs link */}
          {onNavigate && !hasError && (
            <Box>
              <Link
                size='1'
                href={referenceUrl}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  onNavigate(referenceUrl)
                  onOpenChange(false)
                }}
              >
                View full documentation →
              </Link>
            </Box>
          )}
        </Flex>
      </Popover.Content>
    </Popover.Root>
  )
}
