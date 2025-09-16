import { Box, Flex, HoverCard, Text } from '@radix-ui/themes'
import type { GraphQLArgument } from 'graphql'
import { Grafaid } from 'graphql-kit'
import type { FC } from 'react'
import { useViewMode } from '../../contexts/ViewModeContext.js'
import { Description } from './Description.js'
import { TypeAnnotation } from './TypeAnnotation.js'

export interface Props {
  data: GraphQLArgument
  nameWidth?: number
}

/**
 * Renders a single GraphQL argument with aligned columns
 */
export const ArgumentAnnotation: FC<Props> = ({ data, nameWidth }) => {
  const { viewMode } = useViewMode()

  const nameElement = (
    <Text size='2' weight='bold' color='gray'>
      {data.name}
    </Text>
  )

  return (
    <Box>
      <Flex align='baseline' gap='2'>
        <Box
          style={{
            minWidth: nameWidth ? `${nameWidth}ch` : 'auto',
            flexShrink: 0,
          }}
        >
          {viewMode === 'compact' && data.description
            ? (
              <HoverCard.Root>
                <HoverCard.Trigger>
                  {nameElement}
                </HoverCard.Trigger>
                <HoverCard.Content
                  size='2'
                  maxWidth='400px'
                  side='top'
                  align='center'
                >
                  <Text size='2' color='gray'>
                    <Description data={data} />
                  </Text>
                </HoverCard.Content>
              </HoverCard.Root>
            )
            : nameElement}
        </Box>
        <TypeAnnotation type={data.type} showDescription={true} />
        {data.defaultValue !== undefined && (
          <Text size='2' color='gray'>
            {' = '}
            {Grafaid.Schema.formatDefaultValue(data.defaultValue, data.type)}
          </Text>
        )}
      </Flex>
      {/* Argument description below name/type (only in expanded mode) */}
      {data.description && viewMode === 'expanded' && (
        <Box mt='2'>
          <Text size='2' color='gray' style={{ lineHeight: '1.5' }}>
            <Description data={data} />
          </Text>
        </Box>
      )}
    </Box>
  )
}
