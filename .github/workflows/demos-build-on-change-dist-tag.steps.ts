import { Api } from '#api/index'
import { GitHubActions } from '#lib/github-actions'
import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'

const DistTagContext = z.union([
  GitHubActions.PushContext,
  GitHubActions.WorkflowDispatchContext,
])

export default GitHubActions.createStepCollection({
  context: DistTagContext,
  description: 'Update dist-tag demos to point to semver releases',
  steps: {
    getDistTagInfo: {
      description: `Resolve npm dist-tags to their actual semver versions`,
      inputs: z.object({
        dist_tag: z.string().optional(),
      }),
      outputs: z.object({
        tag_name: z.string(),
        semver_tag: z.string(),
        commit: z.string(),
      }),
      async run({ core, inputs, context }) {
        const { dist_tag } = inputs

        // Get the tag name from push event or manual input
        let tagName: string
        if (context.eventName === `workflow_dispatch`) {
          if (!dist_tag) {
            throw new Error(`dist_tag input is required for workflow_dispatch`)
          }
          tagName = dist_tag
        } else {
          // Push event
          const { payload } = context
          if (!payload.ref?.startsWith(`refs/tags/`)) {
            throw new Error(`Invalid ref for tag push event`)
          }
          tagName = payload.ref.replace(`refs/tags/`, ``)
        }

        // Get the dist tag info
        const distTag = await VersionHistory.getDistTag(tagName)
        if (!distTag) {
          throw new Error(`Tag ${tagName} not found`)
        }

        // Find the semver tag for this commit
        if (!distTag.semverTag) {
          throw new Error(`No semver tag found for commit ${distTag.commit}`)
        }

        core.info(`✅ Dist-tag ${tagName} points to ${distTag.semverTag}`)

        return {
          tag_name: tagName,
          semver_tag: distTag.semverTag,
          commit: distTag.commit,
        }
      },
    },

    build: {
      description: `Copy content from existing deployment`,
      inputs: z.object({
        tag_name: z.string(),
        semver_tag: z.string(),
      }),
      async run({ core, inputs, $ }) {
        const { tag_name, semver_tag } = inputs

        const sourcePath = `gh-pages/${semver_tag}`
        const targetPath = `gh-pages/${tag_name}`

        // Check if source deployment exists
        try {
          await $`test -d ${sourcePath}`
        } catch {
          throw new Error(
            `Source deployment not found at ${sourcePath}. The deployment might have been garbage collected.`,
          )
        }

        // Remove existing dist-tag directory if it exists
        core.info(`Removing existing dist-tag directory: ${targetPath}`)
        await $`rm -rf ${targetPath}`

        // Copy semver deployment to dist-tag
        core.info(`Creating dist-tag: ${tag_name} -> ${semver_tag}`)
        await $`cp -R ${sourcePath} ${targetPath}`

        // Rebase paths to use dist-tag base path
        const basePath = `/${tag_name}/`
        await Api.Static.rebase({
          changeMode: `mutate`,
          sourcePath: targetPath,
          newBasePath: basePath,
        })

        core.info(`✅ Successfully created dist-tag ${tag_name} pointing to ${semver_tag}`)
      },
    },
  },
})
