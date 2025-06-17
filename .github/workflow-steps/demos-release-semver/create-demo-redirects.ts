import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { createHtmlRedirect } from '../../scripts/lib/html-redirect.ts'
import { getDemoExamples } from '../../scripts/tools/get-demo-examples.ts'
import { Step } from '../types.ts'

interface Inputs {
  gh_pages_dir: string
}

/**
 * Create convenience redirect pages for direct demo access at the root level
 *
 * WHAT: Creates HTML redirect pages that point to the /latest/ versions of demos
 * WHY: Enables simple URLs like `/polen/pokemon/` instead of `/polen/latest/pokemon/`
 *
 * For each demo example (pokemon, star-wars, etc.), creates:
 * `/polen/{example}/index.html` → redirects to `/polen/latest/{example}/`
 *
 * This provides user-friendly, stable URLs that always point to the latest
 * stable version of each demo, regardless of what the current version number is.
 *
 * Users can bookmark `/polen/pokemon/` and always get the latest stable Pokemon demo,
 * while power users can still access specific versions via `/polen/1.2.3/pokemon/`.
 *
 * These redirects are created during the release deployment process so they're
 * available immediately when a new stable version is released.
 */
export default Step<Inputs>(async ({ core, inputs }) => {
  const ghPagesDir = inputs.gh_pages_dir

  core.startGroup('Create demo redirects')

  try {
    const examples = await getDemoExamples()
    core.info(`Creating redirects for examples: ${examples.join(', ')}`)

    for (const example of examples) {
      const exampleDir = path.join(ghPagesDir, example)
      await fs.mkdir(exampleDir, { recursive: true })

      const redirectPath = path.join(exampleDir, 'index.html')
      await fs.writeFile(
        redirectPath,
        createHtmlRedirect(`/polen/latest/${example}/`),
      )

      core.debug(`Created redirect for ${example}`)
    }

    core.info('✅ Demo redirects created successfully')
    core.endGroup()
  } catch (error) {
    core.endGroup()
    core.setFailed(`Failed to create demo redirects: ${(error as Error).message}`)
  }
})
