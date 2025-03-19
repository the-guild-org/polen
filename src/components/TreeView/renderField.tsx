import React from 'react'
import { 
  GraphQLArgument, 
  GraphQLObjectType, 
  GraphQLInterfaceType, 
  isObjectType, 
  isInterfaceType 
} from 'graphql'
import { TypeLink } from '../TypeLink'
import { ArgumentDetails } from '../ArgumentDetails'
import { FieldRenderProps, FieldRenderOptions } from './types'

// We need to forward declare this function since there's a circular dependency
// It will be properly imported from TypeSection
export let renderType: (type: GraphQLObjectType | GraphQLInterfaceType) => React.ReactNode

// This function will be set by TypeSection.tsx
export const setRenderType = (fn: typeof renderType) => {
  renderType = fn
}

export const renderField = ({ 
  field, 
  toggleType, 
  openTypes,
  isCompact = false,
  longestFieldNameLength = 0
}: FieldRenderProps & Partial<FieldRenderOptions>) => {
  const fieldType = field.type
  const isExpandable = isObjectType(fieldType) || isInterfaceType(fieldType)
  const typeKey = `${field.parentType.name}.${field.name}`
  const isExpanded = isExpandable && openTypes.has(typeKey)

  return (
    <div key={field.name} style={{ marginLeft: isExpandable ? '1.5rem' : '0' }}>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        padding: '0.25rem 0',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `minmax(${Math.max(longestFieldNameLength * 0.6, 12)}rem, auto) 1fr`, 
            columnGap: '2rem', 
            alignItems: 'baseline',
            width: '100%'
          }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginLeft: isExpandable ? 0 : '0',
            whiteSpace: 'nowrap',
            overflow: 'visible'
          }}>
            {isExpandable && (
              <button 
                onClick={() => toggleType(typeKey)}
                style={{ 
                  border: 'none',
                  background: 'none',
                  padding: '0 0.25rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <span>
              {field.name}
              {field.args.length > 0 && '('}
              {field.args.map((arg: GraphQLArgument, i) => (
                <span key={arg.name}>
                  {i > 0 && ', '}
                  <ArgumentDetails 
                    arg={{ 
                      name: arg.name,
                      type: arg.type,
                      ...(arg.description ? { description: arg.description } : {})
                    }}
                    compact
                  />
                </span>
              ))}
              {field.args.length > 0 && ')'}
            </span>
          </div>
          <span style={{ 
            color: '#059669',
            justifySelf: 'start',
            whiteSpace: 'nowrap'
          }}>
            <TypeLink type={fieldType} />
          </span>
        </div>
        {field.description && (
          <div style={{ 
            marginLeft: isExpandable ? '1.75rem' : '0',
            color: '#666', 
            fontSize: '0.9em', 
            fontFamily: 'system-ui',
            maxWidth: '60ch'
          }}>
            {field.description}
          </div>
        )}
      </div>
      {isExpanded && isExpandable && renderType && (
        <div style={{ marginLeft: '1.5rem' }}>
          {renderType(fieldType as GraphQLObjectType | GraphQLInterfaceType)}
        </div>
      )}
    </div>
  )
}
