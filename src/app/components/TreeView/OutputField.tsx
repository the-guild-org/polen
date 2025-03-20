import type { GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import { Grafaid } from '../../utils/grafaid'
import { TypeLink } from '../TypeLink'
import { OutputFields } from './OutputFields'

export type FieldWithType = GraphQLField<any, any> & {
  parentType: GraphQLObjectType | GraphQLInterfaceType,
}

export interface Props {
  field: FieldWithType
  toggleType: (typeName: string) => void
  openTypes: ReadonlySet<string>
}

/**
 * Renders a field and its nested fields recursively when expanded
 */
export const OutputField = ({
  field,
  toggleType,
  openTypes,
}: Props) => {
  const fieldType = field.type
  const isExpandable = Grafaid.isExpandableType(fieldType)
  const typeKey = `${field.parentType.name}.${field.name}`
  const isExpanded = isExpandable && openTypes.has(typeKey)

  const unwrappedType = Grafaid.getUnwrappedType(fieldType)

  return (
    <div
      style={{
        display: `grid`,
        gridTemplateColumns: `subgrid`,
        gridColumnStart: `1`,
        gridColumnEnd: `3`,
        padding: `0.25rem 0`,
        fontFamily: `monospace`,
        fontSize: `0.9rem`,
      }}
    >
      <div
        style={{
          gridColumn: `1 / 2`,
          overflow: `visible`,
        }}
      >
        <div>
          <span>{field.name}</span>
          {field.args.length > 0 && (
            <span
              style={{
                color: `#6B7280`,
                fontSize: `0.9rem`,
                marginLeft: `0.25rem`,
              }}
            >
              (...)
            </span>
          )}
        </div>
        {field.description && (
          <div
            style={{
              color: `#666`,
              fontSize: `0.9em`,
              fontFamily: `system-ui`,
              maxWidth: `40ch`,
              marginTop: `-0.25rem`,
            }}
          >
            {/* {field.description} */}
          </div>
        )}
      </div>
      <div
        style={{
          color: `#059669`,
          whiteSpace: `nowrap`,
          gridColumn: `2 / 3`,
        }}
      >
        <TypeLink
          type={fieldType}
          isToggleable={isExpandable}
          onToggle={() => {
            if (isExpandable) toggleType(typeKey)
          }}
          isExpanded={isExpanded}
          compact
        />
      </div>

      {isExpanded && Grafaid.isObjectOrInterfaceType(unwrappedType) && (
        <OutputFields
          style={{
            gridColumn: `1 / 3`,
          }}
          parentType={unwrappedType}
          toggleType={toggleType}
          openTypes={openTypes}
        />
      )}
    </div>
  )
}
