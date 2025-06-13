#!/usr/bin/env zx

// Build demos locally for testing GitHub Pages deployment

import { $ } from 'zx'

$.verbose = true

console.log('🔨 Building Polen...')
await $`pnpm build`

console.log('🏠 Building demos landing page...')
await $`NODE_OPTIONS="--max-old-space-size=6144" pnpm --dir examples/demos build`

console.log('🐙 Building GitHub demo...')
await $`NODE_OPTIONS="--max-old-space-size=6144" pnpm --dir examples/github build`

console.log('⚡ Building Pokemon demo...')
await $`NODE_OPTIONS="--max-old-space-size=6144" pnpm --dir examples/pokemon build`

console.log('📁 Creating demo distribution...')
await $`mkdir --parents dist-demos`

// Copy built demos
console.log('📋 Copying demo builds...')
await $`cp --recursive examples/demos/dist/* dist-demos/`
await $`cp --recursive examples/pokemon/dist dist-demos/pokemon`
await $`cp --recursive examples/github/dist dist-demos/github`

console.log('✅ Demo build complete! Files are in dist-demos/')
console.log('📡 To preview locally, run: npx serve dist-demos')
