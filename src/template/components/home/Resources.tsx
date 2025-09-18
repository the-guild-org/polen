// TODO: Review and replace inline styles with Tailwind classes
import * as React from 'react'
import { Link } from 'react-router'
import { Box, Button, Card, Container, Flex, Grid, Heading, Text } from '../ui/index.js'

interface ResourceLink {
  title: string
  description?: string
  href: string
  icon?: string
  external?: boolean
}

interface ResourcesProps {
  links?: ResourceLink[]
  communityLinks?: Array<{
    platform: string
    href: string
    icon?: string
  }>
  supportContact?: {
    email?: string
    href?: string
    text?: string
  }
}

const defaultLinks: ResourceLink[] = [
  {
    title: 'API Reference',
    description: 'Complete schema documentation',
    href: '/reference',
    icon: '📚',
  },
  {
    title: 'Playground',
    description: 'Interactive GraphQL explorer',
    href: '/playground',
    icon: '🎮',
  },
  {
    title: 'Changelog',
    description: 'Version history and updates',
    href: '/changelog',
    icon: '📝',
  },
  {
    title: 'Getting Started',
    description: 'Quick start guide',
    href: '/guides/quick-start',
    icon: '🚀',
  },
]

const getCommunityIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    github: '🐙',
    discord: '💬',
    slack: '💼',
    twitter: '🐦',
    x: '🐦',
    bluesky: '🦋',
    mastodon: '🐘',
    stackoverflow: '🤔',
    reddit: '🤖',
  }
  return icons[platform.toLowerCase()] || '🔗'
}

export const ResourcesSection: React.FC<ResourcesProps> = ({
  links = defaultLinks,
  communityLinks = [],
  supportContact,
}) => {
  return (
    <Container size='lg' style={{ background: 'var(--gray-2)' }}>
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Box mb='6' style={{ textAlign: 'center' }}>
          <Heading size='6' mb='2'>
            Resources & Support
          </Heading>
          <Text size='3' color='gray'>
            Everything you need to work with our API
          </Text>
        </Box>

        {/* Main resource links */}
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap='lg' mb='6'>
          {links.map((link, index) => (
            <Card key={index} size='2' asChild>
              <Link to={link.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Flex direction='column' gap='2'>
                  {link.icon && (
                    <Text size='6' style={{ lineHeight: 1 }}>
                      {link.icon}
                    </Text>
                  )}
                  <Box>
                    <Text size='3' weight='medium'>
                      {link.title}
                      {link.external && ' ↗'}
                    </Text>
                    {link.description && (
                      <Text size='2' color='gray' mt='1'>
                        {link.description}
                      </Text>
                    )}
                  </Box>
                </Flex>
              </Link>
            </Card>
          ))}
        </Grid>

        {/* Community and support section */}
        {(communityLinks.length > 0 || supportContact) && (
          <Card size='3'>
            <Flex justify='between' align='start' wrap='wrap' gap='4'>
              {/* Community links */}
              {communityLinks.length > 0 && (
                <Box>
                  <Text size='2' weight='medium' color='gray' mb='3'>
                    Community
                  </Text>
                  <Flex gap='3'>
                    {communityLinks.map((link, index) => (
                      <Button
                        key={index}
                        size='2'
                        variant='ghost'
                        asChild
                      >
                        <a
                          href={link.href}
                          target='_blank'
                          rel='noopener noreferrer'
                          style={{ textDecoration: 'none' }}
                        >
                          <Flex align='center' gap='1'>
                            <Text>{link.icon || getCommunityIcon(link.platform)}</Text>
                            <Text style={{ textTransform: 'capitalize' }}>
                              {link.platform}
                            </Text>
                          </Flex>
                        </a>
                      </Button>
                    ))}
                  </Flex>
                </Box>
              )}

              {/* Support contact */}
              {supportContact && (
                <Box>
                  <Text size='2' weight='medium' color='gray' mb='3'>
                    Need Help?
                  </Text>
                  <Flex direction='column' gap='2'>
                    {supportContact.email && (
                      <Text size='2'>
                        Email:{' '}
                        <a
                          href={`mailto:${supportContact.email}`}
                          style={{ color: 'var(--accent-9)' }}
                        >
                          {supportContact.email}
                        </a>
                      </Text>
                    )}
                    {supportContact.href && (
                      <Button size='2' variant='soft' asChild>
                        <a
                          href={supportContact.href}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {supportContact.text || 'Contact Support'}
                        </a>
                      </Button>
                    )}
                  </Flex>
                </Box>
              )}

              {/* API Status (optional placeholder) */}
              <Box>
                <Text size='2' weight='medium' color='gray' mb='3'>
                  API Status
                </Text>
                <Flex align='center' gap='2'>
                  <Box
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--green-9)',
                    }}
                  />
                  <Text size='2'>All systems operational</Text>
                </Flex>
              </Box>
            </Flex>
          </Card>
        )}
      </Box>
    </Container>
  )
}
