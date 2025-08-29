/**
 * Popover component for GraphQL tokens
 *
 * Provides rich overlays with type information that can be triggered by hover
 * and pinned by clicking. Supports multiple simultaneous popovers.
 */

import type { React } from '#dep/react/index'
import { Cross1Icon } from '@radix-ui/react-icons'
import { Button, Popover } from '@radix-ui/themes'
import { polenUrlPath } from '../../../lib/polen-url.js'
import type { GraphQLToken } from '../lib/parser.js'
import {
  isArgument,
  isFragment,
  isInputField,
  isInvalidField,
  isOperation,
  isOutputField,
} from '../lib/semantic-nodes.js'

interface GraphQLTokenPopoverProps {
  /** The token to create a popover for */
  token: GraphQLToken

  /** Child element that triggers the popover */
  children: React.ReactNode

  /** Whether the popover is open */
  open: boolean

  /** Whether the popover is pinned */
  pinned: boolean

  /** Called when mouse enters the trigger */
  onTriggerHover: () => void

  /** Called when mouse leaves the trigger */
  onTriggerLeave: () => void

  /** Called when trigger is clicked */
  onTriggerClick: (e: React.MouseEvent) => void

  /** Called when popover content is hovered */
  onContentHover: () => void

  /** Called when mouse leaves popover content */
  onContentLeave: () => void

  /** Called when close button is clicked */
  onClose: () => void
}

/**
 * Get rich content for a token popover
 */
function getPopoverContent(
  token: GraphQLToken,
): {
  title: string
  path?: Array<{ name: string; url: string | null }> | undefined
  description?: string | undefined
  type?: string | undefined
  invalid?: boolean | undefined
  availableFields?: string[] | undefined
  typeName?: string | undefined
  typeUrl?: string | undefined
  fieldName?: string | undefined
} | null {
  const semantic = token.semantic

  if (!semantic) return null

  if (isInvalidField(semantic)) {
    // Get available fields from the parent type
    const availableFields = Object.keys(semantic.parentType.getFields()).sort()

    // TODO: In the future, check other schema versions to see if the field existed previously
    // This would help identify renamed or removed fields across schema evolution

    return {
      title: `Field "${semantic.fieldName}" does not exist`,
      description: `Type ${semantic.parentType.name} does not have a field named "${semantic.fieldName}".`,
      typeName: semantic.parentType.name,
      typeUrl: polenUrlPath('reference', semantic.parentType.name),
      fieldName: semantic.fieldName,
      invalid: true,
      availableFields,
    }
  }

  if (isOutputField(semantic)) {
    const fieldType = semantic.fieldDef.type.toString()
    return {
      title: semantic.fieldDef.name,
      path: [
        { name: semantic.parentType.name, url: polenUrlPath('reference', semantic.parentType.name) },
        {
          name: semantic.fieldDef.name,
          url: polenUrlPath('reference', `${semantic.parentType.name}#${semantic.fieldDef.name}`),
        },
      ],
      description: semantic.fieldDef.description || undefined,
      type: `${fieldType}`,
    }
  }

  if (isInputField(semantic)) {
    const fieldType = semantic.fieldDef.type.toString()
    return {
      title: semantic.fieldDef.name,
      path: [
        { name: semantic.parentType.name, url: polenUrlPath('reference', semantic.parentType.name) },
        {
          name: semantic.fieldDef.name,
          url: polenUrlPath('reference', `${semantic.parentType.name}#${semantic.fieldDef.name}`),
        },
      ],
      description: semantic.fieldDef.description || undefined,
      type: `${fieldType}`,
    }
  }

  if (isArgument(semantic)) {
    const argType = semantic.argumentDef.type.toString()
    return {
      title: semantic.argumentDef.name,
      path: [
        { name: semantic.parentType.name, url: polenUrlPath('reference', semantic.parentType.name) },
        {
          name: semantic.parentField.name,
          url: polenUrlPath('reference', `${semantic.parentType.name}#${semantic.parentField.name}`),
        },
        {
          name: semantic.argumentDef.name,
          url: polenUrlPath(
            'reference',
            `${semantic.parentType.name}#${semantic.parentField.name}__${semantic.argumentDef.name}`,
          ),
        },
      ],
      description: semantic.argumentDef.description || undefined,
      type: `${argType}`,
    }
  }

  if (isOperation(semantic)) {
    return {
      title: semantic.name || `${semantic.type} operation`,
      path: [
        { name: semantic.name || semantic.type, url: null },
      ],
      description: 'GraphQL Operation',
      type: semantic.type.charAt(0).toUpperCase() + semantic.type.slice(1),
    }
  }

  if (isFragment(semantic)) {
    return {
      title: semantic.name,
      path: [
        { name: 'fragment', url: null },
        { name: semantic.name, url: null },
      ],
      description: 'GraphQL Fragment',
      type: `Fragment on ${semantic.onType?.name || 'Unknown'}`,
    }
  }

  if ('name' in semantic && semantic.name) {
    // Type reference
    return {
      title: semantic.name,
      path: [
        { name: semantic.name, url: polenUrlPath('reference', semantic.name) },
      ],
      description: ('description' in semantic && typeof semantic.description === 'string')
        ? semantic.description
        : undefined,
      type: 'GraphQL Type',
    }
  }

  return null
}

