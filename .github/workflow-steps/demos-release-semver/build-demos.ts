import { buildDemosForTag } from '../../scripts/lib/build-demos.ts'
import { getDemoExamples } from '../../scripts/tools/get-demo-examples.ts'
import { type BuildDemosInputs, Step } from '../types.ts'

/**
 * Build demos for release step
 */
export default Step<BuildDemosInputs>(async ({ core, $, inputs }) => {
  const tag = inputs.actual_tag || inputs.tag
  const examples = await getDemoExamples()

  console.log(`Found demo-enabled examples: ${examples.join(' ')}`)

  await buildDemosForTag({ tag, examples, $, core })
})
