import { GraphQLInterfaceType, GraphQLObjectType } from 'graphql';
import { OutputField } from './OutputField';

export interface Props {
  parentType: GraphQLObjectType | GraphQLInterfaceType;
  toggleType: (typeName: string) => void;
  openTypes: ReadonlySet<string>;
}

/**
 * Renders a list of fields for a GraphQL type
 */
export const OutputFields = ({
  parentType,
  toggleType,
  openTypes,
}: Props) => {
  return (
    <div
      style={{
        marginLeft: '0.5rem',
        paddingLeft: '1rem',
        marginTop: '0.5rem',
        borderLeft: '1px solid #ccc',
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
  );
};
