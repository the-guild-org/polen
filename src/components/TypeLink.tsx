import { FC } from 'react'
import { GraphQLType } from 'graphql'
import { Link, useLocation } from 'react-router-dom'

export interface Props {
  type: GraphQLType
  compact?: boolean
  isToggleable?: boolean
  onToggle?: () => void
  isExpanded?: boolean
}

export const TypeLink: FC<Props> = ({ 
  type, 
  compact = false, 
  isToggleable = false,
  onToggle,
  isExpanded
}) => {
  const location = useLocation()
  const baseType = type.toString().replace(/[!\[\]]/g, '')
  const viewName = location.pathname.split('/')[2] || 'column'
  
  if (compact) {
    if (isToggleable && onToggle) {
      return (
        <span style={{ display: 'inline-block', textAlign: 'left' }}>
          <button
            onClick={onToggle}
            style={{ 
              color: '#059669',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              textAlign: 'left'
            }}
          >
            {type.toString()}
            {isToggleable && (
              <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
          </button>
        </span>
      )
    }
    
    return (
      <span style={{ 
        color: '#059669',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap'
      }}>
        {type.toString()}
      </span>
    )
  }
  
  return (
    <Link 
      to={`/view/${viewName}/type/${baseType}`}
      state={{ from: location.pathname }}
      className="type-link"
    >
      {type.toString()}
    </Link>
  )
}
