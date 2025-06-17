import { buildDemosForTag } from '../../scripts/lib/build-demos.ts'
import { getDemoExamples } from '../../scripts/tools/get-demo-examples.ts'
import { type BuildDemosInputs, Step } from '../types.ts'

/**
 * Build demos for a specific semver release
 *
 * WHAT: Builds demo sites for a newly released Polen version
 * WHY: Creates live demos that showcase the exact features available in this release
 *
 * This is used during the release workflow when a new version is published.
 * It builds demos using the examples as they existed at the time of release,
 * ensuring the demos accurately represent what users get with that version.
 *
 * The demos are built with the appropriate base path for deployment:
 * - Stable releases: Built for /latest/ (will be copied there)
 * - Prereleases: Built for /{version}/ deployment
 */
export default Step<BuildDemosInputs>(async ({ core, $, inputs }) => {
  core.startGroup('Build demos for release')
  const tag = inputs.actual_tag || inputs.tag
  const examples = await getDemoExamples()

  core.info(`Found demo-enabled examples: ${examples.join(' ')}`)

  await buildDemosForTag({ tag, examples, $, core })

  core.endGroup()
})
