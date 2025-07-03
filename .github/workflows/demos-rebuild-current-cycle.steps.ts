import { getBuildableVersions } from '#lib/demos/get-buildable-versions'
import { build, buildHome } from '#lib/demos/index'
import { GitHubActions } from '#lib/github-actions'
import { VersionHistory } from '#lib/version-history/index'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { $ } from 'zx'

export default GitHubActions.createStepCollection({
  steps: {
    'get-versions': {
      description: 'Determine which versions to build',
      async run({ core }) {
        const result = await getBuildableVersions()

        if (!result.hasVersions) {
          core.warning('No versions to build in current development cycle')
        }

        return result
      },
    },

    'build-version': {
      description: 'Build demos for a single version',
      async run({ core, inputs }) {
        const version = inputs.version as string

        await core.group(`Building demos for version ${version}`, async () => {
          // Build demos for this version
          await build(version, {
            basePath: `/${version}/`,
            outputDir: 'dist',
          })
        })

        return {
          version,
          success: true,
        }
      },
    },

    'deploy': {
      description: 'Consolidate and deploy all built versions',
      async run({ core, inputs, context }) {
        const stableVersion = inputs.getVersions?.stable as string | undefined

        // Ensure gh-pages directory exists
        await fs.mkdir('gh-pages', { recursive: true })

        // Move all artifacts to gh-pages
        await core.group('Consolidating build artifacts', async () => {
          const artifactsDir = 'artifacts'
          const entries = await fs.readdir(artifactsDir)

          for (const entry of entries) {
            if (entry.startsWith('demo-')) {
              // Extract version from artifact name (demo-1.2.3 -> 1.2.3)
              const version = entry.replace('demo-', '')
              const sourcePath = path.join(artifactsDir, entry)
              const targetPath = path.join('gh-pages', version)

              await fs.cp(sourcePath, targetPath, { recursive: true })
              core.info(`Copied ${version} to gh-pages`)
            }
          }
        })

        // Create latest symlink if we have a stable version
        if (stableVersion) {
          await core.group('Creating latest symlink', async () => {
            const latestPath = path.join('gh-pages', 'latest')
            try {
              await $`rm -rf ${latestPath}`
              await $`cd gh-pages && ln -s ${stableVersion} latest`
              core.info(`Created symlink: latest -> ${stableVersion}`)
            } catch (error) {
              core.warning(`Failed to create latest symlink: ${error}`)
            }
          })
        }

        // Build and deploy home page
        await core.group('Building demos home page', async () => {
          const catalog = await VersionHistory.getVersionCatalog()

          await buildHome({
            mode: 'trunk',
            catalog,
            basePath: `/${context.repo.repo}/`,
            outputPath: 'gh-pages/index.html',
          })
        })

        return {
          deployed: true,
        }
      },
    },
  },
})
