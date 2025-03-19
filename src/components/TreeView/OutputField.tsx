import { GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from 'graphql';
import { Grafaid } from '../../utils/grafaid';
import { TypeLink } from '../TypeLink';

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

  // Get the unwrapped type (removing List and NonNull wrappers)
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
          gridTemplateColumns: 'minmax(auto, max-content) 1fr',
          alignItems: 'baseline',
          width: '100%',
          gap: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            overflow: 'visible',
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
            justifySelf: 'start',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
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
          {
            /* {field.args.length > 0 && (
              <div
                style={{
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  backgroundColor: '#f5f5f5',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  maxWidth: '60ch',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {field.args.map((arg: GraphQLArgument) => (
                    <div
                      key={arg.name}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ color: '#6B7280', minWidth: '8rem' }}>{arg.name}:</span>
                      <TypeLink type={arg.type} compact />
                    </div>
                  ))}
                </div>
              </div>
            )} */
          }
        </div>
      )}

      {/* Render nested fields recursively when expanded */}
      {isExpanded && Grafaid.isObjectOrInterfaceType(unwrappedType) && (
        <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
          {Object.values(unwrappedType.getFields()).map(nestedField => (
            <OutputField
              key={nestedField.name}
              field={{
                ...nestedField,
                parentType: unwrappedType,
              }}
              toggleType={toggleType}
              openTypes={openTypes}
            />
          ))}
        </div>
      )}
    </div>
  );
};
