import { Grafaid } from '#lib/grafaid'
import { Schema } from '#lib/schema/$'
import { Code, Flex } from '@radix-ui/themes'
import { isNamedType } from 'graphql'
import type React from 'react'
import { TypeKindIcon } from '../../graphql/graphql.js'
import { typeKindTokensIndex } from '../../graphql/type-kind-tokens.js'
import { ReferenceLink } from '../../reference/ReferenceLink.js'
import { ChangeBase } from '../ChangeBase.js'

export const TypeOperation: React.FC<{ change: any; schema?: Schema.Schema }> = ({ change, schema }) => {
  // Helper to render a type name with icon if we have the schema
  const renderTypeName = (name: string, kind?: string) => {
    if (!schema) {
      return <Code>{name}</Code>
    }

    const type = schema.definition.getType(name)

    if (type && isNamedType(type)) {
      // Use the actual type kind from the schema if available
      const actualKind = kind || Grafaid.Schema.typeKindFromClass(type)

      // Only render if we have a valid kind
      if (actualKind in typeKindTokensIndex) {
        return (
          <ReferenceLink type={name}>
            <Flex align='center' gap='1' display='inline-flex'>
              <TypeKindIcon kind={actualKind as Grafaid.Schema.TypeKindName} />
              {` `}
              <Code color={typeKindTokensIndex[actualKind as Grafaid.Schema.TypeKindName].color} variant='ghost'>
                {name}
              </Code>
            </Flex>
          </ReferenceLink>
        )
      }
    }

    // Fallback if type not found or no schema - just show with kind if provided
    if (kind && kind in typeKindTokensIndex) {
      return (
        <Flex align='center' gap='1' display='inline-flex'>
          <TypeKindIcon kind={kind as Grafaid.Schema.TypeKindName} />
          {` `}
          <Code color={typeKindTokensIndex[kind as Grafaid.Schema.TypeKindName].color} variant='ghost'>{name}</Code>
        </Flex>
      )
    }

    return <Code>{name}</Code>
  }

  switch (change._tag) {
    case `TYPE_ADDED`:
      return (
        <ChangeBase change={change}>
          Added type {renderTypeName(change.name)}
        </ChangeBase>
      )
    case `TYPE_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed type {renderTypeName(change.name)}
        </ChangeBase>
      )
    case `TYPE_KIND_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed type {renderTypeName(change.name, change.newKind)} from {change.oldKind} to {change.newKind}
        </ChangeBase>
      )
  }
}
