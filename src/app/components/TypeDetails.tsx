import type { FC } from 'react'
import { useEffect } from 'react'
import type { GraphQLNamedType, GraphQLField, GraphQLArgument } from 'graphql'
import { Link, useLocation, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { TypeLink } from './TypeLink'
import { ArgumentDetails } from './ArgumentDetails'
import { Grafaid } from '../utils/grafaid'
import { Card, Heading, Box, Text, Flex, Code, ScrollArea } from '@radix-ui/themes'

export interface Props {
  type: GraphQLNamedType
}

export const TypeDetails: FC<Props> = ({ type }) => {
  const fields = Grafaid.isTypeWithFields(type)
    ? type.getFields()
    : null
  const location = useLocation()
  const { fieldName } = useParams<{ fieldName?: string }>()

  // Scroll to field if hash is present
  useEffect(() => {
    if (location.hash) {
      const fieldId = location.hash.slice(1) // Remove the # from the hash
      const element = document.getElementById(fieldId)
      if (element) {
        element.scrollIntoView({ behavior: `smooth` })
      }
    }
  }, [location.hash])

  // Function to render a single field
  const renderField = (fieldKey: string, field: GraphQLField<any, any>) => (
    <Box key={fieldKey} id={fieldKey} mb="4" p="3" style={{ borderBottom: `1px solid var(--gray-6)` }}>
      <Flex justify="between" mb="2">
        <Link
          to={`#${fieldKey}`}
          style={{ 
            textDecoration: `none`
          }}
          title="Direct link to this field"
        >
          <Text 
            size="3" 
            weight="medium" 
            color={location.hash === `#${fieldKey}` ? `blue` : `gray`}
          >
            {fieldKey}
          </Text>
        </Link>
        <TypeLink type={field.type} />
      </Flex>
      {field.description && (
        <Box mt="2">
          <Text as="div" color="gray" size="2">
            <ReactMarkdown>{field.description}</ReactMarkdown>
          </Text>
        </Box>
      )}
      {field.args.length > 0 && (
        <Box mt="3">
          <Heading size="2" mb="2" align="left">Arguments</Heading>
          {field.args.map((arg: GraphQLArgument) => <ArgumentDetails key={arg.name} arg={arg} />)}
        </Box>
      )}
    </Box>
  )

  return (
    <Card variant="surface" size="2">
      <Heading size="5" mb="4" align="left">
        {type.name}
        {fieldName && (
          <Text as="span" size="3" color="gray" ml="2">
            » {fieldName}
          </Text>
        )}
      </Heading>
      {fields
        ? (
          <Box>
            {fieldName && fields[fieldName]
              ? renderField(fieldName, fields[fieldName])
              : Object.entries(fields).map(([key, field]) => renderField(key, field))}
          </Box>
        )
        : (
          <ScrollArea>
            <Box p="3">
              <Code size="2" style={{ display: `block` }}>

              {type.toString()}
              </Code>
            </Box>
          </ScrollArea>
        )}
    </Card>
  )
}
