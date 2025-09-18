import type { NavbarProps } from '#api/hooks/types'
import type { ReactRouter } from '#dep/react-router/index'
import { route } from '#lib/react-router-effect/route'
import type { Stores } from '#template/stores/$'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import logoSrc from 'virtual:polen/project/assets/logo.svg'
import { templateConfig } from 'virtual:polen/project/config'
import { examplesCatalog } from 'virtual:polen/project/examples'
import * as projectHooks from 'virtual:polen/project/hooks'
import { navbar } from 'virtual:polen/project/navbar'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { Logo } from '../components/Logo.js'
import { DefaultNavbar } from '../components/navbar/DefaultNavbar.js'
import { Item } from '../components/navbar/Item.js'
import { NotFound } from '../components/NotFound.js'
import { ThemeToggle } from '../components/ThemeToggle.js'
import { ToastContainer } from '../components/ToastContainer.js'
import { Container } from '../components/ui/index.js'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext.js'
import { cn } from '../lib/utils.js'
import { changelog } from './changelog/_.js'
import { examplesRoute } from './examples/_.js'
import { index } from './index.js'
import { pages } from './pages.js'
import { reference } from './reference.js'

export const Component = () => {
  return (
    <>
      <ThemeProvider>
        <Layout />
      </ThemeProvider>
      <ScrollRestoration />
    </>
  )
}

const Layout = () => {
  const { appearance } = useTheme()
  const location = useLocation()

  // Check if we're on home page with cinematic hero
  const isHomeWithCinematicHero = location.pathname === '/'
    && templateConfig.home.enabled
    && templateConfig.home.hero.enabled
    && templateConfig.home.hero.layout === 'cinematic'

  const navbarProps: NavbarProps = {
    items: navbar,
    Item,
    Logo: () => (
      <LinkReactRouter
        to='/'
        className='text-inherit no-underline'
      >
        <div className='block'>
          <Logo
            src={logoSrc}
            title={templateConfig.templateVariables.title}
            height={30}
            showTitle={true}
          />
        </div>
      </LinkReactRouter>
    ),
    ThemeToggle,
  }

  const NavbarComponent = projectHooks.navbar || DefaultNavbar

  return (
    <div
      className={cn(
        'min-h-screen',
        appearance === 'dark' ? 'dark' : '',
      )}
    >
      <div className='max-w-[1440px] mx-auto'>
        {/* Navbar */}
        {isHomeWithCinematicHero
          ? (
            // Cinematic hero mode: navbar is fixed overlay
            <div className='dark'>
              <nav className='fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm'>
                <Container size='xl' className='py-6'>
                  <NavbarComponent {...navbarProps} />
                </Container>
              </nav>
            </div>
          )
          : (
            // Normal mode: navbar in grid flow
            <nav className='border-b border-border mb-4 md:mb-8'>
              <Container size='xl' className='py-6'>
                <NavbarComponent {...navbarProps} />
              </Container>
            </nav>
          )}
        <Outlet />
        <ToastContainer />
      </div>
    </div>
  )
}

const children: ReactRouter.RouteObject[] = []

// Conditionally add index route based on home.enabled
// When home is disabled, reference page becomes the root
if (templateConfig.home.enabled !== false) {
  children.push(index)
} else if (reference && templateConfig.schema?.enabled) {
  // When home is disabled and reference exists, make reference the index
  // We'll handle this by adding a redirect from index route
  children.push(index)
}

children.push(pages)

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Examples Routes
//
//
//
//

// Add examples route if examples are configured and the catalog exists
if (templateConfig.examples && examplesCatalog && examplesCatalog.examples && examplesCatalog.examples.length > 0) {
  children.push(examplesRoute)
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Changelog Routes
//
//
//
//

if (schemasCatalog && changelog) {
  children.push(changelog)
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Reference Routes
//
//
//
//

// Add reference route if schema catalog exists
if (reference && templateConfig.schema?.enabled) {
  children.push(reference)
}

// Catch all route for 404
children.push({
  path: '*',
  Component: NotFound,
})

const storeModules = import.meta.glob('../stores/!($.*)*.ts', { eager: true }) as Record<
  string,
  Stores.StoreModule
>

export const root = route({
  path: `/`,
  Component,
  loader: async () => {
    // Important: Reset all stores on SSR to prevent cross-request pollution
    // Without this, store state from one request would leak into another
    if (import.meta.env.SSR) {
      for (const module of Object.values(storeModules)) {
        if (module.store?.reset) {
          module.store.reset()
        }
      }
    }

    return {}
  },
  children,
})
