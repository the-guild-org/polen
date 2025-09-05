import { defineConfig } from 'vitepress'
import PolenManifest from '../package.json' with { type: 'json' }

export default defineConfig({
  title: 'Polen',
  description: PolenManifest.description,
  base: undefined,
  cleanUrls: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  themeConfig: {
    siteTitle: 'Polen',
    logo: '/logo.svg',
    outline: {
      level: [2, 3],
    },
    docFooter: {
      next: false,
      prev: false,
    },
    nav: [
      { text: 'Why', link: '/guides/why' },
      { text: 'Guides', link: '/guides/get-started' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Examples', link: '/examples/overview' },
      {
        text: 'Changelog',
        link: 'https://github.com/the-guild-org/polen/releases',
      },
    ],
    sidebar: {
      '/guides/': [
        {
          text: 'Overview',
          items: [
            { text: 'Get Started', link: '/guides/get-started' },
            { text: 'Why', link: '/guides/why' },
            { text: 'Project', link: '/guides/project' },
            { text: 'Package', link: '/guides/package' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Home Page', link: '/guides/features/home-page' },
            {
              text: 'Arbirary Pages',
              link: '/guides/features/arbitrary-pages',
            },
            {
              text: 'Schema Overview',
              link: '/guides/features/schema-overview',
            },
            {
              text: 'Schema Augmentations',
              link: '/guides/features/schema-augmentations',
            },
            {
              text: 'Schema Reference',
              link: '/guides/features/schema-reference',
            },
            {
              text: 'Examples',
              link: '/guides/features/examples',
            },
            {
              text: 'Schema Changelog',
              link: '/guides/features/schema-changelog',
            },
            { text: 'Navbar', link: '/guides/features/navbar' },
            { text: 'Logo', link: '/guides/features/logo' },
            { text: 'Configuration', link: '/guides/features/configuration' },
          ],
        },
        {
          text: 'Deployment (SSG)',
          items: [
            { text: 'Overview', link: '/guides/deployment-ssg/overview' },
            { text: 'Rebasing', link: '/guides/deployment-ssg/rebasing' },
            {
              text: 'Service GitHub Pages',
              link: '/guides/deployment-ssg/service-github-pages',
            },
          ],
        },
        {
          text: 'Deployment (SSR)',
          items: [
            { text: 'Overview', link: '/guides/deployment-ssr/overview' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'CLI', link: '/reference/cli' },
            { text: 'API', link: '/reference/api' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/overview' },
            { text: 'Hive', link: '/examples/hive' },
            { text: 'Pokemon', link: '/examples/pokemon' },
            { text: 'Rocky Trails', link: '/examples/rocky-trails' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/the-guild-org/polen' },
    ],
  },
})
