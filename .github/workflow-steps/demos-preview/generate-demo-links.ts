import { execSync } from 'child_process'
import { Step } from '../types.ts'

interface GenerateDemoLinksInputs {
  pr_number: string
  head_sha: string
  github_repository_owner: string
  github_repository_name: string
  previous_deployment_links: string
}

/**
 * Generate markdown links for all demo examples
 */
export default Step<GenerateDemoLinksInputs>(async ({ inputs, core }) => {
  // Get list of demos
  const examplesOutput = execSync('node --no-warnings ./.github/scripts/tools/get-demo-examples.ts', {
    encoding: 'utf-8',
  })
  const examples = examplesOutput.trim().split(' ').filter(Boolean)

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
