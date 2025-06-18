import { z } from 'zod/v4'
import { getDemoExamples } from '../../src/lib/demos/index.ts'
import { defineWorkflowStep, GitHubContextSchema } from '../../src/lib/github-actions/index.ts'

const PreviousStepOutputs = z.object({
  deployment_links: z.string().optional().default('(none)'),
})

const GenerateDemoLinksInputs = z.object({
  pr_number: z.string(),
  head_sha: z.string(),
  context: GitHubContextSchema,
  previous: PreviousStepOutputs,
})

const GenerateDemoLinksOutputs = z.object({
  links: z.string(),
})

type Inputs = z.infer<typeof GenerateDemoLinksInputs>
type Outputs = z.infer<typeof GenerateDemoLinksOutputs>

/**
 * Generate demo links for PR comments
 */
export default defineWorkflowStep<Inputs, Outputs>({
  name: 'generate-demo-links',
  description: 'Generate markdown links for all demo examples in a PR preview',
  inputs: GenerateDemoLinksInputs,
  outputs: GenerateDemoLinksOutputs,

  async execute({ inputs }) {
    const {
      pr_number,
      head_sha,
      context,
      previous,
    } = inputs

    // Extract repository info from github context
    const [owner, repo] = context.repository.split('/') as [string, string]

    // Get list of demos
    const examples = await getDemoExamples()

    // Get short SHA
    const shortSha = head_sha.substring(0, 7)

    // Generate markdown for each demo
    const demoLinks = examples.map(example => {
      // Capitalize first letter for display
      const displayName = example.charAt(0).toUpperCase() + example.slice(1)
      const baseUrl = `https://${owner}.github.io/${repo}/pr-${pr_number}`

      return `- **${displayName}**: [View Demo](${baseUrl}/latest/${example}/) • [Commit ${shortSha}](${baseUrl}/${head_sha}/${example}/)`
    }).join('\n')

    return {
      links: demoLinks,
    }
  },
})
