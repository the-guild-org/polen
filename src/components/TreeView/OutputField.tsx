import React from 'react'
import { 
  GraphQLArgument, 
  GraphQLObjectType, 
  GraphQLInterfaceType, 
  GraphQLField
} from 'graphql'
import { Grafaid } from '../../utils/grafaid'
import { TypeLink } from '../TypeLink'

export type FieldWithType = GraphQLField<any, any> & { 
  parentType: GraphQLObjectType | GraphQLInterfaceType 
}


// We need to forward declare this function since there's a circular dependency
// It will be properly imported from TypeSection
export let renderType: (type: GraphQLObjectType | GraphQLInterfaceType) => React.ReactNode

// This function will be set by TypeSection.tsx
export const setRenderType = (fn: typeof renderType) => {
  renderType = fn
}

export interface Props {
  field: FieldWithType
  toggleType: (typeName: string) => void
  openTypes: ReadonlySet<string>
}

export interface FieldRenderOptions {
  isCompact?: boolean
  longestFieldNameLength?: number
}


export const OutputField = ({ 
  field, 
  toggleType, 
  openTypes,
  isCompact = false,
  longestFieldNameLength = 0
}: Props & Partial<FieldRenderOptions>) => {
  const fieldType = field.type
  const isExpandable = Grafaid.isExpandableType(fieldType)
  const typeKey = `${field.parentType.name}.${field.name}`
  const isExpanded = isExpandable && openTypes.has(typeKey)

  return (
    <div key={field.name} style={{ marginLeft: '0' }}>
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
            gridTemplateColumns: 'minmax(auto, max-content) 1fr',
            alignItems: 'baseline',
            width: '100%',
            gap: '2rem'
          }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            overflow: 'visible'
          }}>
            <span style={{ display: 'inline-flex', flexWrap: 'nowrap', alignItems: 'baseline' }}>
              <span>{field.name}</span>
              {field.args.length > 0 && (
                <span style={{ 
                  color: '#6B7280',
                  fontSize: '0.9rem',
                  marginLeft: '0.25rem'
                }}>
                  (...)
                </span>
              )}
            </span>
          </div>
          <div style={{ 
            color: '#059669',
            justifySelf: 'start',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center'
          }}>
            <TypeLink 
              type={fieldType} 
              isToggleable={isExpandable}
              onToggle={() => isExpandable && toggleType(typeKey)}
              isExpanded={isExpanded}
              compact
            />
          </div>
        </div>
        {(field.description || field.args.length > 0) && (
          <div style={{ 
            marginLeft: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {field.description && (
              <div style={{ 
                color: '#666', 
                fontSize: '0.9em', 
                fontFamily: 'system-ui',
                maxWidth: '60ch'
              }}>
                {field.description}
              </div>
            )}
            {field.args.length > 0 && (
              <div style={{ 
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                backgroundColor: '#f5f5f5',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                maxWidth: '60ch'
              }}>                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  marginTop: '0.25rem'
                }}>
                  {field.args.map((arg: GraphQLArgument) => (
                    <div key={arg.name} style={{ 
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'baseline'
                    }}>
                      <span style={{ color: '#6B7280', minWidth: '8rem' }}>{arg.name}:</span>
                      <TypeLink type={arg.type} compact />
                    </div>
                  ))}
                </div>
              </div>
            )}
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
