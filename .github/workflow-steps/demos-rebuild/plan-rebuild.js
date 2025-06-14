// @ts-check

/**
 * Plan rebuild - determine which versions to rebuild
 *
 * @param {import('../../scripts/lib/async-function').AsyncFunctionArguments & { semver: typeof import('semver') }} args
 */
export default async ({ github, context, core, semver }) => {
  // Get all version tags
  const { data: tags } = await github.rest.repos.listTags({
    owner: context.repo.owner,
    repo: context.repo.repo,
    per_page: 100,
  })

  const versionTags = tags
    .map(t => t.name)
    .filter(t => semver.valid(t))
    .sort(semver.rcompare)

  console.log(`Found ${versionTags.length} version tags`)

  // Filter versions based on input
  let versionsToRebuild = []

  const sinceVersion = process.env.INPUT_SINCE_VERSION
  if (sinceVersion) {
    if (!semver.valid(sinceVersion)) {
      core.setFailed(`Invalid version: ${sinceVersion}`)
      return
    }

    versionsToRebuild = versionTags.filter(v => semver.gte(v, sinceVersion))
    console.log(`Found ${versionsToRebuild.length} versions >= ${sinceVersion}`)
  }

  // Apply skip list
  const skipVersions = (process.env.INPUT_SKIP_VERSIONS || '').split(',').map(v => v.trim()).filter(Boolean)
  if (skipVersions.length > 0) {
    versionsToRebuild = versionsToRebuild.filter(v => !skipVersions.includes(v))
    console.log(`Skipping versions: ${skipVersions.join(', ')}`)
  }

  // Get dist-tag information
  const distTags = {}
  if (process.env.INPUT_REBUILD_DIST_TAGS === 'true') {
    for (const tag of ['latest', 'next']) {
      try {
        const { data: ref } = await github.rest.git.getRef({
          owner: context.repo.owner,
          repo: context.repo.repo,
          ref: `tags/${tag}`,
        })

        // Find semver tag at this commit
        const { data: tagsAtCommit } = await github.rest.repos.listTags({
          owner: context.repo.owner,
          repo: context.repo.repo,
          per_page: 100,
        })

        const semverTag = tagsAtCommit
          .filter(t => t.commit.sha === ref.object.sha && semver.valid(t.name))
          .map(t => t.name)
          .sort(semver.rcompare)[0]

        if (semverTag) {
          distTags[tag] = semverTag
        }
      } catch (e) {
        console.log(`No ${tag} dist-tag found`)
      }
    }
  }

  console.log('Rebuild plan:')
  console.log(`- Versions: ${versionsToRebuild.join(', ') || 'none'}`)
  console.log(`- Dist tags: ${JSON.stringify(distTags)}`)

  core.setOutput('versions', JSON.stringify(versionsToRebuild))
  core.setOutput('dist_tags', JSON.stringify(distTags))
}
