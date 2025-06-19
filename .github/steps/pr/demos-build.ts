import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod/v4'
import { buildDemosHome, demoBuilder, getDemoExamples } from '../../../src/lib/demos/index.ts'
import { GitHubActions } from '../../../src/lib/github-actions/index.ts'
import { VersionHistory } from '../../../src/lib/version-history/index.ts'
import { DeploymentPathManager } from '../../lib/demos/path-manager.ts'

const Outputs = z.object({
  deployment_ready: z.boolean(),
})

/**
 * Prepare PR preview deployment
 */
export default GitHubActions.createStep({
  description: 'Prepare PR preview deployment by organizing built demos into deployment structure',
  outputs: Outputs,
  context: GitHubActions.PullRequestContext,
  async run({ core, context, pr }) {
    const pr_number = context.payload.pull_request.number.toString()
    const head_sha = context.payload.pull_request.head.sha
    const head_ref = context.payload.pull_request.head.ref

    core.info(`Preparing deployment for PR #${pr_number}`)

    // Ensure SHA is a string
    const shaString = String(head_sha)
    // Use short SHA for directory names to avoid issues with long paths
    const shortSha = shaString.substring(0, 7)
    const fullSha = shaString

    core.info(`🚀 Building PR demos for #${pr_number} (${fullSha})`)

    // Get latest stable version for Polen CLI
    const versionHistory = new VersionHistory()
    const latestStable = await versionHistory.getLatestStableVersion()
    if (!latestStable) {
      throw new Error('No stable version found for PR builds')
    }

    const version = latestStable.git.tag
    const shaBasePath = `/polen/pr-${pr_number}/${shortSha}/`
    const prRootBasePath = `/polen/pr-${pr_number}/`

    // Fetch previous deployments from gh-pages branch
    const deployments = await pr.fetchDeployments()
    core.info(`Fetched ${deployments.length} total deployments for PR #${pr_number}`)
    
    // Convert deployment objects to just SHA strings for the UI
    // Also exclude the current deployment if it's already in the list
    const previousDeploymentShas = deployments
      .filter(d => d.shortSha !== shortSha)
      .map(d => d.shortSha)
    
    core.info(`Found ${previousDeploymentShas.length} previous deployments: ${previousDeploymentShas.join(', ')}`)

    // Build landing page for PR with deployment history
    const prDeploymentsData = [{
      number: parseInt(pr_number, 10),
      sha: shortSha,
      ref: head_ref,
      previousDeployments: previousDeploymentShas
    }]

    // Build individual demos with SHA-specific base path
    await demoBuilder.build(version, { basePath: shaBasePath })

    // Build landing page for PR root (without currentSha to show overview)
    await buildDemosHome({
      basePath: prRootBasePath,
      prNumber: pr_number,
      prDeployments: prDeploymentsData,
    })

    // Create deployment structure
    const deployDir = 'gh-pages-deploy'

    // Create directory structure without pr directory prefix
    // The workflow will handle the pr-{number} directory when deploying
    await fs.mkdir(join(deployDir, 'latest'), { recursive: true })
    await fs.mkdir(join(deployDir, shortSha), { recursive: true })

    // Get demo examples
    const examples = await getDemoExamples()

    // Copy landing page first
    const landingPagePath = join('dist-demos', 'index.html')
    try {
      await fs.access(landingPagePath)
      await fs.copyFile(landingPagePath, join(deployDir, shortSha, 'index.html'))
      await fs.copyFile(landingPagePath, join(deployDir, 'index.html'))
      core.info(`Copied landing page`)
    } catch (error) {
      core.error(`Failed to copy landing page: ${error}`)
      throw new Error(`Landing page not found at ${landingPagePath}`)
    }

    // Copy builds to commit-specific path
    for (const example of examples) {
      // Polen outputs to 'dist' by default
      const distDir = join('examples', example, 'dist')
      try {
        await fs.access(distDir)
        const destDir = join(deployDir, shortSha, example)
        await fs.cp(distDir, destDir, { recursive: true })
        core.info(`Copied ${example} demo from dist`)
      } catch {
        // Fallback to 'build' directory if 'dist' doesn't exist
        const buildDir = join('examples', example, 'build')
        try {
          await fs.access(buildDir)
          const destDir = join(deployDir, shortSha, example)
          await fs.cp(buildDir, destDir, { recursive: true })
          core.info(`Copied ${example} demo from build`)
        } catch {
          core.debug(`Skipping ${example} - no dist or build directory found`)
        }
      }
    }

    // Copy to latest and update paths
    const shaDir = join(deployDir, shortSha)
    const latestDir = join(deployDir, 'latest')

    // Copy landing page to latest
    await fs.copyFile(landingPagePath, join(latestDir, 'index.html'))

    const entries = await fs.readdir(shaDir)
    for (const entry of entries) {
      await fs.cp(
        join(shaDir, entry),
        join(latestDir, entry),
        { recursive: true },
      )
    }

    // Update base paths in latest directory (but not the root index.html)
    const pathManager = new DeploymentPathManager()
    const latestEntries = await fs.readdir(latestDir)
    for (const entry of latestEntries) {
      if (entry !== 'index.html') {
        const entryPath = join(latestDir, entry)
        const stat = await fs.stat(entryPath)
        if (stat.isDirectory()) {
          await pathManager.updateBasePaths(
            entryPath,
            `/polen/pr-${pr_number}/${shortSha}/`,
            `/polen/pr-${pr_number}/latest/`,
          )
        }
      }
    }

    // Add PR metadata
    const prInfo = `PR #${pr_number}\\nBranch: ${head_ref || 'unknown'}\\nCommit: ${fullSha}`
    await fs.writeFile(join(latestDir, 'PR_INFO.txt'), prInfo)
    await fs.writeFile(join(shaDir, 'PR_INFO.txt'), prInfo)

    // Build SHA-specific landing page directly to deployment directory
    await buildDemosHome({
      basePath: shaBasePath,
      prNumber: pr_number,
      currentSha: shortSha,
      prDeployments: prDeploymentsData,
      outputDir: `gh-pages-deploy/${shortSha}`,
    })

    core.info(`✅ Successfully built PR demos for #${pr_number}`)
    core.info('✅ PR preview deployment prepared successfully')

    return {
      deployment_ready: true,
    }
  },
})
