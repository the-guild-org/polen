// @ts-check
import { buildDemosForTag } from '../../scripts/lib/build-demos.js'
import getDemoExamples from '../../scripts/tools/get-demo-examples.js'

/**
 * Build demos for release step
 *
 * @param {import('../../scripts/lib/async-function').AsyncFunctionArguments} args
 */
export default async ({ core, exec }) => {
  const tag = process.env.ACTUAL_TAG
  const examples = getDemoExamples()

  console.log(`Found demo-enabled examples: ${examples.join(' ')}`)

  await buildDemosForTag({ tag, examples, exec, core })
}
