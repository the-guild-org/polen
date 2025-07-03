/**
 * Unified demo configuration
 * Replaces .github/demo-config.json with a TypeScript configuration
 */

import type { DemoConfigData } from '../src/lib/demos/config-schema.ts'

export const demoConfig: DemoConfigData = {
  examples: {
    order: [`hive`, `pokemon`],
    minimumVersion: `0.9.0`,
    exclude: [`github`],
  },
  // todo all this config here should be the defaults
  deployment: {
    basePaths: {
      '/latest/': `Stable releases`,
      '/next/': `Next/beta releases`,
    },
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
    gc: {
      retainStableVersions: true,
      retainCurrentCycle: true,
      retainDays: 30,
    },
  },
  ui: {
    // rename branding to content
    branding: {
      title: `Polen Demos`,
      description: `Interactive GraphQL API documentation`,
    },
    // todo: all this config here should be the defaults
    theme: {
      primaryColor: `#000`,
      backgroundColor: `#fff`,
      textColor: `#000`,
      mutedTextColor: `#666`,
    },
  },
  // remove this metadata property
  metadata: {
    // lift concept of disabled demos to the 'examples' section
    // keep 'exclude' there as a way to totally ignore something from the demos system
    // add a new property 'disabled' that is similar to exclude but allows it to be listed in the ui
    //   ... it should be typed as { example: '...', reason: '...' }[]
    disabledDemos: {
      github: {
        title: `GitHub API`,
        description: `Browse GitHub's extensive GraphQL API with over 1600 types.`,
        reason: `Currently disabled due to build performance.`,
      },
    },
  },
}

export default demoConfig
