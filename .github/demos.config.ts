import type { DemoOptions } from '../src/lib/demos/config-options.ts'

export default {
  examples: {
    order: [`hive`, `pokemon`],
    minimumVersion: `0.9.0`,
    disabled: [
      {
        example: `github`,
        reason: `Currently disabled due to build performance.`,
      },
    ],
  },
  deployment: {
    redirects: [
      {
        from: `pokemon`,
        to: `/latest/pokemon/`,
      },
      {
        from: `star-wars`,
        to: `/latest/star-wars/`,
      },
    ],
  },
  ui: {},
} satisfies DemoOptions
