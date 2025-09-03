import type { HeroCallToAction, HeroConfig } from '#api/config/home'
import { CatalogStatistics } from '#lib/catalog-statistics/$'
import { Box, Button, Flex, Heading, Section, Text } from '@radix-ui/themes'
import { buildSchema } from 'graphql'
import * as React from 'react'
import { Link } from 'react-router'
import { examplesCatalog } from 'virtual:polen/project/examples'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.json'
import { templateVariables } from 'virtual:polen/template/variables'

interface HeroProps extends HeroConfig {
}

export const Hero: React.FC<HeroProps> = ({
  title = templateVariables.title || 'GraphQL Developer Portal',
  tagline = 'Explore and integrate with our GraphQL API',
  callToActions,
  heroImage,
}) => {
  // Build smart default CTAs based on conventions
  const getDefaultCTAs = () => {
    const defaults = []

    // If examples directory has files, add "View Examples" button
    if (examplesCatalog && examplesCatalog.examples && examplesCatalog.examples.length > 0) {
      defaults.push({
        label: 'View Examples',
        href: '#examples',
        variant: 'primary' as const,
      })
    }

    // TODO: Check if playground is enabled, if is, add
    // defaults.push({
    //   label: 'Explore Playground',
    //   href: '/playground',
    //   variant: defaults.length === 0 ? 'primary' as const : 'secondary' as const,
    // })

    // Always add schema reference as last button
    defaults.push({
      label: 'View Reference',
      href: '/reference',
      variant: 'secondary' as const,
    })

    return defaults
  }

  // Process callToActions configuration
  let ctaButtons: HeroCallToAction[]
  if (callToActions) {
    if (Array.isArray(callToActions)) {
      // Simple array - use as-is (replaces defaults)
      ctaButtons = [...callToActions]
    } else {
      // Object with before/after/over - TypeScript needs help here
      const ctaConfig = callToActions as {
        before?: readonly HeroCallToAction[]
        after?: readonly HeroCallToAction[]
        over?: readonly HeroCallToAction[]
      }
      if (ctaConfig.over) {
        ctaButtons = [...ctaConfig.over]
      } else {
        const defaults = getDefaultCTAs()
        ctaButtons = [
          ...(ctaConfig.before || []),
          ...defaults,
          ...(ctaConfig.after || []),
        ]
      }
    }
  } else {
    // Use smart defaults
    ctaButtons = getDefaultCTAs()
  }
  // Calculate schema stats if available
  const schemaStats = React.useMemo(() => {
    if (!PROJECT_SCHEMA) return null

    try {
      // Get the first schema version
      const schemaKeys = Object.keys(PROJECT_SCHEMA)
      if (schemaKeys.length === 0) return null

      const firstKey = schemaKeys[0]
      if (!firstKey) return null

      const schemaData = PROJECT_SCHEMA[firstKey]
      if (!schemaData || typeof schemaData !== 'string') return null

      // Skip if this is just a catalog type indicator
      if (!schemaData.startsWith('{')) return null

      // Parse the schema JSON and build GraphQL schema
      const schemaJson = JSON.parse(schemaData)

      // Build SDL from the JSON (assuming it contains SDL string)
      if (schemaJson.sdl) {
        const schema = buildSchema(schemaJson.sdl)
        const versionStats = CatalogStatistics.analyzeSchema(schema, 'current')

        // Application-level summarization for hero display
        return {
          types: versionStats.totalTypes,
          queries: versionStats.queries,
          mutations: versionStats.mutations,
          subscriptions: versionStats.subscriptions,
        }
      }

      // Fallback to simple counting if no SDL
      const types = schemaJson.types || []
      const queryType = types.find((t: any) => t.name === 'Query')
      const mutationType = types.find((t: any) => t.name === 'Mutation')
      const subscriptionType = types.find((t: any) => t.name === 'Subscription')

      return {
        types: types.filter((t: any) => !t.name.startsWith('__')).length,
        queries: queryType?.fields?.length || 0,
        mutations: mutationType?.fields?.length || 0,
        subscriptions: subscriptionType?.fields?.length || 0,
      }
    } catch (error) {
      console.warn('Failed to calculate schema stats:', error)
      return null
    }
  }, [])

  // Try to load hero image dynamically from public folder
  // Start with prop value or common default paths
  const [heroImageSrc, setHeroImageSrc] = React.useState<string | null>(
    heroImage || '/hero.svg', // Default to hero.svg if it exists
  )

  React.useEffect(() => {
    // Only search for hero image if not provided via prop
    if (heroImage) return

    // Try different image extensions
    const tryLoadImage = async () => {
      // Check common image formats in public folder
      const imageNames = [
        'hero.svg',
        'hero.png',
        'hero.jpg',
        'hero.jpeg',
        'hero.webp',
        'hero-image.png',
        'hero-image.jpg',
        'hero-banner.png',
        'hero-banner.jpg',
      ]

      for (const imageName of imageNames) {
        try {
          const response = await fetch(`/${imageName}`)
          if (response.ok) {
            setHeroImageSrc(`/${imageName}`)
            return
          }
        } catch {
          // Continue trying other names
        }
      }
      // If no image found, clear the state
      setHeroImageSrc(null)
    }
    tryLoadImage()
  }, [heroImage])

  return (
    <Section size='3' pb='8'>
      {heroImageSrc && (
        <Box mb='6' style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <img
            src={heroImageSrc}
            alt='Hero'
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          />
        </Box>
      )}
      <Box style={{ textAlign: 'center' }}>
        <Heading size='9' mb='4'>
          {title}
        </Heading>

        <Text size='5' color='gray' mb='6' style={{ maxWidth: '600px', margin: '0 auto 24px' }}>
          {tagline}
        </Text>

        <Flex gap='4' justify='center' mb='6'>
          {ctaButtons.map((cta, index) => {
            const isExternal = cta.href.startsWith('http') || cta.href.startsWith('#')
            const variant = cta.variant || (index === 0 ? 'primary' : 'secondary')
            const buttonVariant = variant === 'primary' ? 'solid' : 'soft'

            if (isExternal) {
              return (
                <Button key={index} size='3' variant={buttonVariant} asChild>
                  <a href={cta.href}>{cta.label}</a>
                </Button>
              )
            }

            return (
              <Button key={index} size='3' variant={buttonVariant} asChild>
                <Link to={cta.href}>{cta.label}</Link>
              </Button>
            )
          })}
        </Flex>

        {schemaStats && (
          <Flex gap='6' justify='center' style={{ opacity: 0.8 }}>
            <Text size='2' color='gray'>
              <strong>{schemaStats.types}</strong> Types
            </Text>
            <Text size='2' color='gray'>
              <strong>{schemaStats.queries}</strong> Queries
            </Text>
            {schemaStats.mutations > 0 && (
              <Text size='2' color='gray'>
                <strong>{schemaStats.mutations}</strong> Mutations
              </Text>
            )}
            {schemaStats.subscriptions > 0 && (
              <Text size='2' color='gray'>
                <strong>{schemaStats.subscriptions}</strong> Subscriptions
              </Text>
            )}
          </Flex>
        )}
      </Box>
    </Section>
  )
}
