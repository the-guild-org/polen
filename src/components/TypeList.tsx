import { FC } from 'react'
import { GraphQLNamedType } from 'graphql'
import { Link, useLocation } from 'react-router-dom'

export interface Props {
  types: GraphQLNamedType[]
  title: string
  className?: string
}

export const TypeList: FC<Props> = ({ types, title, className = '' }) => {
  const location = useLocation()
  const currentPath = location.pathname.split('/').pop()

  return (
    <div className="sidebar-section">
      <h3 className="sidebar-title">{title}</h3>
      <ul className={`type-list ${className}`}>
        {types.map((type) => (
          <li
            key={type.name}
            className={currentPath === type.name ? 'active' : ''}
          >
            <Link to={`/type/${type.name}`}>{type.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
