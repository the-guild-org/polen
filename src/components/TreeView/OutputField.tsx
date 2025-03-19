import { GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from 'graphql';
import { Grafaid } from '../../utils/grafaid';
import { TypeLink } from '../TypeLink';
import { OutputFields } from './OutputFields';

export type FieldWithType = GraphQLField<any, any> & {
  parentType: GraphQLObjectType | GraphQLInterfaceType,
};

export interface Props {
  field: FieldWithType;
  toggleType: (typeName: string) => void;
  openTypes: ReadonlySet<string>;
}

/**
 * Renders a field and its nested fields recursively when expanded
 */
export const OutputField = ({
  field,
  toggleType,
  openTypes,
}: Props) => {
  const fieldType = field.type;
  const isExpandable = Grafaid.isExpandableType(fieldType);
  const typeKey = `${field.parentType.name}.${field.name}`;
  const isExpanded = isExpandable && openTypes.has(typeKey);

  const unwrappedType = Grafaid.getUnwrappedType(fieldType);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        padding: '0.25rem 0',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        marginLeft: '0',
        marginTop: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          width: '100%',
          gridTemplateColumns: 'min-content 1fr',
          columnGap: '2rem',
          alignItems: 'baseline',
        }}
      >
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'visible',
            justifySelf: 'start',
          }}
        >
          <span style={{ display: 'inline-flex', flexWrap: 'nowrap', alignItems: 'baseline' }}>
            <span>{field.name}</span>
            {field.args.length > 0 && (
              <span
                style={{
                  color: '#6B7280',
                  fontSize: '0.9rem',
                  marginLeft: '0.25rem',
                }}
              >
                (...)
              </span>
            )}
          </span>
        </div>
        <div
          style={{
            color: '#059669',
            whiteSpace: 'nowrap',
            justifySelf: 'start',
          }}
        >
          <TypeLink
            type={fieldType}
            isToggleable={isExpandable}
            onToggle={() => isExpandable && toggleType(typeKey)}
            isExpanded={isExpanded}
            compact
          />
        </div>
      </div>
      {(field.description || field.args.length > 0) && (
        <div
          style={{
            marginLeft: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {field.description && (
            <div
              style={{
                color: '#666',
                fontSize: '0.9em',
                fontFamily: 'system-ui',
                maxWidth: '60ch',
                marginTop: '-0.25rem',
              }}
            >
              {field.description}
            </div>
          )}
        </div>
      )}

      {isExpanded && Grafaid.isObjectOrInterfaceType(unwrappedType) && (
        <OutputFields
          parentType={unwrappedType}
          toggleType={toggleType}
          openTypes={openTypes}
        />
      )}
    </div>
  );
};
