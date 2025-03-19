import React from 'react'
import { 
  GraphQLObjectType, 
  GraphQLInterfaceType, 
  GraphQLField,
  isObjectType,
  isInterfaceType
} from 'graphql'
import { TypeSectionProps } from './types'
import { renderField, setRenderType } from './renderField'

// Define the renderType implementation and register it
const renderTypeImpl = (type: GraphQLObjectType | GraphQLInterfaceType): React.ReactNode => {
  const fields = Object.values(type.getFields())
  return (
    <div>
      {fields.map((field: GraphQLField<any, any>) => renderField({ 
        field: { 
          ...field, 
          parentType: type 
        },
        toggleType: () => {}, // This is a dummy function as it's not used in this context
        openTypes: new Set() // Empty set as we don't track nested expansions
      }))}
    </div>
  )
}

// Register the implementation
setRenderType(renderTypeImpl)

export const TypeSection: React.FC<TypeSectionProps> = ({ 
  type, 
  isExpanded, 
  toggleType,
  openTypes
}) => {
  const fields = Object.values(type.getFields())
  
  // Calculate the longest field name for proper alignment
  const longestFieldNameLength = fields.reduce((maxLength, field) => {
    // Include space for arguments in the calculation
    let nameLength = field.name.length
    
    // Add extra space for the expandable button if needed
    const fieldType = field.type
    const isExpandable = isObjectType(fieldType) || isInterfaceType(fieldType)
    if (isExpandable) {
      nameLength += 2 // Account for the expand/collapse button
    }
    
    // Add space for arguments
    if (field.args.length > 0) {
      // Add parentheses and commas
      nameLength += 2 + (field.args.length - 1)
      // Add argument names
      nameLength += field.args.reduce((sum, arg) => sum + arg.name.length, 0)
    }
    
    return Math.max(maxLength, nameLength)
  }, 0)

  return (
    <div key={type.name} style={{ marginBottom: '1rem' }}>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => toggleType(type.name)}
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
          <span style={{ fontWeight: 'bold' }}>
            {type.name}
          </span>
        </div>
        {type.description && (
          <div style={{ 
            marginLeft: '1.75rem',
            color: '#666', 
            fontSize: '0.9em', 
            fontFamily: 'system-ui',
            maxWidth: '60ch'
          }}>
            {type.description}
          </div>
        )}
      </div>
      {isExpanded && (
        <div style={{ marginLeft: '1.5rem' }}>
          {fields.map((field: GraphQLField<any, any>) => renderField({ 
            field: { 
              ...field, 
              parentType: type 
            },
            toggleType,
            openTypes,
            longestFieldNameLength
          }))}
        </div>
      )}
    </div>
  )
}
