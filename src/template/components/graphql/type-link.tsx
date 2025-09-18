import { Grafaid } from 'graphql-kit'
import React from 'react'
import { Description } from '../reference/Description.js'
import { ReferenceLink } from '../reference/ReferenceLink.js'
import { Code, Flex, HoverCard, Text } from '../ui/index.js'
import { TypeKindIcon } from './graphql.js'
import { typeKindTokensIndex } from './type-kind-tokens.js'

export const TypeLink: React.FC<{
  type: Grafaid.Schema.TypesLike.Named
  showDescription?: boolean
}> = ({ type, showDescription = false }) => {
  const kind = Grafaid.Schema.typeKindFromClass(type)
  const hasDescription = type.description && type.description.trim() !== ''

  const linkContent = (
    <>
      <style>
        {`
          .type-link-content:hover code:not(:first-child) {
            text-decoration: underline;
            text-underline-offset: 2px;
          }
        `}
      </style>
      <ReferenceLink type={type.name} className='type-link-content'>
        <Flex
          align='center'
          gap='1'
          display='inline-flex'
        >
          <TypeKindIcon kind={kind} />
          {` `}
          <Code color={typeKindTokensIndex[kind].color} variant='ghost'>{type.name}</Code>
        </Flex>
      </ReferenceLink>
    </>
  )

  // Only show HoverCard if showDescription is true AND description exists
  if (!showDescription || !hasDescription) {
    return linkContent
  }

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        {linkContent}
      </HoverCard.Trigger>
      <HoverCard.Content
        size='2'
        maxWidth='400px'
        side='top'
        align='center'
      >
        <Text size='2' color='gray'>
          <Description data={type} />
        </Text>
      </HoverCard.Content>
    </HoverCard.Root>
  )
}
