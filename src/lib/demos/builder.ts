import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { $ } from 'zx'
import { getDemoExamples } from '../../../.github/scripts/tools/get-demo-examples.js'
import { getDemoConfig } from './config.js'

$.verbose = false // Suppress command output by default

export interface BuildOptions {
  basePath?: string
  outputDir?: string
  examples?: string[]
  prNumber?: string
  currentSha?: string
}

export interface DeployOptions {
  sourceDir: string
  targetDir: string
  updateBasePaths?: {
    from: string
    to: string
  }
}

export class DemoBuilder {
  private config = getDemoConfig()

  /**
   * Build demos for a specific version/tag
   */
  async build(tag: string, options: BuildOptions = {}): Promise<void> {
    const basePath = options.basePath || `/polen/${tag}/`
    const examples = options.examples || await getDemoExamples()

    console.log(`📦 Building demos for ${tag}`)
    console.log(`  Base path: ${basePath}`)
    console.log(`  Examples: ${examples.join(', ')}`)

    // Build landing page
    await this.buildLandingPage({
      basePath,
      outputDir: options.outputDir,
      prNumber: options.prNumber,
      currentSha: options.currentSha,
    })

    // Build each example
    for (const example of examples) {
      await this.buildExample(example, `${basePath}${example}/`, options.outputDir)
    }

    console.log(`✅ Successfully built demos for ${tag}`)
  }

  /**
   * Build demos landing page
   */
  private async buildLandingPage(options: {
    basePath: string
    outputDir?: string
    prNumber?: string
    currentSha?: string
  }): Promise<void> {
    console.log(`  Building landing page...`)

    // Import and call the build-demos-home module directly
    const { buildDemosHome } = await import('../../../scripts/build-demos-home.js')

    await buildDemosHome({
      basePath: options.basePath || '/',
      prNumber: options.prNumber,
      currentSha: options.currentSha,
      mode: options.prNumber ? 'demo' : 'demo',
      prDeployments: undefined,
      trunkDeployments: undefined,
      distTags: undefined,
      serve: false,
    })
  }

  /**
   * Build a single example
   */
  private async buildExample(
    example: string,
    basePath: string,
    outputDir?: string,
  ): Promise<void> {
    const exampleDir = path.join('examples', example)

    // Check if example exists
    try {
      await fs.access(exampleDir)
    } catch {
      console.warn(`  ⚠️  Example ${example} not found, skipping`)
      return
    }

    console.log(`  Building ${example}...`)

    // Build using Polen CLI
    const args = ['build', '--basePath', basePath]
    if (outputDir) {
      args.push('--outputDir', path.join(outputDir, example))
    }

    await $`cd ${exampleDir} && npx polen ${args}`
  }

  /**
   * Deploy built demos to a target directory
   */
  async deploy(options: DeployOptions): Promise<void> {
    const { sourceDir, targetDir, updateBasePaths } = options

    console.log(`🚀 Deploying demos from ${sourceDir} to ${targetDir}`)

    // Ensure target directory exists and is clean
    await fs.rm(targetDir, { recursive: true, force: true })
    await fs.mkdir(targetDir, { recursive: true })

    // Copy demos landing page if it exists
    const landingPageSrc = path.join(sourceDir, 'index.html')
    try {
      await fs.access(landingPageSrc)
      await fs.copyFile(landingPageSrc, path.join(targetDir, 'index.html'))
      console.log(`  Copied landing page`)
    } catch {
      // Check dist-demos-home directory as alternative source
      try {
        const altLandingPage = path.join('dist-demos-home', 'index.html')
        await fs.access(altLandingPage)
        await fs.copyFile(altLandingPage, path.join(targetDir, 'index.html'))
        console.log(`  Copied landing page from dist-demos-home`)
      } catch {
        console.log(`  No landing page found`)
      }
    }

    // Copy each example's build output
    const examples = await getDemoExamples()
    for (const example of examples) {
      const buildDir = path.join('examples', example, 'build')
      const destDir = path.join(targetDir, example)

      try {
        await fs.access(buildDir)
        await fs.mkdir(destDir, { recursive: true })
        await this.copyDirectory(buildDir, destDir)
        console.log(`  Copied ${example}`)
      } catch {
        console.warn(`  ⚠️  No build output for ${example}, skipping`)
      }
    }

    // Update base paths if needed
    if (updateBasePaths) {
      await this.updateBasePaths(targetDir, updateBasePaths.from, updateBasePaths.to)
      console.log(`  Updated base paths from ${updateBasePaths.from} to ${updateBasePaths.to}`)
    }

    console.log(`✅ Successfully deployed demos to ${targetDir}`)
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await $`cp -r ${src}/* ${dest}/`
  }

