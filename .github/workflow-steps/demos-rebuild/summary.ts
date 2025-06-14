// TypeScript version of summary.js
import { type RebuildInputs, Step } from '../types.ts'

export default Step<RebuildInputs>(async ({ core, inputs }) => {
  const versions = inputs.versions_to_build
  const distTags = inputs.dist_tags
  const dryRun = inputs.dry_run

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
})
