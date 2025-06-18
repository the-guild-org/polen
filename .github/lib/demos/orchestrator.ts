/**
 * Demo orchestrator - unified coordination of all demo operations
 */

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { demoBuilder, getDemoConfig, getDemoExamples } from '../../../src/lib/demos/index.ts'
import { executeWithContinuation, safeExecute, WorkflowError } from '../../../src/lib/github-actions/error-handling.ts'
import { VersionHistory } from '../../../src/lib/version-history/index.ts'
import { DeploymentPathManager } from './deployment/path-manager.ts'
import { buildDemosHome } from './ui/landing-page.ts'

export interface BuildResult {
  success: boolean
  versions: string[]
  failedVersions: string[]
  errors: WorkflowError[]
}

export interface GcResult {
  removed: string[]
  kept: string[]
  errors: string[]
}

/**
 * Orchestrates all demo operations with unified error handling and logging
 */
export class DemoOrchestrator {
  private versionHistory: VersionHistory
  private pathManager: DeploymentPathManager
  private config = getDemoConfig()

  constructor(
    private workingDir: string = process.cwd(),
    private logger: { info: (msg: string) => void; error: (msg: string) => void; debug: (msg: string) => void } =
      console,
  ) {
    this.versionHistory = new VersionHistory(workingDir)
    this.pathManager = new DeploymentPathManager(workingDir)
  }

  /**
   * Build demos for a specific release
   */
  async buildForRelease(version: string): Promise<BuildResult> {
    return safeExecute('build-for-release', async () => {
      this.logger.info(`🚀 Building demos for release ${version}`)

      // Check minimum version requirement
      if (!this.config.meetsMinimumPolenVersion(version)) {
        const minVersion = this.config.minimumPolenVersion
        this.logger.error(`Version ${version} is below minimum ${minVersion}`)
        return {
          success: false,
          versions: [],
          failedVersions: [version],
          errors: [new WorkflowError('build-for-release', `Version ${version} below minimum ${minVersion}`)],
        }
      }

      // Determine deployment path
      const isStable = VersionHistory.isStableVersion(version)
      const basePath = this.config.getDeploymentPath(version, isStable)

      // Build landing page
      await buildDemosHome({
        basePath,
        mode: 'demo',
      })

      // Build individual demos
      await demoBuilder.build(version, { basePath })

      this.logger.info(`✅ Successfully built demos for ${version}`)

      return {
        success: true,
        versions: [version],
        failedVersions: [],
        errors: [],
      }
    }).catch(error => ({
      success: false,
      versions: [],
      failedVersions: [version],
      errors: [WorkflowError.wrap('build-for-release', error)],
    }))
  }

  /**
   * Build demos for PR preview
   */
  async buildForPR(prNumber: string, sha: string, ref?: string): Promise<BuildResult> {
    return safeExecute('build-for-pr', async () => {
      this.logger.info(`🚀 Building PR demos for #${prNumber} (${sha})`)

      // Get latest stable version for Polen CLI
      const latestStable = await this.versionHistory.getLatestStableVersion()
      if (!latestStable) {
        throw new WorkflowError('build-for-pr', 'No stable version found for PR builds')
      }

      const version = latestStable.tag
      const basePath = `/pr-${prNumber}/${sha}/`

      // Build landing page for PR
      await buildDemosHome({
        basePath,
        mode: 'demo',
        prNumber,
        currentSha: sha,
      })

      // Build individual demos
      await demoBuilder.build(version, { basePath })

      // Create deployment structure
      await this.preparePRDeployment(prNumber, sha, ref)

      this.logger.info(`✅ Successfully built PR demos for #${prNumber}`)

      return {
        success: true,
        versions: [version],
        failedVersions: [],
        errors: [],
      }
    }).catch(error => ({
      success: false,
      versions: [],
      failedVersions: [`pr-${prNumber}`],
      errors: [WorkflowError.wrap('build-for-pr', error)],
    }))
  }