  /**
   * Update base paths in deployed files
   */
  async updateBasePaths(
    dir: string,
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    // Find all HTML, JS, CSS, and JSON files and update paths
    await $`find ${dir} -type f \\( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.json" \\) | while read file; do
      perl -i -pe "s|${oldPath.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')}|${newPath}|g" "$file"
    done`
  }

  /**
   * Build and deploy demos for multiple versions
   *
   * This method automates the process of building demos for multiple Polen versions:
   *
   * 1. For each version tag (e.g., "1.2.0", "1.3.0-beta.1"):
   *    - Checks out that git tag to get the code at that version
   *    - Builds Polen itself (pnpm build)
   *    - Builds all demo examples using that version of Polen
   *    - Deploys the built demos to deployDir/[version]/
   *
   * 2. Handles version filtering:
   *    - Skips versions below the configured minimumPolenVersion
   *    - Skips versions where Polen build fails
   *
   * 3. Git branch management:
   *    - Optionally saves and restores the original branch when done
   *    - This prevents leaving the repo in a detached HEAD state
   *
   * Example:
   * ```
   * // Build demos for versions 1.2.0 and 1.3.0-beta.1
   * const results = await buildMultipleVersions(
   *   ['1.2.0', '1.3.0-beta.1'],
   *   'gh-pages',
   *   { restoreOriginalBranch: true }
   * )
   * // Results: { built: ['1.2.0', '1.3.0-beta.1'], skipped: [] }
   * ```
   *
   * Note: This method modifies the git working directory by checking out tags.
   * Always use restoreOriginalBranch: true in CI environments.
   */
  async buildMultipleVersions(
    versions: string[],
    deployDir: string,
    options: { restoreOriginalBranch?: boolean } = {},
  ): Promise<{ built: string[]; skipped: string[] }> {
    const results = {
      built: [] as string[],
      skipped: [] as string[],
    }

    // Save current branch if needed
    let originalBranch: string | null = null
    if (options.restoreOriginalBranch) {
      originalBranch = (await $`git rev-parse --abbrev-ref HEAD`).stdout.trim()
    }

    try {
      for (const version of versions) {
        // Skip if below minimum Polen version
        if (!this.config.meetsMinimumPolenVersion(version)) {
          console.log(
            `⚠️ Skipping ${version} - below minimum Polen version ${this.config.minimumPolenVersion}`,
          )
          results.skipped.push(version)
          continue
        }

        console.log(`\n📦 Building ${version}...`)

        // Checkout the version
        await $`git checkout ${version}`

        // Build Polen
        try {
          await $`pnpm build`
        } catch {
          console.log(`⚠️ Could not build Polen for ${version}, skipping`)
          results.skipped.push(version)
          continue
        }

        // Re-install to link workspace packages
        await $`pnpm install`

        // Build demos
        await this.build(version)

        // Determine target directory
        // Stable versions go to version-specific dirs (not 'latest' here)
        const targetDir = path.join(deployDir, version)

        await this.deploy({
          sourceDir: 'dist-demos',
          targetDir,
        })

        results.built.push(version)
      }
    } finally {
      // Restore original branch if requested
      if (originalBranch && options.restoreOriginalBranch) {
        await $`git checkout ${originalBranch}`
      }
    }

    return results
  }

  /**
   * Build demos for current development cycle
   */
  async buildCurrentCycle(deployDir: string): Promise<void> {
    const { VersionHistory } = await import('../version-history/index.js')
    const versionHistory = new VersionHistory()
    const cycle = await versionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      throw new Error('No stable release found')
    }

    const versions = cycle.all.map(v => v.tag)
    await this.buildMultipleVersions(versions, deployDir)
  }
}

// Export singleton instance
export const demoBuilder = new DemoBuilder()
