import { buildHome, buildMultipleVersions } from '#lib/demos/index'
import { GitHubActions } from '#lib/github-actions'
import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'

export default GitHubActions.createStepCollection({
  context: GitHubActions.ReleaseContext,
  description: 'Build and deploy demos for semver releases',
  steps: {
    extractReleaseInfo: {
      description: `Extract and validate semver release information`,
      outputs: z.object({
        tag: z.string(),
        version: z.string(),
        isPrerelease: z.boolean(),
        action: z.string(),
      }),
      async run({ core, context }) {
        const release = context.payload.release
        const tag = release.tag_name
        const action = context.payload.action

        // Validate semver format
        const semverRegex = /^\d+\.\d+\.\d+(-\S+)?$/
        if (!semverRegex.test(tag)) {
          throw new Error(`Tag ${tag} is not a valid semver format`)
        }

        // Extract version (tag without 'v' prefix if present)
        const version = tag.startsWith('v') ? tag.slice(1) : tag

        // Check if it's a prerelease (has hyphen)
        const isPrerelease = version.includes('-')

        core.info(`✅ Release info extracted:`)
        core.info(`   Tag: ${tag}`)
        core.info(`   Version: ${version}`)
        core.info(`   Prerelease: ${isPrerelease}`)
        core.info(`   Action: ${action}`)

        return {
          tag,
          version,
          isPrerelease,
          action,
        }
      },
    },

    build: {
      description: `Build demos for a semver release`,
      inputs: z.object({
        tag: z.string(),
        version: z.string(),
        isPrerelease: z.boolean(),
      }),
      async run({ core, inputs }) {
        const { tag, version, isPrerelease } = inputs

        // Check minimum version requirement
        const MIN_POLEN_VERSION = `2.0.0`
        const parsed = VersionHistory.parseSemVer(version)
        if (!parsed) {
          throw new Error(`Failed to parse version: ${version}`)
        }

        const minParsed = VersionHistory.parseSemVer(MIN_POLEN_VERSION)
        if (!minParsed) {
          throw new Error(`Failed to parse minimum version: ${MIN_POLEN_VERSION}`)
        }

        if (
          parsed.major < minParsed.major
          || (parsed.major === minParsed.major && parsed.minor < minParsed.minor)
        ) {
          core.info(`⏭️ Skipping demo build for version ${version} (< ${MIN_POLEN_VERSION})`)
          return
        }

        // Build demos with version tag
        const results = await buildMultipleVersions([tag], `gh-pages`)

        if (results.built.length === 0) {
          throw new Error(`No versions were successfully built`)
        }

        // For stable releases, also build the trunk page
        if (!isPrerelease) {
          const catalog = await VersionHistory.getVersionCatalog()

          await buildHome({
            mode: 'trunk',
            basePath: `/polen/`,
            catalog,
            outputPath: `gh-pages/index.html`,
          })

          core.info(`✅ Built trunk page for stable release ${version}`)
        }

        core.info(`✅ Successfully built demos for ${version}`)
      },
    },

    addDemosLink: {
      description: `Add demos link to the release commit`,
      inputs: z.object({
        tag: z.string(),
        version: z.string(),
      }),
      async run({ core, github, context, inputs }) {
        const { tag, version } = inputs
        const { owner, repo } = context.repo

        // Get the commit SHA from the release
        const sha = context.payload.release.target_commitish

        // Create deployment status
        const deploymentUrl = `https://${owner}.github.io/polen/${version}/`

        try {
          await github.rest.repos.createCommitStatus({
            owner,
            repo,
            sha,
            state: 'success',
            context: 'demos',
            description: `View demos for ${version}`,
            target_url: deploymentUrl,
          })

          core.info(`✅ Added demos link to commit ${sha}`)
          core.info(`   URL: ${deploymentUrl}`)
        } catch (error) {
          // This can fail if the commit is not in the default branch
          core.warning(`Failed to add commit status: ${error}`)
          core.warning(`This is expected if the tag is on a commit not in the default branch`)
        }
      },
    },
  },
})
