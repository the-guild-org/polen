import { Str } from '@wollybeard/kit'
import { getDemoExamples } from '../../../src/lib/demos/index.ts'
import { GitHubActions } from '../../../src/lib/github-actions/index.ts'

/**
 * Create or update PR comment with demo links
 */
export default GitHubActions.createStep({
  name: 'pr-comment',
  description: 'Create or update PR comment with demo preview links',
  context: GitHubActions.PullRequestContext,
  async run({ core, github, context, pr }) {
    const pr_number = context.payload.pull_request.number.toString()
    const head_sha = context.payload.pull_request.head.sha

    let previousDeployments: Array<{ sha: string; fullSha: string; created_at: string }> = []

    try {
      // Get deployments for this PR's environment
      const { data: deployments } = await github.rest.repos.listDeployments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        environment: `pr-${pr_number}`,
        per_page: 100,
      })

      core.info(`DEBUG: Found ${deployments.length} deployments for pr-${pr_number}`)
      core.info(`DEBUG: Current head_sha: ${head_sha}`)

      // Filter out current deployment and get successful ones
      for (const deployment of deployments) {
        core.info(
          `DEBUG: Deployment ${deployment.id}: sha=${deployment.sha}, ref=${deployment.ref}, created_at=${deployment.created_at}`,
        )

        // Skip current SHA
        if (deployment.sha === head_sha || deployment.sha.startsWith(head_sha)) {
          core.info(`DEBUG: Skipping current deployment ${deployment.id}`)
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
        core.info(`DEBUG: Deployment ${deployment.id} status: ${firstStatus?.state || 'no status'}`)

        if (statuses.length > 0 && firstStatus && firstStatus.state === 'success') {
          const shortSha = deployment.sha.substring(0, 7)
          core.info(`DEBUG: Adding to previousDeployments: ${shortSha} (full: ${deployment.sha})`)
          previousDeployments.push({
            sha: shortSha,
            fullSha: deployment.sha,
            created_at: deployment.created_at,
          })
        }
      }

      // Sort by creation date (newest first)
      previousDeployments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch (error) {
      core.error(`Error fetching deployments: ${error}`)
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
      s`#### [${displayName}](${baseUrl}/latest/${example}/) – [\`${shortSha}\`](${baseUrl}/${shortSha}/${example}/)`

      // Format previous deployments per demo
      if (previousDeployments.length === 0) {
        s`Previous Deployments: (none)`
      } else {
        const deploymentLinks = previousDeployments
          .slice(0, 10)
          .map(deployment => `[\`${deployment.sha}\`](${baseUrl}/${deployment.sha}/${example}/)`)
          .join(' / ')

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

    core.info('✅ PR comment created/updated successfully')
  },
})
