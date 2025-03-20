import React from 'react'
import type { GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import { OutputFields } from './OutputFields'

export interface Props {
  type: GraphQLObjectType | GraphQLInterfaceType
  isExpanded: boolean
  toggleType: (typeName: string) => void
  openTypes: ReadonlySet<string>
}

/**
 * This component renders the fields of a type as a list.
 * It is used inside the TypeSection component.
 * It is called "OutputFields" because it is used to render the fields of an object type,
 * which are the fields returned by the field resolvers of the type.
 */
export const RootPositionType: React.FC<Props> = ({
  type,
  isExpanded,
  toggleType,
  openTypes,
}) => {
  return (
    <div
      key={type.name}
      style={{
        display: `flex`,
        flexDirection: `column`,
        gap: `0.25rem`,
        fontFamily: `monospace`,
        fontSize: `0.9rem`,
        marginTop: `1rem`,
      }}
    >
      <div style={{ display: `flex`, alignItems: `center`, gap: `0.5rem` }}>
        <button
          onClick={() => {
            toggleType(type.name)
          }}
          style={{
            border: `none`,
            background: `none`,
            padding: `0 0.25rem`,
            cursor: `pointer`,
            fontFamily: `inherit`,
          }}
        >
          {isExpanded ? `▼` : `▶`}
        </button>
        <span style={{ fontWeight: `bold` }}>
          {type.name}
        </span>
      </div>
      {type.description && (
        <div
          style={{
            marginLeft: `1.75rem`,
            color: `#666`,
            fontSize: `0.9em`,
            fontFamily: `system-ui`,
            maxWidth: `60ch`,
          }}
        >
          {type.description}
        </div>
      )}
      {isExpanded && (
        <OutputFields
          parentType={type}
          toggleType={toggleType}
          openTypes={openTypes}
        />
      )}
    </div>
  )
}
