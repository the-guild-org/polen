import type { FC } from 'react'
import type { GraphQLNamedType } from 'graphql'
import { Link, useLocation } from 'react-router-dom'
import { Box, Heading, Card, Flex, Text } from '@radix-ui/themes'

export interface Props {
  types: GraphQLNamedType[]
  title: string
  viewName?: string
}

export const TypeList: FC<Props> = ({ types, title, viewName = `column` }) => {
  const location = useLocation()
  const currentPath = location.pathname.split(`/`).pop()

  return (
    <Box>
      <Heading size="2" mb="2" weight="medium" color="gray">{title}</Heading>
      <Card variant="surface">
        <Flex direction="column">
          {types.map(type => {
            const isActive = currentPath === type.name
            return (
              <Box
                key={type.name}
                style={{
                  borderBottom: isActive ? `none` : `1px solid var(--gray-6)`,
                  backgroundColor: isActive ? `var(--blue-9)` : `transparent`
                }}
              >
                <Link 
                  to={`/view/${viewName}/type/${type.name}`}
                  style={{ 
                    display: `block`,
                    textDecoration: `none`
                  }}
                >
                  <Box p="2">
                    <Text 
                      as="span"
                      size="2"
                      weight="regular"
                      color={isActive ? `gray` : `blue`}
                      style={{ 
                        display: `block`,
                        color: isActive ? `white` : `var(--blue-11)`
                      }}
                    >
                    {type.name}
                    </Text>
                  </Box>
                </Link>
              </Box>
            )
          })}
        </Flex>
      </Card>
    </Box>
  )
}
