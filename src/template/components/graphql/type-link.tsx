import { Grafaid } from '#lib/grafaid'
import { Code, Flex, HoverCard, Text } from '@radix-ui/themes'
import React from 'react'
import { Description } from '../Description.js'
import { ReferenceLink } from '../ReferenceLink.js'
import { TypeKindIcon } from './graphql.js'
import { typeKindTokensIndex } from './type-kind-tokens.js'

export const TypeLink: React.FC<{
  type: Grafaid.Schema.TypesLike.Named
  showDescription?: boolean
}> = ({ type, showDescription = false }) => {
  const kind = Grafaid.Schema.typeKindFromClass(type)
  const hasDescription = type.description && type.description.trim() !== ''

  const linkContent = (
    // <a href='https://foo.bar'>
    <ReferenceLink type={type.name}>
      <Flex align='center' gap='1' display='inline-flex'>
        <TypeKindIcon kind={kind} />
        {` `}
        <Code color={typeKindTokensIndex[kind].color} variant='ghost'>{type.name}</Code>
      </Flex>
    </ReferenceLink>
    // {/*</a>*/}
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
