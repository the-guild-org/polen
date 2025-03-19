import { FC } from 'react'
import { GraphQLNamedType } from 'graphql'
import { useParams } from 'react-router-dom'
import { TypeList } from './TypeList'
import { TypeDetails } from './TypeDetails'

export interface Props {
  types: GraphQLNamedType[]
}

export const ColumnView: FC<Props> = ({ types }) => {
  const { name, viewName = 'column' } = useParams<{ name: string; viewName: string }>()
  const type = name ? types.find(t => t.name === name) : undefined

  const entryPoints = types.filter(t => [
    'Query',
    'Mutation',
    'Subscription'
  ].includes(t.name))

  const otherTypes = types.filter(t => !entryPoints.includes(t))

  return (
    <div className="content">
      <div className="sidebar">
        <TypeList 
          types={entryPoints} 
          title="Entry Points" 
          className="entry-points" 
          viewName={viewName}
        />
        <TypeList 
          types={otherTypes} 
          title="Index" 
          viewName={viewName}
        />
      </div>
      {type && <TypeDetails type={type} />}
    </div>
  )
}
