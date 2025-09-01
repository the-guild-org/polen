import { defineConfig } from 'polen/polen'

export default defineConfig({
  name: 'Test Simple',
  schema: {
    useSources: ['file'],
    sources: {
      file: {
        path: './schema.graphql',
      },
    },
  },
  home: {
    hero: {
      title: 'Test Simple GraphQL API',
      description: 'A simple test API for Polen development',
      callToActions: [
        { label: 'Try Playground', href: '/playground', variant: 'primary' },
        { label: 'View Docs', href: '/reference', variant: 'secondary' },
      ],
    },
    socialProof: {
      title: 'Used By Leading Teams',
      logos: ['Company A', 'Company B', 'Company C'],
    },
    resources: {
      communityLinks: [
        { platform: 'GitHub', href: 'https://github.com/the-guild-org/polen' },
        { platform: 'Discord', href: 'https://discord.gg/graphql' },
      ],
      supportContact: {
        email: 'support@example.com',
      },
    },
  },
})
