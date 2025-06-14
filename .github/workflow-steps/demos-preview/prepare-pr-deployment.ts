import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { updateBasePaths } from '../../scripts/lib/build-demos.ts'
import { createHtmlRedirect } from '../../scripts/lib/html-redirect.ts'
import { getDemoExamples } from '../../scripts/tools/get-demo-examples.ts'
import { Step } from '../types.ts'

interface Inputs {
  pr_number: string
  head_sha: string
  head_ref: string
}

/**
 * Prepare PR preview for deployment
 */
export default Step<Inputs>(async ({ $, core, inputs }) => {
  const prNumber = inputs.pr_number
  const headSha = inputs.head_sha
  const headRef = inputs.head_ref
  const deployDir = 'gh-pages-deploy'

  try {
    // Create deployment directory structure
    await fs.mkdir(path.join(deployDir, `pr-${prNumber}`, 'latest'), { recursive: true })
    await fs.mkdir(path.join(deployDir, `pr-${prNumber}`, headSha), { recursive: true })

    // Copy landing page to PR root
    await fs.copyFile(
      'dist-demos/index.html',
      path.join(deployDir, `pr-${prNumber}`, 'index.html'),
    )

    // Get list of examples that are enabled for demos
    const examples = await getDemoExamples()
    console.log(`Found demo-enabled examples: ${examples.join(', ')}`)

    // Copy builds to commit-specific path
    for (const example of examples) {
      const buildDir = path.join('examples', example, 'build')
      try {
        await fs.access(buildDir)
        const destDir = path.join(deployDir, `pr-${prNumber}`, headSha, example)
        await fs.cp(buildDir, destDir, { recursive: true })
      } catch {
        console.log(`Skipping ${example} - no build directory found`)
      }
    }

    // Copy to latest (will update paths below)
    const shaDir = path.join(deployDir, `pr-${prNumber}`, headSha)
    const latestDir = path.join(deployDir, `pr-${prNumber}`, 'latest')

    // Get all entries in the SHA directory
    const entries = await fs.readdir(shaDir)
    for (const entry of entries) {
      await fs.cp(
        path.join(shaDir, entry),
        path.join(latestDir, entry),
        { recursive: true },
      )
    }

    // Update all base paths in the latest copy
    console.log(`Updating base paths from /${headSha}/ to /latest/`)
    await updateBasePaths({
      directory: latestDir,
      fromPath: `/polen/pr-${prNumber}/${headSha}/`,
      toPath: `/polen/pr-${prNumber}/latest/`,
      $,
    })

    // Create redirect from /latest/ to PR root
    const latestIndexPath = path.join(latestDir, 'index.html')
    await fs.writeFile(
      latestIndexPath,
      createHtmlRedirect(`/polen/pr-${prNumber}/`),
    )

    // Create redirects for direct demo URLs
    for (const example of examples) {
      const exampleDir = path.join(deployDir, `pr-${prNumber}`, example)
      await fs.mkdir(exampleDir, { recursive: true })

      const redirectPath = path.join(exampleDir, 'index.html')
      await fs.writeFile(
        redirectPath,
        createHtmlRedirect(`/polen/pr-${prNumber}/latest/${example}/`),
      )
    }

    // Add PR-specific metadata to both deployments
    const prInfo = `PR #${prNumber}\nBranch: ${headRef}\nCommit: ${headSha}`

    await fs.writeFile(
      path.join(latestDir, 'PR_INFO.txt'),
      prInfo,
    )

    await fs.writeFile(
      path.join(shaDir, 'PR_INFO.txt'),
      prInfo,
    )

    console.log('✅ PR preview deployment prepared successfully')
  } catch (error) {
    core.setFailed(`Failed to prepare PR deployment: ${(error as Error).message}`)
  }
})