  /**
   * Build demos for current development cycle
   */
  async buildCurrentCycle(): Promise<BuildResult> {
    return safeExecute('build-current-cycle', async () => {
      this.logger.info('🚀 Building demos for current development cycle')

      // Get current development cycle
      const cycle = await this.versionHistory.getCurrentDevelopmentCycle()
      if (!cycle.stable) {
        throw new WorkflowError('build-current-cycle', 'No stable version found')
      }

      const versions = cycle.all.map(v => v.tag)
      this.logger.info(`Building ${versions.length} versions: ${versions.join(', ')}`)

      // Build each version
      const { successes, failures } = await executeWithContinuation(
        'build-current-cycle',
        versions,
        async (version) => {
          const isStable = VersionHistory.isStableVersion(version)
          const basePath = this.config.getDeploymentPath(version, isStable)

          // Build landing page
          await buildDemosHome({
            basePath,
            mode: 'demo',
          })

          // Build demos
          await demoBuilder.build(version, { basePath })

          return version
        },
      )

      const failedVersions = failures.map(f => f.item)
      const errors = failures.map(f => f.error)

      if (failures.length > 0) {
        this.logger.error(`Failed to build ${failures.length} versions: ${failedVersions.join(', ')}`)
      }

      this.logger.info(`✅ Successfully built ${successes.length}/${versions.length} versions`)

      return {
        success: failures.length < versions.length, // Success if at least one version built
        versions: successes,
        failedVersions,
        errors,
      }
    }).catch(error => ({
      success: false,
      versions: [],
      failedVersions: ['current-cycle'],
      errors: [WorkflowError.wrap('build-current-cycle', error)],
    }))
  }

  /**
   * Update dist-tag content by copying from semver deployment
   */
  async updateDistTag(distTag: string, semverTag: string): Promise<void> {
    return safeExecute('update-dist-tag', async () => {
      this.logger.info(`🔄 Updating ${distTag} to point to ${semverTag}`)

      const semverPath = `gh-pages/${semverTag}`
      const distTagPath = `gh-pages/${distTag}`

      // Check if semver deployment exists
      try {
        await fs.access(semverPath)
      } catch {
        throw new WorkflowError('update-dist-tag', `Semver deployment ${semverTag} not found`)
      }

      // Remove old dist-tag directory
      try {
        await fs.rm(distTagPath, { recursive: true, force: true })
        this.logger.debug(`Removed old ${distTag} directory`)
      } catch {
        // Directory might not exist, that's fine
      }

      // Copy semver deployment to dist-tag path
      await fs.cp(semverPath, distTagPath, { recursive: true })
      this.logger.debug(`Copied ${semverTag} to ${distTag}`)

      // Update base paths using the path manager
      await this.pathManager.updateBasePaths(
        distTagPath,
        `/${semverTag}/`,
        `/${distTag}/`,
      )

      this.logger.info(`✅ Successfully updated ${distTag} to ${semverTag}`)
    })
  }

  /**
   * Garbage collect old demo deployments
   */
  async garbageCollect(): Promise<GcResult> {
    return safeExecute('garbage-collect', async () => {
      this.logger.info('🗑️  Starting garbage collection of old demos')

      // Get versions to remove (past development cycle prereleases)
      const pastCyclePrereleases = await this.versionHistory.getPastDevelopmentCycles()
      const versionsToRemove = pastCyclePrereleases.map(v => v.tag)

      this.logger.info(`Found ${versionsToRemove.length} old prereleases to remove`)
      if (versionsToRemove.length > 0) {
        this.logger.debug(`Versions to remove: ${versionsToRemove.join(', ')}`)
      }

      // Determine the gh-pages directory to clean
      const ghPagesDir = process.env['WORKING_DIR'] || 'gh-pages'
      this.logger.debug(`Operating on directory: ${ghPagesDir}`)

      // Clean up deployments
      const result = await this.pathManager.cleanupOldDeployments(
        ghPagesDir,
        versionsToRemove,
        false, // Not a dry run
      )

      if (result.removed.length > 0) {
        this.logger.info(`✅ Removed ${result.removed.length} old deployments: ${result.removed.join(', ')}`)
      } else {
        this.logger.info('✅ No old deployments to remove')
      }

      if (result.errors.length > 0) {
        this.logger.error(`Errors during cleanup: ${result.errors.join(', ')}`)
      }

      return result
    }).catch(error => ({
      removed: [],
      kept: [],
      errors: [WorkflowError.wrap('garbage-collect', error).message],
    }))
  }

