// TODO: Review and replace inline styles with Tailwind classes
import { Catalog, CatalogStatistics, Schema, Version } from 'graphql-kit'
import { Link } from 'react-router'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { Box, Card, Container, Flex, Grid, Heading, Text } from '../ui/index.js'

interface FeaturesGridProps {
  features?: Feature[]
}

interface Feature {
  title: string
  value: string | number
  description?: string
  link?: string
}

export const FeaturesGridSection: React.FC<FeaturesGridProps> = ({ features }) => {
  const defaultFeatures = getDefaultFeatures()
  const displayFeatures = features || defaultFeatures

  return (
    <Container size='lg' pb='8'>
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Heading size='7' mb='2' style={{ textAlign: 'center' }}>
          API at a Glance
        </Heading>
        <Text size='3' color='gray' mb='6' style={{ textAlign: 'center', display: 'block' }}>
          Key metrics and resources
        </Text>

        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap='lg'>
          {displayFeatures.map((feature, index) => <FeatureCard key={index} {...feature} />)}
        </Grid>
      </Box>
    </Container>
  )
}

const FeatureCard: React.FC<Feature> = ({ title, value, description, link }) => {
  const content = (
    <Card size='3' style={{ height: '100%', cursor: link ? 'pointer' : 'default' }}>
      <Flex direction='column' gap='2'>
        <Text size='6' weight='bold' style={{ lineHeight: 1 }}>
          {value}
        </Text>
        <Text size='2' weight='medium'>
          {title}
        </Text>
        {description && (
          <Text size='1' color='gray'>
            {description}
          </Text>
        )}
      </Flex>
    </Card>
  )

  if (link) {
    if (link.startsWith('http')) {
      return (
        <a href={link} target='_blank' rel='noopener noreferrer' style={{ textDecoration: 'none' }}>
          {content}
        </a>
      )
    }
    return (
      <Link to={link} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    )
  }

  return content
}

function getDefaultFeatures(): Feature[] {
  const features: Feature[] = []

  if (schemasCatalog) {
    try {
      // Get the latest schema from the catalog
      const latestSchema = Catalog.getLatest(schemasCatalog)

      if (latestSchema && latestSchema.definition) {
        // Build stats from the schema definition
        const version = Schema.getVersion(latestSchema) ?? Version.Custom.make({ value: 'current' })
        const versionStats = CatalogStatistics.analyzeSchema(
          latestSchema.definition,
          version,
        )

        features.push({
          title: 'Types',
          value: versionStats.totalTypes || 0,
          description: 'GraphQL types',
          link: '/reference',
        })

        features.push({
          title: 'Fields',
          value: versionStats.totalFields || 0,
          description: 'Total fields',
          link: '/reference',
        })

        features.push({
          title: 'Changelog',
          value: '📝',
          description: 'Recent updates',
          link: '/changelog',
        })

        return features
      }
    } catch (error) {
      console.warn('Failed to parse schema for features:', error)
    }
  }

  // Add static features only if no schema features were added
  if (features.length === 0) {
    features.push({
      title: 'Documentation',
      value: '📚',
      description: 'Guides & tutorials',
      link: '/guides',
    })

    features.push({
      title: 'Changelog',
      value: '📝',
      description: 'Recent updates',
      link: '/changelog',
    })
  }

  return features
}
