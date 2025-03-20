import type { FC } from 'react'
import type { GraphQLNamedType } from 'graphql'
import { Link, useLocation } from 'react-router-dom'

export interface Props {
  types: GraphQLNamedType[]
  title: string
  className?: string
  viewName?: string
}

export const TypeList: FC<Props> = ({ types, title, className = ``, viewName = `column` }) => {
  const location = useLocation()
  const currentPath = location.pathname.split(`/`).pop()

  return (
    <div className="sidebar-section">
      <h3 className="sidebar-title">{title}</h3>
      <ul className={`type-list ${className}`}>
        {types.map(type => (
          <li
            key={type.name}
            className={currentPath === type.name ? `active` : ``}
          >
            <Link to={`/view/${viewName}/type/${type.name}`}>{type.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
