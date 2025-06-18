import { z } from 'zod/v4'
import { defineWorkflowStep } from '../../src/lib/github-actions/index.ts'
import { getDemoExamples } from '../lib/demos/get-demo-examples.ts'

const GenerateDemoLinksInputs = z.object({
  pr_number: z.string(),
  head_sha: z.string(),
  github_repository_owner: z.string(),
  github_repository_name: z.string(),
  previous_deployment_links: z.string(),
})

const GenerateDemoLinksOutputs = z.object({
  links: z.string(),
})

/**
 * Generate demo links for PR comments
 */
export default defineWorkflowStep({
  name: 'generate-demo-links',
  description: 'Generate markdown links for all demo examples in a PR preview',
  inputs: GenerateDemoLinksInputs,
  outputs: GenerateDemoLinksOutputs,

  async execute({ core, inputs }) {
    const {
      pr_number,
      head_sha,
      github_repository_owner,
      github_repository_name,
      previous_deployment_links,
    } = inputs

    // Get list of demos
    const examples = await getDemoExamples()

    // Get short SHA
    const shortSha = head_sha.substring(0, 7)

    // Generate markdown for each demo
    const demoLinks = examples.map(example => {
      // Capitalize first letter for display
      const displayName = example.charAt(0).toUpperCase() + example.slice(1)

      return `#### ${displayName}
- [Latest](https://${github_repository_owner}.github.io/${github_repository_name}/pr-${pr_number}/latest/${example}/) – [\`${shortSha}\`](https://${github_repository_owner}.github.io/${github_repository_name}/pr-${pr_number}/${head_sha}/${example}/)
- Previous: ${previous_deployment_links}
`
    }).join('\\n')

    return {
      links: demoLinks,
    }
  },
})
