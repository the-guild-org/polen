// TODO: Review and replace inline styles with Tailwind classes
import { highlight } from 'codehike/code'
import type { GraphQLSchema } from 'graphql'
import * as React from 'react'
import { Link } from 'react-router'
import { templateConfig } from 'virtual:polen/project/config'
import { GraphQLInteractive } from '../GraphQLInteractive/GraphQLInteractive.js'
import { Box, Button, Card, Container, Flex, Heading, Text } from '../ui/index.js'

interface PlaygroundPreviewProps {
  schema?: GraphQLSchema
  exampleQuery?: string
}

const defaultQuery = `# Welcome to the GraphQL Playground
# Try running this query to explore the API

query ExploreAPI {
  __schema {
    queryType {
      name
      fields {
        name
        description
      }
    }
  }
}`

export const PlaygroundPreviewSection: React.FC<PlaygroundPreviewProps> = ({
  schema,
  exampleQuery = defaultQuery,
}) => {
  const [highlightedCode, setHighlightedCode] = React.useState<any>(null)

  React.useEffect(() => {
    const highlightQuery = async () => {
      const highlighted = await highlight(
        { value: exampleQuery, lang: 'graphql', meta: 'interactive' },
        { theme: 'github-light' },
      )
      setHighlightedCode(highlighted)
    }
    highlightQuery()
  }, [exampleQuery])

  if (!highlightedCode) {
    return null
  }
  return (
    <Container size='lg' pb='8' id='playground'>
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Heading size='7' mb='2' style={{ textAlign: 'center' }}>
          Try It Out
        </Heading>
        <Text size='3' color='gray' mb='6' style={{ textAlign: 'center', display: 'block' }}>
          Explore the API with our interactive playground
        </Text>

        <Flex gap='4' direction='column'>
          <Card size='3'>
            <Flex direction='column' gap='3'>
              <Box>
                <Text size='2' weight='medium' color='gray' mb='2'>
                  Example Query
                </Text>
                {schema
                  ? (
                    <GraphQLInteractive
                      codeblock={highlightedCode}
                      schema={schema}
                      showWarningIfNoSchema={false}
                      referenceEnabled={templateConfig.reference.enabled}
                    />
                  )
                  : (
                    <GraphQLInteractive
                      codeblock={highlightedCode}
                      showWarningIfNoSchema={false}
                      referenceEnabled={templateConfig.reference.enabled}
                    />
                  )}
              </Box>

              <Flex gap='3' justify='between' align='center' pt='3' style={{ borderTop: '1px solid var(--gray-4)' }}>
                <Text size='2' color='gray'>
                  This is a preview of our interactive GraphQL explorer
                </Text>
                <Button size='2' asChild>
                  <Link to='/playground'>Open Full Playground →</Link>
                </Button>
              </Flex>
            </Flex>
          </Card>

          <Flex gap='4' wrap='wrap' justify='center'>
            <FeatureCard
              title='Schema Explorer'
              description='Browse types, fields, and relationships'
              icon='📚'
            />
            <FeatureCard
              title='Auto-complete'
              description='IntelliSense for queries and mutations'
              icon='✨'
            />
            <FeatureCard
              title='Mock Data'
              description='Test with realistic generated data'
              icon='🎲'
            />
            <FeatureCard
              title='Query History'
              description='Save and share your queries'
              icon='📝'
            />
          </Flex>
        </Flex>
      </Box>
    </Container>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => (
  <Card size='2' style={{ flex: '1 1 200px', maxWidth: '250px' }}>
    <Flex direction='column' gap='2' align='center' style={{ textAlign: 'center' }}>
      <Text size='6'>{icon}</Text>
      <Text size='2' weight='medium'>
        {title}
      </Text>
      <Text size='1' color='gray'>
        {description}
      </Text>
    </Flex>
  </Card>
)
