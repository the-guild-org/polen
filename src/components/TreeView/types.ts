import { 
  GraphQLNamedType, 
  GraphQLField, 
  GraphQLObjectType, 
  GraphQLInterfaceType,
  GraphQLArgument,
  GraphQLSchema
} from 'graphql'

export interface Props {
  types: readonly GraphQLNamedType[]
  schema?: GraphQLSchema
}

export type FieldWithType = GraphQLField<any, any> & { 
  parentType: GraphQLObjectType | GraphQLInterfaceType 
}

export interface TypeSectionProps {
  type: GraphQLObjectType | GraphQLInterfaceType
  isExpanded: boolean
  toggleType: (typeName: string) => void
  openTypes: ReadonlySet<string>
}

export interface FieldRenderProps {
  field: FieldWithType
  toggleType: (typeName: string) => void
  openTypes: ReadonlySet<string>
}

export interface FieldRenderOptions {
  isCompact?: boolean
  longestFieldNameLength?: number
}
