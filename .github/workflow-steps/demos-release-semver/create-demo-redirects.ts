import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { createHtmlRedirect } from '../../scripts/lib/html-redirect.ts'
import { getDemoExamples } from '../../scripts/tools/get-demo-examples.ts'
import { Step } from '../types.ts'

interface Inputs {
  gh_pages_dir: string
}

/**
 * Create redirect pages for direct demo access at root
 * Examples:
 * - /polen/pokemon/ → /polen/latest/pokemon/ (convenience redirect)
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
