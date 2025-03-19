import { FC } from 'react'
import { GraphQLType } from 'graphql'
import { Link, useLocation } from 'react-router-dom'

export interface Props {
  type: GraphQLType
}

export const TypeLink: FC<Props> = ({ type }) => {
  const location = useLocation()
  const baseType = type.toString().replace(/[!\[\]]/g, '')
  
  return (
    <Link 
      to={`/type/${baseType}`}
      state={{ from: location.pathname }}
      className="type-link"
    >
      {type.toString()}
    </Link>
  )
}
