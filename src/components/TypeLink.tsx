import { FC } from 'react'
import { GraphQLType } from 'graphql'
import { Link, useLocation } from 'react-router-dom'

export interface Props {
  type: GraphQLType
  compact?: boolean
}

export const TypeLink: FC<Props> = ({ type, compact = false }) => {
  const location = useLocation()
  const baseType = type.toString().replace(/[!\[\]]/g, '')
  const viewName = location.pathname.split('/')[2] || 'column'
  
  if (compact) {
    return (
      <span style={{ color: '#059669' }}>
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
