import type { GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import { OutputField } from './OutputField'

export interface Props {
  parentType: GraphQLObjectType | GraphQLInterfaceType
  toggleType: (typeName: string) => void
  openTypes: ReadonlySet<string>
  style?: React.CSSProperties
}

/**
 * Renders a list of fields for a GraphQL type
 */
export const OutputFields = ({
  parentType,
  toggleType,
  openTypes,
  style,
}: Props) => {
  return (
    <div
      style={{
        display: `grid`,
        gridTemplateColumns: `minmax(1rem,auto) minmax(1rem,auto)`,
        marginLeft: `0.5rem`,
        paddingLeft: `1rem`,
        marginTop: `0.5rem`,
        borderLeft: `1px solid #ccc`,
        ...style,
      }}
    >
      {Object.values(parentType.getFields()).map(field => (
        <OutputField
          key={field.name}
          field={{
            ...field,
            parentType,
          }}
          toggleType={toggleType}
          openTypes={openTypes}
        />
      ))}
    </div>
  )
}
