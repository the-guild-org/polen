import { Box, Flex, Heading, Section, Text } from '@radix-ui/themes'
import * as React from 'react'

interface Logo {
  name: string
  src: string
  href?: string
}

interface SocialProofProps {
  title?: string
  logos: Array<string | Logo>
}

export const SocialProof: React.FC<SocialProofProps> = ({
  title = 'Trusted By',
  logos,
}) => {
  if (!logos || logos.length === 0) {
    return null
  }

  // Normalize logos to Logo objects
  const normalizedLogos: Logo[] = logos.map(logo => {
    if (typeof logo === 'string') {
      // Auto-generate path from string name
      const kebabName = logo.toLowerCase().replace(/\s+/g, '-')
      return {
        name: logo,
        src: `/logos/${kebabName}.svg`,
      }
    }
    return logo
  })

  return (
    <Section size='3' style={{ background: 'var(--gray-2)' }}>
      <Box style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <Heading size='5' mb='5' color='gray'>
          {title}
        </Heading>

        <Flex
          wrap='wrap'
          justify='center'
          align='center'
          gap='6'
          style={{
            filter: 'grayscale(100%)',
            opacity: 0.7,
          }}
        >
          {normalizedLogos.map((logo, index) => {
            const LogoImage = (
              <img
                src={logo.src}
                alt={logo.name}
                style={{
                  height: '40px',
                  maxWidth: '150px',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  // Hide image if it fails to load
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )

            if (logo.href) {
              return (
                <a
                  key={index}
                  href={logo.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7'
                  }}
                >
                  {LogoImage}
                </a>
              )
            }

            return (
              <Box key={index} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {LogoImage}
              </Box>
            )
          })}
        </Flex>

        {/* Optional testimonial or description */}
        <Text size='2' color='gray' mt='5' style={{ maxWidth: '600px', margin: '24px auto 0' }}>
          Join thousands of developers building with our GraphQL API
        </Text>
      </Box>
    </Section>
  )
}
