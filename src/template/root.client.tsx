'use client'

import { Box, Flex, Grid, Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import type { Theme as ThemeManager } from '#lib/theme/$'
import { Link } from './components/Link.js'
import { Logo } from './components/Logo.js'
import { ThemeToggle } from './components/ThemeToggle.js'
import { ThemeProvider } from './contexts/ThemeContext.client.js'

interface LayoutClientProps {
  children: React.ReactNode
  navbarItems: Array<{ pathExp: string; title: string }>
  logoSrc: string
  title: string
  initialTheme?: ThemeManager.Theme
}

export function LayoutClient({
  children,
  navbarItems,
  logoSrc,
  title,
  initialTheme,
}: LayoutClientProps) {
  const header = (
    <Flex
      gridArea='header'
      align='center'
      gap={{ initial: '4', md: '8' }}
      pb='4'
      mb={{ initial: '4', md: '8' }}
      style={{
        borderBottom: '1px solid var(--gray-3)',
      }}
    >
      <Link
        to='/'
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        <Box display={{ initial: 'block', md: 'block' }}>
          <Logo src={logoSrc} title={title} height={30} showTitle={true} />
        </Box>
      </Link>
      <Flex direction='row' gap='4' style={{ flex: 1 }}>
        {navbarItems.map((item, key) => (
          <Link key={key} color='gray' to={item.pathExp}>
            {item.title}
          </Link>
        ))}
      </Flex>
      <ThemeToggle />
    </Flex>
  )

  return (
    <Theme>
      <ThemeProvider initialTheme={initialTheme}>
        <Grid
          width={{ initial: '100%', sm: '100%', md: 'var(--container-4)' }}
          maxWidth='100vw'
          areas={{
            initial: `'header' 'content'`,
            sm: `'header' 'content'`,
            md:
              `'header header header header header header header header' 'content content content content content content content content'`,
          }}
          rows='min-content auto'
          columns={{ initial: '1fr', sm: '1fr', md: 'repeat(8, 1fr)' }}
          gapX={{ initial: '0', sm: '0', md: '2' }}
          my={{ initial: '0', sm: '0', md: '8' }}
          mx='auto'
          px={{ initial: '4', sm: '4', md: '0' }}
          py={{ initial: '4', sm: '4', md: '0' }}
        >
          {header}
          <Box gridArea='content' className='prose'>
            {children}
          </Box>
        </Grid>
      </ThemeProvider>
    </Theme>
  )
}
