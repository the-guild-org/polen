import { Box, Card, Heading, Section, Tabs, Text } from '@radix-ui/themes'
import { highlight } from 'codehike/code'
import * as React from 'react'
import { CodeBlock } from '../CodeBlock.js'

interface Props {
  examples?: Array<{
    label: string
    language: string
    code: string
  }>
}

const defaultExamples = [
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `// Install the GraphQL client
npm install graphql-request

// Make your first query
import { request } from 'graphql-request'

const query = \`
  query GetData {
    # Your query here
  }
\`

const data = await request('/graphql', query)
console.log(data)`,
  },
  {
    label: 'cURL',
    language: 'bash',
    code: `# Make a GraphQL request with cURL
curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"query": "{ __typename }"}' \\
  https://api.example.com/graphql`,
  },
  {
    label: 'Python',
    language: 'python',
    code: `# Install the GraphQL client
# pip install gql[requests]

from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

transport = RequestsHTTPTransport(url="https://api.example.com/graphql")
client = Client(transport=transport)

query = gql("""
  query GetData {
    # Your query here
  }
""")

result = client.execute(query)
print(result)`,
  },
]

export const QuickStartSection: React.FC<Props> = ({ examples = defaultExamples }) => {
  // Pre-highlight code blocks during render
  const [highlightedExamples, setHighlightedExamples] = React.useState<
    Array<{
      label: string
      codeblock: any
    }>
  >([])

  React.useEffect(() => {
    const highlightExamples = async () => {
      const highlighted = await Promise.all(
        examples.map(async (example) => ({
          label: example.label,
          codeblock: await highlight(
            { value: example.code, lang: example.language, meta: '' },
            { theme: 'github-light' },
          ),
        })),
      )
      setHighlightedExamples(highlighted)
    }
    highlightExamples()
  }, [examples])

  if (highlightedExamples.length === 0) {
    return (
      <Section size='3' pb='8'>
        <Box style={{ textAlign: 'center' }}>
          <Text color='gray'>Loading examples...</Text>
        </Box>
      </Section>
    )
  }

  return (
    <Section size='3' pb='8'>
      <Box style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Heading size='7' mb='2' style={{ textAlign: 'center' }}>
          Quick Start
        </Heading>
        <Text size='3' color='gray' mb='6' style={{ textAlign: 'center', display: 'block' }}>
          Get up and running in minutes
        </Text>

        <Card size='3'>
          <Tabs.Root defaultValue={highlightedExamples[0]?.label || 'javascript'}>
            <Tabs.List>
              {highlightedExamples.map((example) => (
                <Tabs.Trigger key={example.label} value={example.label}>
                  {example.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Box pt='4'>
              {highlightedExamples.map((example) => (
                <Tabs.Content key={example.label} value={example.label}>
                  <CodeBlock codeblock={example.codeblock} />
                </Tabs.Content>
              ))}
            </Box>
          </Tabs.Root>
        </Card>
      </Box>
    </Section>
  )
}
