import { defineConfig } from 'vitepress'
import PolenManifest from '../package.json' with { type: 'json' }

const isCi = Boolean(process.env.CI)

export default defineConfig({
  title: 'Polen',
  description: PolenManifest.description,
  base: isCi ? '/polen/' : undefined,
  themeConfig: {
    siteTitle: 'Polen',
    logo: '/logo.svg',
    docFooter: {
      next: false,
      prev: false,
    },
    nav: [
      { text: 'Why', link: '/overview/why' },
      { text: 'Guides', link: '/overview/getting-started' },
      { text: 'Changelog', link: 'https://github.com/the-guild-org/polen/releases' },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Getting Started', link: '/overview/getting-started' },
          { text: 'Why', link: '/overview/why' },
          { text: 'Project', link: '/overview/project' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Pages', link: '/features/pages' },
          { text: 'Schema Reference', link: '/features/schema-reference' },
          { text: 'Schema Changelog', link: '/features/schema-changelog' },
          { text: 'Logo', link: '/features/logo' },
          { text: 'Config', link: '/features/config' },
        ],
      },
      {
        text: 'Deployment (SSG)',
        items: [
          { text: 'Overview', link: '/deployment-ssg/overview' },
          { text: 'Rebasing', link: '/deployment-ssg/rebasing' },
          {
            text: 'Service GitHub Pages',
            link: '/deployment-ssg/service-github-pages',
          },
        ],
      },
      {
        text: 'Deployment (SSR)',
        items: [{ text: 'Overview', link: '/deployment-ssr/overview' }],
      },
      {
        text: 'Reference',
        items: [
          { text: 'CLI', link: '/reference/cli' },
          { text: 'API', link: '/reference/api' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/the-guild-org/polen' },
    ],
  },
})