  /**
   * Update demos home page
   */
  async updateDemosHome(mode: 'trunk' | 'pr-index' = 'trunk', outputDir?: string): Promise<void> {
    return safeExecute('update-demos-home', async () => {
      this.logger.info(`📄 Updating demos home page (${mode} mode)`)

      if (mode === 'trunk') {
        // Get version info for trunk page
        const allVersions = await this.versionHistory.getVersions()
        const latestStable = await this.versionHistory.getLatestStableVersion()
        const distTagInfos = await this.versionHistory.getDistTags()

        // Format data
        const trunkDeployments = {
          latest: latestStable
            ? {
              sha: latestStable.commit,
              shortSha: latestStable.commit.substring(0, 7),
              tag: latestStable.tag,
            }
            : null,
          previous: allVersions
            .filter(v => v.tag !== latestStable?.tag)
            .slice(0, 10)
            .map(v => ({
              sha: v.commit,
              shortSha: v.commit.substring(0, 7),
              tag: v.tag,
            })),
        }

        const distTags: Record<string, string> = {}
        for (const info of distTagInfos) {
          if (info.semverTag) {
            distTags[info.name] = info.semverTag
          }
        }

        await buildDemosHome({
          mode: 'demo',
          trunkDeployments: JSON.stringify(trunkDeployments),
          distTags: JSON.stringify(distTags),
          outputDir: outputDir || 'dist-demos',
        })

        // Copy to gh-pages root
        await fs.copyFile('dist-demos/index.html', 'gh-pages/index.html')
      } else {
        // PR index mode - would need PR deployment data
        await buildDemosHome({
          mode: 'pr-index',
          prDeployments: '[]', // Would get from git or API
          outputDir: outputDir || 'dist-demos',
        })
      }

      this.logger.info(`✅ Updated demos home page`)
    })
  }

  // Private helper methods

  private async preparePRDeployment(prNumber: string, sha: string, ref?: string): Promise<void> {
    const deployDir = 'gh-pages-deploy'
    const prDir = `pr-${prNumber}`

    // Create directory structure
    await fs.mkdir(join(deployDir, prDir, 'latest'), { recursive: true })
    await fs.mkdir(join(deployDir, prDir, sha), { recursive: true })

    // Get demo examples
    const examples = await getDemoExamples()

    // Copy builds to commit-specific path
    for (const example of examples) {
      const buildDir = join('examples', example, 'build')
      try {
        await fs.access(buildDir)
        const destDir = join(deployDir, prDir, sha, example)
        await fs.cp(buildDir, destDir, { recursive: true })
      } catch {
        this.logger.debug(`Skipping ${example} - no build directory found`)
      }
    }

    // Copy to latest and update paths
    const shaDir = join(deployDir, prDir, sha)
    const latestDir = join(deployDir, prDir, 'latest')

    const entries = await fs.readdir(shaDir)
    for (const entry of entries) {
      await fs.cp(
        join(shaDir, entry),
        join(latestDir, entry),
        { recursive: true },
      )
    }

    // Update base paths in latest
    await this.pathManager.updateBasePaths(
      latestDir,
      `/pr-${prNumber}/${sha}/`,
      `/pr-${prNumber}/latest/`,
    )

    // Create convenience redirects
    await this.pathManager.createDemoRedirects(
      examples,
      join(deployDir, prDir),
      `/pr-${prNumber}/latest/`,
    )

    // Add PR metadata
    const prInfo = `PR #${prNumber}\\nBranch: ${ref || 'unknown'}\\nCommit: ${sha}`
    await fs.writeFile(join(latestDir, 'PR_INFO.txt'), prInfo)
    await fs.writeFile(join(shaDir, 'PR_INFO.txt'), prInfo)
  }
}

// Export singleton instance for easy access
export const demoOrchestrator = new DemoOrchestrator()