export const GraphQLTokenPopover: React.FC<GraphQLTokenPopoverProps> = ({
  token,
  children,
  open,
  pinned,
  onTriggerHover,
  onTriggerLeave,
  onTriggerClick,
  onContentHover,
  onContentLeave,
  onClose,
}) => {
  const content = getPopoverContent(token)

  // If no content, just render children without popover
  if (!content) {
    return <>{children}</>
  }

  const popoverContent = (
    <div
      style={{
        padding: 'var(--space-1)',
        minWidth: '200px',
        maxWidth: '400px',
        position: 'relative',
      }}
      onMouseEnter={onContentHover}
      onMouseLeave={onContentLeave}
    >
      {/* Header with close button (if pinned) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '6px',
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Path with clickable links - not shown for invalid fields */}
          {content.path && !content.invalid && (
            <div
              style={{
                fontSize: 'var(--font-size-2)',
                color: 'var(--gray-12)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {content.path.map((segment, index) => (
                <span key={index}>
                  {index > 0 && <span style={{ color: 'var(--gray-11)', margin: '0 var(--space-1)' }}>.</span>}
                  {segment.url
                    ? (
                      <a
                        href={segment.url}
                        style={{
                          color: '#0969da',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          if (segment.url) {
                            window.location.href = segment.url
                          }
                        }}
                      >
                        {segment.name}
                      </a>
                    )
                    : (
                      <span style={{ color: '#24292e' }}>
                        {segment.name}
                      </span>
                    )}
                </span>
              ))}
            </div>
          )}

          {/* Type info for valid fields */}
          {content.type && !content.invalid && (
            <div
              style={{
                fontSize: '12px',
                color: '#6a737d',
                fontFamily: 'monospace',
                opacity: 0.8,
              }}
            >
              {content.type}
            </div>
          )}

          {/* Error message for invalid fields */}
          {content.invalid && (
            <div
              style={{
                fontSize: '14px',
                color: '#d73a49',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>Error:</span> Type{' '}
              <a
                href={content.typeUrl}
                style={{
                  color: '#0969da',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
                onClick={(e) => {
                  e.preventDefault()
                  if (content.typeUrl) {
                    window.location.href = content.typeUrl
                  }
                }}
              >
                {content.typeName}
              </a>{' '}
              does not have a field named "{content.fieldName}".
            </div>
          )}
        </div>

        {pinned && !content.invalid && (
          <Button
            variant='ghost'
            size='1'
            onClick={onClose}
            style={{
              marginLeft: '8px',
              padding: '2px',
              minWidth: 'auto',
              height: 'auto',
            }}
          >
            <Cross1Icon width='12' height='12' />
          </Button>
        )}
      </div>

      {/* Description for valid fields only */}
      {content.description && !content.invalid && (
        <div
          style={{
            fontSize: '13px',
            color: '#24292e',
            lineHeight: '1.4',
            opacity: 0.9,
          }}
        >
          {content.description}
        </div>
      )}

      {/* Available fields in SDL-like format */}
      {content.invalid && content.availableFields && (
        <div
          style={{
            marginTop: '8px',
            backgroundColor: '#f6f8fa',
            border: '1px solid #e1e4e8',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            lineHeight: '1.5',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 10px 0 10px' }}>
            <span style={{ color: '#d73a49' }}>type</span>{' '}
            <a
              href={content.typeUrl}
              style={{
                color: '#005cc5',
                fontWeight: 500,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              {content.typeName}
            </a>{' '}
            <span style={{ color: '#24292e' }}>{'{'}</span>
          </div>
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '0 10px',
              marginRight: '2px', // Account for scrollbar
            }}
          >
            {(() => {
              // Insert the invalid field in alphabetical position
              const invalidFieldName = content.fieldName || ''
              const allFields = [...content.availableFields]
              const insertIndex = allFields.findIndex(f => f.localeCompare(invalidFieldName) > 0)

              // Create the full list with invalid field inserted
              const fieldsWithInvalid = insertIndex === -1
                ? [...allFields, invalidFieldName]
                : [...allFields.slice(0, insertIndex), invalidFieldName, ...allFields.slice(insertIndex)]

              return fieldsWithInvalid.map((field) => {
                const isInvalidField = field === invalidFieldName
                return (
                  <div
                    key={field}
                    style={{
                      paddingLeft: isInvalidField ? '26px' : '16px',
                      color: isInvalidField ? '#d73a49' : '#6f42c1',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: isInvalidField ? 'var(--red-a2)' : 'transparent',
                      marginLeft: isInvalidField ? '-10px' : '0',
                      marginRight: isInvalidField ? '-10px' : '0',
                      paddingTop: isInvalidField ? '2px' : '0',
                      paddingBottom: isInvalidField ? '2px' : '0',
                    }}
                  >
                    {isInvalidField
                      ? (
                        <span style={{ textDecoration: 'line-through' }}>
                          {field}
                        </span>
                      )
                      : (
                        <a
                          href={polenUrlPath('reference', `${content.typeName}#${field}`)}
                          style={{
                            color: '#6f42c1',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none'
                          }}
                        >
                          {field}
                        </a>
                      )}
                    {isInvalidField && (
                      <span
                        style={{
                          marginLeft: '12px',
                          color: '#d73a49',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ← No such field
                      </span>
                    )}
                  </div>
                )
              })
            })()}
          </div>
          <div style={{ padding: '0 10px 10px 10px', color: '#24292e' }}>{'}'}</div>
        </div>
      )}
    </div>
  )

  return (
    <Popover.Root open={open}>
      <Popover.Trigger>
        <span
          style={{ cursor: token.polen.isInteractive() ? 'pointer' : 'default' }}
          onMouseEnter={onTriggerHover}
          onMouseLeave={onTriggerLeave}
          onClick={onTriggerClick}
        >
          {children}
        </span>
      </Popover.Trigger>

      <Popover.Content
        side='top'
        align='start'
        sideOffset={4}
        style={{
          padding: 'var(--space-2)',
          background: content.invalid ? 'var(--red-1)' : 'var(--color-background)',
          border: content.invalid ? '2px solid var(--red-7)' : '1px solid var(--gray-6)',
          borderRadius: 'var(--radius-1)',
          boxShadow: 'none',
          zIndex: 1000,
          maxWidth: '450px',
        }}
      >
        {popoverContent}
      </Popover.Content>
    </Popover.Root>
  )
}
