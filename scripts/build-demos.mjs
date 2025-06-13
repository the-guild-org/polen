#!/usr/bin/env zx

// Build demos locally for testing GitHub Pages deployment

import { $ } from 'zx'

$.verbose = true

console.log('🔨 Building Polen...')
await $`pnpm build`

console.log('🔗 Re-installing to link workspace packages...')
await $`pnpm install`

console.log('🏠 Building demos landing page...')
await $`node ./scripts/build-demos-index.mjs`

console.log('⚡ Building Pokemon demo...')
await $`NODE_OPTIONS="--max-old-space-size=6144" pnpm --dir examples/pokemon build`

// GitHub demo disabled - schema too large for efficient SSG
// console.log('🐙 Building GitHub demo...')
// await $`NODE_OPTIONS="--max-old-space-size=6144" pnpm --dir examples/github build`

// Copy built demos
console.log('📋 Copying demo builds...')
// dist-demos already created by build-demos-index.mjs
await $`cp --recursive examples/pokemon/build dist-demos/pokemon`
// await $`cp --recursive examples/github/build dist-demos/github`

console.log('✅ Demo build complete! Files are in dist-demos/')
console.log('📡 To preview locally, run: npx serve dist-demos')
