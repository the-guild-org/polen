import { Api } from '#api/index'
import { build, buildHome, getDemoExamples } from '#lib/demos/index'
import { Deployment } from '#lib/deployment'
import { GitHubActions } from '#lib/github-actions'
import { VersionHistory } from '#lib/version-history/index'
import { Str } from '@wollybeard/kit'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { glob } from 'tinyglobby'

export default GitHubActions.createStepCollection({
  context: GitHubActions.PullRequestContext,
  steps: {
    async demosBuild({ core, context, pr }) {
      const pr_number = context.payload.pull_request.number.toString()
      const head_sha = context.payload.pull_request.head.sha
      const head_ref = context.payload.pull_request.head.ref

      core.info(`Preparing deployment for PR #${pr_number}`)

      // Ensure SHA is a string
      const shaString = String(head_sha)
      // Use short SHA for directory names to avoid issues with long paths
      const shortSha = shaString.substring(0, 7)
      const fullSha = shaString

      const repoOwner = context.repo.owner
      const repoName = context.repo.repo
      const deploymentMetadata: Deployment.DeploymentMetadata = {
        timestamp: new Date().toISOString(),
        pullRequest: {
          number: parseInt(pr_number, 10),
          branch: head_ref || `unknown`,
          commit: fullSha,
          title: context.payload.pull_request.title,
          author: context.payload.pull_request.user.login,
        },
        deployment: {
          url: `https://${repoOwner}.github.io/${repoName}/pr-${pr_number}/`,
          environment: `pr-${pr_number}`,
        },
      }

      core.info(`🚀 Building PR demos for #${pr_number} (${fullSha})`)

      // Get latest stable version for Polen CLI
      const latestStable = await VersionHistory.getLatestStableVersion()
      if (!latestStable) {
        throw new Error(`No stable version found for PR builds`)
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

      core.info(`Found ${previousDeploymentShas.length} previous deployments: ${previousDeploymentShas.join(`, `)}`)

      // Build landing page for PR with deployment history
      const prDeploymentsData = [{
        number: parseInt(pr_number, 10),
        sha: shortSha,
        ref: head_ref,
        previousDeployments: previousDeploymentShas,
      }]

      // Build individual demos with SHA-specific base path
      await build(version, { basePath: shaBasePath })

      // Build landing page for PR root (without currentSha to show overview)
      await buildHome({
        mode: 'preview',
        basePath: prRootBasePath,
        prNumber: pr_number,
        prDeployments: prDeploymentsData,
      })

      // Create deployment structure
      const deployDir = `gh-pages-deploy`

      // Create directory structure without pr directory prefix
      // The workflow will handle the pr-{number} directory when deploying
      await fs.mkdir(join(deployDir, `latest`), { recursive: true })
      await fs.mkdir(join(deployDir, shortSha), { recursive: true })

      // Get demo examples
      const examples = await getDemoExamples()

      // Copy landing page first
      const landingPagePath = join(`dist-demos`, `index.html`)
      try {
        await fs.access(landingPagePath)
        await fs.copyFile(landingPagePath, join(deployDir, shortSha, `index.html`))
        await fs.copyFile(landingPagePath, join(deployDir, `index.html`))
        core.info(`Copied landing page`)
      } catch (error) {
        core.error(`Failed to copy landing page: ${error}`)
        throw new Error(`Landing page not found at ${landingPagePath}`)
      }

      // Copy builds to commit-specific path
      for (const example of examples) {
        const buildDir = join(`examples`, example, `build`)
        try {
          await fs.access(buildDir)
          const destDir = join(deployDir, shortSha, example)
          await fs.cp(buildDir, destDir, { recursive: true })
          core.info(`Copied ${example} demo`)
        } catch {
          core.error(`Failed to copy ${example} - build directory not found at ${buildDir}`)
          throw new Error(`Demo build output not found for ${example}`)
        }
      }

      const shaDir = join(deployDir, shortSha)
      await Deployment.metadata.write(deploymentMetadata, shaDir)

      //
      //
      //
      // ━━━━━━━━━━━━━━ • Dist Tag (like) Latest
      //
      //

      const latestDirPath = join(deployDir, `latest`)

      // Copy SHA directory first, then landing page to avoid overwriting
      await fs.cp(shaDir, latestDirPath, { recursive: true })
      await fs.copyFile(landingPagePath, join(latestDirPath, `index.html`))

      // Update base paths in latest directory subdirectories
      const latestDirDemoPaths = await glob(`*/`, {
        cwd: latestDirPath,
        onlyDirectories: true,
      })

      for (const dir of latestDirDemoPaths) {
        const entryPath = join(latestDirPath, dir)
        await Api.Static.rebase({
          changeMode: `mutate`,
          sourcePath: entryPath,
          newBasePath: `/polen/pr-${pr_number}/latest/`,
        })
      }

      await Deployment.metadata.write(deploymentMetadata, latestDirPath)

      // Build SHA-specific landing page directly to deployment directory
      await buildHome({
        mode: 'preview',
        basePath: shaBasePath,
        prNumber: pr_number,
        currentSha: shortSha,
        prDeployments: prDeploymentsData,
        outputDir: `gh-pages-deploy/${shortSha}`,
      })
    },
    async demosDeployComment({ core, context, pr }) {
      const pr_number = context.payload.pull_request.number.toString()
      const head_sha = context.payload.pull_request.head.sha

      const allDeployments = await pr.fetchDeployments()
      const previousDeployments = allDeployments.slice(1)

      //
      // ━━ Format
      //

      // Get list of demos
      const examples = await getDemoExamples()

      // Get short SHA
      const shortSha = head_sha.substring(0, 7)

      const s = Str.Builder()

      const baseUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${pr_number}`
      s`## [Polen Demos Preview](${baseUrl})`

      // Get current timestamp
      const now = new Date()
      const timestamp = now.toLocaleString(`en-US`, {
        hour: `2-digit`,
        minute: `2-digit`,
        day: `numeric`,
        month: `long`,
        year: `numeric`,
        hour12: false,
      })
      s`**<sup>Last updated at ${timestamp}</sup>**`

      for (const example of examples) {
        const displayName = Str.Case.title(example)
        const baseUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${pr_number}`

        // let text = ''
        s`#### [${displayName}](${baseUrl}/latest/${example}/) – [\`${shortSha}\`](${baseUrl}/${shortSha}/${example}/)`

        // Format previous deployments per demo
        if (previousDeployments.length === 0) {
          s`Previous Deployments: (none)`
        } else {
          const deploymentLinks = previousDeployments
            .slice(0, 10)
            .map(deployment => `[\`${deployment.shortSha}\`](${baseUrl}/${deployment.shortSha}/${example}/)`)
            .join(` / `)

          let previousDeploymentsText = `Previous Deployments: ${deploymentLinks}`
          if (previousDeployments.length > 10) {
            previousDeploymentsText += ` and ${previousDeployments.length - 10} more`
          }
          s`${previousDeploymentsText}`
        }
      }

      //
      // ━━ Send
      //

      await pr.comment({
        content: s.toString(),
      })

      core.info(`✅ PR comment created/updated successfully`)
    },
  },
})
