import { Api } from '#api/index'
import type { FsLayout } from '@wollybeard/kit'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'

test('warns about numbered prefix on index file', async ({ vite, project }) => {
  const fixture: FsLayout.Tree = {
    'pages/docs': {
      '10_index.md': '# Documentation',
      'getting-started.md': '# Getting Started',
    },
  }

  await project.layout.set(fixture)
  const viteConfig = await Api.ConfigResolver.fromMemory({ root: project.layout.cwd })

  // Capture console warnings during dev server startup
  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    warnings.push(args.join(' '))
    originalWarn(...args)
  }

  try {
    await vite.startDevelopmentServer(viteConfig)

    // Check that we got the expected warning
    const indexWarning = warnings.find(w =>
      w.includes('Numbered prefix on index file has no effect')
      && w.includes('10_index.md')
    )

    expect(indexWarning).toBeDefined()
  } finally {
    console.warn = originalWarn
  }
})
