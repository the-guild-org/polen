import { getDemoExamples } from '#lib/demos/index'
import { GitHubActions } from '#lib/github-actions/index'
import { Str } from '@wollybeard/kit'

export default GitHubActions.createStep({
  context: GitHubActions.PullRequestContext,
  async run({ core, context, pr }) {
    const pr_number = context.payload.pull_request.number.toString()
    const head_sha = context.payload.pull_request.head.sha

    const allDeployments = await pr.fetchDeployments()
    const previousDeployments = allDeployments.slice(1)

    //
    // ━━ Format
    //

    // Get list of demos
    const examples = await getDemoExamples()

    // Get short SHA
    const shortSha = head_sha.substring(0, 7)

    const s = Str.Builder()

    const baseUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${pr_number}`
    s`## [Polen Demos Preview](${baseUrl})`

    // Get current timestamp
    const now = new Date()
    const timestamp = now.toLocaleString(`en-US`, {
      hour: `2-digit`,
      minute: `2-digit`,
      day: `numeric`,
      month: `long`,
      year: `numeric`,
      hour12: false,
    })
    s`**<sup>Last updated at ${timestamp}</sup>**`

    for (const example of examples) {
      const displayName = Str.Case.title(example)
      const baseUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${pr_number}`

      // let text = ''
      s`#### [${displayName}](${baseUrl}/latest/${example}/) – [\`${shortSha}\`](${baseUrl}/${shortSha}/${example}/)`

      // Format previous deployments per demo
      if (previousDeployments.length === 0) {
        s`Previous Deployments: (none)`
      } else {
        const deploymentLinks = previousDeployments
          .slice(0, 10)
          .map(deployment => `[\`${deployment.shortSha}\`](${baseUrl}/${deployment.shortSha}/${example}/)`)
          .join(` / `)

        let previousDeploymentsText = `Previous Deployments: ${deploymentLinks}`
        if (previousDeployments.length > 10) {
          previousDeploymentsText += ` and ${previousDeployments.length - 10} more`
        }
        s`${previousDeploymentsText}`
      }
    }

    //
    // ━━ Send
    //

    await pr.comment({
      content: s.toString(),
    })

    core.info(`✅ PR comment created/updated successfully`)
  },
})
