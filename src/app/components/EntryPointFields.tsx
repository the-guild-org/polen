import type { FC } from 'react'
import type { GraphQLObjectType } from 'graphql'
import { Link, useLocation } from 'react-router-dom'
import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes'
import { TypeLink } from './TypeLink'
import { Grafaid } from '../utils/grafaid'

export interface Props {
  type: GraphQLObjectType
  viewName?: string
}

export const EntryPointFields: FC<Props> = ({ type, viewName = `column` }) => {
  const location = useLocation()
  const currentPath = location.pathname.split(`/`).pop()
  const fields = Grafaid.isTypeWithFields(type) 
    ? type.getFields() 
    : null

  if (!fields) return null

  return (
    <Box>
      <Heading size="2" mb="2" weight="medium" color="gray" align="left">{type.name}</Heading>
      <Card variant="surface">
        <Flex direction="column">
          {Object.entries(fields).map(([fieldName, field]) => {
            const fieldPath = `${type.name}.${fieldName}`
            // Check if current path is the field name or ends with /{fieldName}
            const isActive = currentPath === fieldName || location.pathname.endsWith(`/${fieldName}`)
            
            return (
              <Box
                key={fieldPath}
                style={{
                  borderBottom: isActive ? `none` : `1px solid var(--gray-6)`,
                  backgroundColor: isActive ? `var(--blue-9)` : `transparent`
                }}
              >
                <Link 
                  to={`/view/${viewName}/type/${type.name}/${fieldName}`}
                  style={{ 
                    display: `block`,
                    textDecoration: `none`
                  }}
                >
                  <Box p="2">
                    <Flex justify="between" align="center">
                      <Text 
                        as="span"
                        size="2"
                        weight="regular"
                        style={{ 
                          color: isActive ? `white` : `var(--blue-11)`
                        }}
                      >
                        {fieldName}
                      </Text>
                      <TypeLink type={field.type} compact />
                    </Flex>
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
