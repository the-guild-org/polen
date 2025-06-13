#!/usr/bin/env zx

// Build demos locally for testing GitHub Pages deployment

import { $ } from 'zx'

$.verbose = true

console.log('🔨 Building Polen...')
await $`pnpm build`

console.log('🏠 Building demos landing page...')
await $`cd examples/demos && pnpm install && pnpm build`

console.log('🐙 Building GitHub demo...')
await $`cd examples/github && pnpm build`

console.log('⚡ Building Pokemon demo...')
await $`cd examples/pokemon && pnpm build`

console.log('📁 Creating demo distribution...')
await $`mkdir -p dist-demos`

// Copy built demos
console.log('📋 Copying demo builds...')
await $`cp -r examples/demos/dist/* dist-demos/`
await $`cp -r examples/pokemon/dist dist-demos/pokemon`
await $`cp -r examples/github/dist dist-demos/github`

console.log('✅ Demo build complete! Files are in dist-demos/')
console.log('📡 To preview locally, run: npx serve dist-demos')
