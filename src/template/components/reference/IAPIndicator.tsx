import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Box, Flex, HoverCard, Separator, Text } from '@radix-ui/themes'
import type { GraphQLInputObjectType } from 'graphql'
import type { FC } from 'react'
import { TypeLink } from '../graphql/type-link.js'

interface Props {
  inputObject: GraphQLInputObjectType
}

/**
 * Indicator for Input Argument Pattern (IAP) - shows when a field
 * has a single 'input' argument with an Input Object type
 */
export const IAPIndicator: FC<Props> = ({ inputObject }) => {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <Flex
          align='center'
          gap='1'
          style={{
            cursor: 'pointer',
            opacity: 0.7,
            display: 'inline-flex',
          }}
        >
          <InfoCircledIcon style={{ width: 12, height: 12 }} />
          <Text size='1' color='gray'>input</Text>
        </Flex>
      </HoverCard.Trigger>
      <HoverCard.Content size='2' maxWidth='400px'>
        <Flex direction='column' gap='3'>
          <Flex direction='column' gap='2'>
            <Box>
              <TypeLink type={inputObject} />
            </Box>
            {inputObject.description && (
              <Text size='2' color='gray' style={{ lineHeight: '1.5' }}>
                {inputObject.description}
              </Text>
            )}
          </Flex>
          {inputObject.description && <Separator size='4' />}
          <Flex direction='column' gap='2'>
            <Text size='2' color='gray'>
              This field uses an input-only argument pattern. The fields shown below belong to the input object, not
              direct field arguments.
            </Text>
            <Box>
              <Text size='1' color='gray' weight='medium'>
                Example usage:
              </Text>
              <Box
                mt='1'
                style={{
                  padding: '8px',
                  backgroundColor: 'var(--gray-2)',
                  borderRadius: '4px',
                  fontFamily: 'var(--code-font-family)',
                }}
              >
                <Text size='1' style={{ whiteSpace: 'pre' }}>
                  {`mutation {\n  fieldName(input: { a: 1, b: "value", ... }) {\n    ...\n  }\n}`}
                </Text>
              </Box>
            </Box>
          </Flex>
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  )
}
