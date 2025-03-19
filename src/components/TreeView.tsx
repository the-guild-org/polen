import { FC, useMemo } from 'react'
import { GraphQLNamedType, GraphQLField, GraphQLObjectType, GraphQLInterfaceType, isObjectType, isInterfaceType, GraphQLArgument } from 'graphql'
import { useSearchParams } from 'react-router-dom'
import { ArgumentDetails } from './ArgumentDetails'
import { TypeLink } from './TypeLink'

export interface Props {
  types: GraphQLNamedType[]
}

type FieldWithType = GraphQLField<any, any> & { parentType: string }

export const TreeView: FC<Props> = ({ types }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const openTypes = useMemo(() => new Set(searchParams.get('open')?.split(',').filter(Boolean) || []), [searchParams])

  const toggleType = (typeName: string) => {
    const newOpenTypes = new Set(openTypes)
    if (newOpenTypes.has(typeName)) {
      newOpenTypes.delete(typeName)
    } else {
      newOpenTypes.add(typeName)
    }
    
    if (newOpenTypes.size === 0) {
      searchParams.delete('open')
    } else {
      searchParams.set('open', Array.from(newOpenTypes).join(','))
    }
    setSearchParams(searchParams)
  }

  const renderField = (field: FieldWithType) => {
    const fieldType = field.type
    const isExpandable = isObjectType(fieldType) || isInterfaceType(fieldType)
    const isExpanded = isExpandable && openTypes.has(`${field.parentType}.${field.name}`)

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
          <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(200px, auto)', gap: '1rem', alignItems: 'baseline' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginLeft: isExpandable ? 0 : '0'
            }}>
              {isExpandable && (
                <button 
                  onClick={() => toggleType(`${field.parentType}.${field.name}`)}
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
            <span style={{ color: '#059669' }}>
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
        {isExpanded && isExpandable && (
          <div style={{ marginLeft: '1.5rem' }}>
            {renderType(fieldType as GraphQLObjectType | GraphQLInterfaceType)}
          </div>
        )}
      </div>
    )
  }

  const renderType = (type: GraphQLObjectType | GraphQLInterfaceType) => {
    const fields = Object.values(type.getFields())
    return (
      <div>
        {fields.map(field => renderField({ ...field, parentType: type.name }))}
      </div>
    )
  }

  const entryPoints = types.filter(t => [
    'Query',
    'Mutation',
    'Subscription'
  ].includes(t.name) && (isObjectType(t) || isInterfaceType(t)))

  const otherTypes = types.filter(t => 
    (isObjectType(t) || isInterfaceType(t)) && 
    !entryPoints.includes(t)
  )

  return (
    <div style={{ 
      padding: '1rem',
      maxWidth: '100%',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      <div>
        <div style={{ 
          fontFamily: 'system-ui',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          color: '#666',
          textTransform: 'uppercase',
          marginBottom: '0.5rem'
        }}>
          Entry Points
        </div>
        {entryPoints.map(type => {
        const isExpanded = openTypes.has(type.name)
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
            {isExpanded && isObjectType(type) && (
              <div style={{ marginLeft: '1.5rem' }}>
                {renderType(type)}
              </div>
            )}
          </div>
        )
      })}
      </div>

      <div>
        <div style={{ 
          fontFamily: 'system-ui',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          color: '#666',
          textTransform: 'uppercase',
          marginBottom: '0.5rem'
        }}>
          Other Types
        </div>
        {otherTypes.map(type => {
          const isExpanded = openTypes.has(type.name)
          return (
            <div key={type.name} style={{ marginBottom: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'center',
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}>
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
              {isExpanded && isObjectType(type) && (
                <div style={{ marginLeft: '1.5rem' }}>
                  {renderType(type)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
