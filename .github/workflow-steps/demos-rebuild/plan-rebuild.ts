import {
  compare as semverCompare,
  gte as semverGte,
  parse as semverParse,
  prerelease as semverPrerelease,
  valid as semverValid,
} from '@vltpkg/semver'
import { type PlanRebuildInputs, Step } from '../types.ts'

/**
 * Plan rebuild - determine which versions to rebuild
 */
export default Step<PlanRebuildInputs>(async ({ github, context, core, inputs = {} }) => {
  // Get all version tags
  const { data: tags } = await github.rest.repos.listTags({
    owner: context.repo.owner,
    repo: context.repo.repo,
    per_page: 100,
  })

  const versionTags = tags
    .map((t) => t.name)
    .filter((t): t is string => semverValid(t) !== undefined)
    .sort((a, b) => {
      const vA = semverParse(a)
      const vB = semverParse(b)
      return vA && vB ? semverCompare(vB, vA) : 0
    })

  console.log(`Found ${versionTags.length} version tags`)

  // Filter versions based on input
  let versionsToRebuild: string[] = []

  const sinceVersion = inputs.since_version
  if (sinceVersion) {
    if (!semverValid(sinceVersion)) {
      core.setFailed(`Invalid version: ${sinceVersion}`)
      return
    }

    versionsToRebuild = versionTags.filter((v: string) => {
      const vParsed = semverParse(v)
      const sinceParsed = semverParse(sinceVersion)
      return vParsed && sinceParsed && semverGte(vParsed, sinceParsed)
    })
    console.log(
      `Found ${versionsToRebuild.length} versions >= ${sinceVersion}`,
    )
  }

  // Apply skip list
  const skipVersions = (inputs.skip_versions || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  if (skipVersions.length > 0) {
    versionsToRebuild = versionsToRebuild.filter(
      (v) => !skipVersions.includes(v),
    )
    console.log(`Skipping versions: ${skipVersions.join(', ')}`)
  }

  // Get dist-tag information
  const distTags: Record<string, string> = {}
  if (inputs.rebuild_dist_tags === 'true') {
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
          .filter(
            (t) => t.commit.sha === ref.object.sha && semverValid(t.name),
          )
          .map((t) => t.name)
          .sort((a, b) => {
            const vA = semverParse(a)
            const vB = semverParse(b)
            return vA && vB ? semverCompare(vB, vA) : 0
          })[0]

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
})
