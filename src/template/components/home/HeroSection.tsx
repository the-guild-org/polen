import type { HeroCallToAction } from '#api/config/home'
import { CatalogStatistics } from '#lib/catalog-statistics/$'
import { Catalog } from '#lib/catalog/$'
import { Swiss } from '#lib/swiss'
import { Box, Button, Container, Flex, Grid, Heading, Section, Text } from '@radix-ui/themes'
import * as React from 'react'
import { Link } from 'react-router'
import heroImageSrc from 'virtual:polen/project/assets/hero'
import { templateConfig } from 'virtual:polen/project/config'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { schemasCatalog } from 'virtual:polen/project/schemas'

interface HeroProps {
  title?: string
  tagline?: string
  callToActions?: HeroCallToAction[] | {
    before?: readonly HeroCallToAction[]
    after?: readonly HeroCallToAction[]
    over?: readonly HeroCallToAction[]
  }
  heroImage?: string
  layout?: 'asymmetric' | 'cinematic' | 'auto'
}

export const Hero: React.FC<HeroProps> = ({
  title = templateConfig.templateVariables.title || 'GraphQL Developer Portal',
  tagline = 'Explore and integrate with our GraphQL API',
  callToActions,
  heroImage,
  layout = 'asymmetric',
}) => {
  // Build smart default CTAs based on conventions
  const getDefaultCTAs = () => {
    const defaults = []

    // If examples directory has files, add "View Examples" button
    if (examplesCatalog && examplesCatalog.examples && examplesCatalog.examples.length > 0) {
      defaults.push({
        label: 'View Examples',
        href: '/examples',
        variant: 'primary' as const,
      })
    }

    // Add schema reference button if schema catalog exists
    if (schemasCatalog) {
      defaults.push({
        label: 'View Reference',
        href: '/reference',
        variant: 'secondary' as const,
      })
    }

    return defaults
  }

  // Process callToActions configuration
  let ctaButtons: HeroCallToAction[]
  if (callToActions) {
    if (Array.isArray(callToActions)) {
      ctaButtons = [...callToActions]
    } else {
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
    ctaButtons = getDefaultCTAs()
  }

  // Calculate schema stats if available
  let schemaStats = null
  if (schemasCatalog) {
    try {
      const latestSchema = Catalog.getLatest(schemasCatalog)
      if (latestSchema && latestSchema.definition) {
        const versionStats = CatalogStatistics.analyzeSchema(latestSchema.definition, 'current')
        schemaStats = {
          types: versionStats.totalTypes,
          queries: versionStats.queries,
          mutations: versionStats.mutations,
          subscriptions: versionStats.subscriptions,
        }
      }
    } catch (error) {
      console.warn('Failed to calculate schema stats:', error)
    }
  }

  // Use the statically imported hero image or the prop
  const imageSrc = heroImage || heroImageSrc

  // Auto layout now defaults to asymmetric
  const effectiveLayout = layout === 'auto'
    ? 'asymmetric'
    : layout

  // Render asymmetric layout (text left, image right)
  if (effectiveLayout === 'asymmetric') {
    return (
      <Swiss.Body>
        <Section size='4' py='9'>
          <Container size='4'>
            <Grid columns='12' gap='5' align='center'>
              {/* Text content - columns 1-7 */}
              <Box style={{ gridColumn: '1 / 8' }}>
                <Heading
                  size='9'
                  mb='5'
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                    fontWeight: 900,
                  }}
                >
                  {title}
                </Heading>

                <Text
                  size='4'
                  color='gray'
                  mb='7'
                  style={{
                    maxWidth: '420px',
                    display: 'block',
                    lineHeight: 1.6,
                  }}
                >
                  {tagline}
                </Text>

                <Flex gap='3' wrap='wrap' mb='8'>
                  {ctaButtons.map((cta, index) => {
                    const isExternal = cta.href.startsWith('http') || cta.href.startsWith('#')
                    const isPrimary = cta.variant === 'primary' || (index === 0 && !cta.variant)

                    if (isExternal) {
                      return (
                        <Button
                          key={index}
                          size='3'
                          variant={isPrimary ? 'solid' : 'outline'}
                          asChild
                        >
                          <a href={cta.href}>{cta.label}</a>
                        </Button>
                      )
                    }

                    return (
                      <Button
                        key={index}
                        size='3'
                        variant={isPrimary ? 'solid' : 'outline'}
                        asChild
                      >
                        <Link to={cta.href}>{cta.label}</Link>
                      </Button>
                    )
                  })}
                </Flex>

                {schemaStats && (
                  <Flex gap='4' style={{ opacity: 0.8 }}>
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

              {/* Image - columns 9-13 */}
              {imageSrc && (
                <Box
                  style={{
                    gridColumn: '9 / 13',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  <img
                    src={imageSrc}
                    alt='Hero'
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxWidth: '480px',
                      maxHeight: '420px',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              )}
            </Grid>
          </Container>
        </Section>
      </Swiss.Body>
    )
  }

  // Render cinematic layout (full viewport image with overlaid text)
  return (
    <Swiss.Viewport>
      <Box
        style={{
          display: 'grid',
          placeItems: 'center',
          height: '85vh',
          minHeight: '600px',
          position: 'relative',
          ...(imageSrc
            ? {
              background: `
              radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%),
              linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%),
              url(${imageSrc})
            `,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
            : {
              background: 'var(--gray-2)',
            }),
        }}
      >
        {/* Content centered via grid placeItems */}
        <Container size='4' style={{ position: 'relative', zIndex: 3 }}>
          <Box
            style={{
              textAlign: 'center',
              padding: '2rem',
            }}
          >
            <Heading
              size='9'
              mb='5'
              style={{
                fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.04em',
                fontWeight: 900,
                color: imageSrc ? 'white' : 'inherit',
                textShadow: imageSrc ? '0 2px 20px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.8)' : 'none',
              }}
            >
              {title}
            </Heading>

            <Text
              as='p'
              size='6'
              mb='7'
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                display: 'block',
                lineHeight: 1.5,
                color: imageSrc ? 'white' : 'var(--gray-11)',
                textShadow: imageSrc ? '0 1px 10px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.8)' : 'none',
                opacity: imageSrc ? 0.95 : 1,
              }}
            >
              {tagline}
            </Text>

            <Flex gap='3' justify='center' wrap='wrap' mb='8' mt='9'>
              {ctaButtons.map((cta, index) => {
                const isExternal = cta.href.startsWith('http') || cta.href.startsWith('#')
                const isPrimary = cta.variant === 'primary' || (index === 0 && !cta.variant)

                if (isExternal) {
                  return (
                    <Button
                      key={index}
                      size='4'
                      variant={isPrimary ? 'solid' : 'outline'}
                      asChild
                    >
                      <a href={cta.href}>{cta.label}</a>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={index}
                    size='4'
                    variant={isPrimary ? 'solid' : 'outline'}
                    asChild
                  >
                    <Link to={cta.href}>{cta.label}</Link>
                  </Button>
                )
              })}
            </Flex>

            {/*todo: refactor, a component for a stat, DRY */}
            {schemaStats && (
              <Flex gap='6' justify='center'>
                <Text
                  size='3'
                  style={{
                    color: imageSrc ? 'white' : 'var(--gray-11)',
                    textShadow: imageSrc ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                    opacity: imageSrc ? 0.9 : 0.8,
                  }}
                >
                  <strong>{schemaStats.types}</strong> Types
                </Text>
                <Text
                  size='3'
                  style={{
                    color: imageSrc ? 'white' : 'var(--gray-11)',
                    textShadow: imageSrc ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                    opacity: imageSrc ? 0.9 : 0.8,
                  }}
                >
                  <strong>{schemaStats.queries}</strong> Queries
                </Text>
                {schemaStats.mutations > 0 && (
                  <Text
                    size='3'
                    style={{
                      color: imageSrc ? 'white' : 'var(--gray-11)',
                      textShadow: imageSrc ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                      opacity: imageSrc ? 0.9 : 0.8,
                    }}
                  >
                    <strong>{schemaStats.mutations}</strong> Mutations
                  </Text>
                )}
                {schemaStats.subscriptions > 0 && (
                  <Text
                    size='3'
                    style={{
                      color: imageSrc ? 'white' : 'var(--gray-11)',
                      textShadow: imageSrc ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                      opacity: imageSrc ? 0.9 : 0.8,
                    }}
                  >
                    <strong>{schemaStats.subscriptions}</strong> Subscriptions
                  </Text>
                )}
              </Flex>
            )}
          </Box>
        </Container>
      </Box>
    </Swiss.Viewport>
  )
}
