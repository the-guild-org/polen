import type { GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import { Grafaid } from '../../utils/grafaid'
import { TypeLink } from '../TypeLink'
import { OutputFields } from './OutputFields'
import { Box, Flex, Text } from '@radix-ui/themes'

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
    <Box
      style={{
        display: `grid`,
        gridTemplateColumns: `subgrid`,
        gridColumnStart: `1`,
        gridColumnEnd: `3`,
        padding: `0.25rem 0`,
        fontFamily: `monospace`,
      }}
    >
      <Box
        style={{
          gridColumn: `1 / 2`,
          overflow: `visible`,
        }}
      >
        <Flex>
          <Text size="2">{field.name}</Text>
          {field.args.length > 0 && (
            <Text
              size="1"
              color="gray"
              ml="1"
            >
              (...)
            </Text>
          )}
        </Flex>
        {field.description && (
          <Box style={{ maxWidth: `40ch`, marginTop: `-0.25rem` }}>
            <Text
              size="1"
              color="gray"
              style={{ fontFamily: `system-ui` }}
            >
              {/* {field.description} */}
            </Text>
          </Box>
        )}
      </Box>
      <Box
        style={{
          whiteSpace: `nowrap`,
          gridColumn: `2 / 3`,
          color: `var(--green-11)`,
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
      </Box>

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
    </Box>
  )
}
