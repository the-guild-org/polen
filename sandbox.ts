//
//
//
//
//
// Temporary Work File
//
// ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//
// – Use freely
// – Try to remember to not commit changes
// – Included by development TypeScript configuration
// – Excluded by build TypeScript configuration
//
//

/**
 * Test if vite-plugin-ssr-css is working properly
 */

// Test to see if the plugin is properly configured
console.log(`Testing vite-plugin-ssr-css integration...`)

// The plugin should inject a link to virtual:ssr-css.css in development
// Let's verify our configuration is correct

import { vitePluginSsrCss } from '@hiogawa/vite-plugin-ssr-css'

const plugin = vitePluginSsrCss({
  entries: [`/src/template/entry.client.tsx`],
})

console.log(`Plugin name:`, plugin.name)
console.log(`Plugin config:`, plugin)
