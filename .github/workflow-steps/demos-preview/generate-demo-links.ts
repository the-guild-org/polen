import { getDemoExamples } from '../../scripts/tools/get-demo-examples.ts'
import { Step } from '../types.ts'

interface GenerateDemoLinksInputs {
  pr_number: string
  head_sha: string
  github_repository_owner: string
  github_repository_name: string
  previous_deployment_links: string
}

/**
 * Generate markdown links for all demo examples in a PR preview
 *
 * WHAT: Creates formatted markdown text showing links to PR demo deployments
 * WHY: Provides convenient access to both latest and commit-specific demo versions for PR reviews
 *
 * Creates two types of links for each demo:
 * - Latest link: Points to PR's latest deployment (updated on each push)
 * - Commit-specific link: Points to specific SHA deployment (permanent)
 *
 * @example
 * Output format:
 * #### Pokemon
 * - [Latest](https://org.github.io/repo/pr-123/latest/pokemon/) – [`abc1234`](https://org.github.io/repo/pr-123/abc1234/pokemon/)
 * - Previous: [`def5678`](url) / [`ghi9012`](url)
 */
export default Step<GenerateDemoLinksInputs>(async ({ inputs, core }) => {
  // Get list of demos
  const examples = await getDemoExamples()

  // Get short SHA
  const shortSha = inputs.head_sha.substring(0, 7)

  // Generate markdown for each demo
  const demoLinks = examples.map(example => {
    // Capitalize first letter for display
    const displayName = example.charAt(0).toUpperCase() + example.slice(1)

    return `#### ${displayName}
- [Latest](https://${inputs.github_repository_owner}.github.io/${inputs.github_repository_name}/pr-${inputs.pr_number}/latest/${example}/) – [\`${shortSha}\`](https://${inputs.github_repository_owner}.github.io/${inputs.github_repository_name}/pr-${inputs.pr_number}/${inputs.head_sha}/${example}/)
- Previous: ${inputs.previous_deployment_links}
`
  }).join('\n')

  core.setOutput('links', demoLinks)
})
