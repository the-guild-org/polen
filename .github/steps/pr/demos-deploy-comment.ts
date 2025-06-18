import { Str } from '@wollybeard/kit'
import { getDemoExamples } from '../../../src/lib/demos/index.ts'
import { defineStep, PullRequestContext } from '../../../src/lib/github-actions/index.ts'

/**
 * Create or update PR comment with demo links
 */
export default defineStep({
  name: 'pr-comment',
  description: 'Create or update PR comment with demo preview links',
  context: PullRequestContext,
  async run({ core, github, context, pr }) {
    const pr_number = context.payload.pull_request.number.toString()
    const head_sha = context.payload.pull_request.head.sha

    let previousDeploymentsText: string
    try {
      // Get deployments for this PR's environment
      const { data: deployments } = await github.rest.repos.listDeployments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        environment: `pr-${pr_number}`,
        per_page: 100,
      })

      // Filter out current deployment and get successful ones
      const previousDeployments = []

      for (const deployment of deployments) {
        // Skip current SHA
        if (deployment.sha === head_sha || deployment.sha.startsWith(head_sha)) {
          continue
        }

        // Check deployment status
        const { data: statuses } = await github.rest.repos.listDeploymentStatuses({
          owner: context.repo.owner,
          repo: context.repo.repo,
          deployment_id: deployment.id,
          per_page: 1,
        })

        // Only include successful deployments
        const firstStatus = statuses[0]
        if (statuses.length > 0 && firstStatus && firstStatus.state === 'success') {
          const shortSha = deployment.sha.substring(0, 7)
          // Construct proper URL with /polen prefix and SHA path
          const deploymentUrl =
            `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${pr_number}/${deployment.sha}/`
          previousDeployments.push({
            sha: shortSha,
            fullSha: deployment.sha,
            url: deploymentUrl,
            created_at: deployment.created_at,
          })
        }
      }

      // Sort by creation date (newest first)
      previousDeployments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      if (previousDeployments.length === 0) {
        previousDeploymentsText = '(none)'
      } else {
        // Format as markdown links - limit to 10 most recent
        const links = previousDeployments.slice(0, 10).map(deployment => `[\`${deployment.sha}\`](${deployment.url})`)
        previousDeploymentsText = links.join(' / ')

        if (previousDeployments.length > 10) {
          previousDeploymentsText += ` and ${previousDeployments.length - 10} more`
        }
      }
    } catch (error) {
      core.error(`Error fetching deployments: ${error}`)
      previousDeploymentsText = '(none)'
    }

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

    for (const example of examples) {
      const displayName = Str.Case.title(example)
      const baseUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${pr_number}`

      // let text = ''
      s`#### [${displayName}](${baseUrl}/latest/${example}/) – [\`${shortSha}\`](${baseUrl}/${head_sha}/${example}/)`
      s`Previous Deployments: ${previousDeploymentsText}`
    }

    //
    // ━━ Send
    //

    await pr.comment({
      content: s.toString(),
    })

    core.info('✅ PR comment created/updated successfully')
  },
})
