// @ts-check

/**
 * Generate rebuild summary
 *
 * @param {import('../../scripts/lib/async-function').AsyncFunctionArguments} args
 */
export default async ({ core }) => {
  const versions = JSON.parse(process.env.VERSIONS_TO_BUILD)
  const distTags = JSON.parse(process.env.DIST_TAGS)
  const dryRun = process.env.INPUT_DRY_RUN === 'true'

  let summary = '# Demos Rebuild Summary\n\n'

  if (dryRun) {
    summary += '**🔍 DRY RUN MODE**\n\n'
  }

  summary += '## Versions\n'
  if (versions.length > 0) {
    summary += versions.map(v => `- ${v}`).join('\n')
  } else {
    summary += 'No versions to rebuild\n'
  }

  summary += '\n\n## Dist Tags\n'
  if (Object.keys(distTags).length > 0) {
    for (const [tag, version] of Object.entries(distTags)) {
      summary += `- ${tag} → ${version}\n`
    }
  } else {
    summary += 'No dist-tags to rebuild\n'
  }

  await core.summary.addRaw(summary).write()
}
