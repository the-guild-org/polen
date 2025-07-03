import React from 'react'
import type { LandingPageData } from '../data-collector.ts'

export const PreviousVersions: React.FC<{
  name: string
  data: LandingPageData
}> = ({ name, data }) => {
  const { basePath, prNumber, currentSha } = data.config
  const { trunkDeployments, prDeployments } = data

  // Get previous deployments for PR from the passed data
  let previousDeployments: string[] = []
  if (prNumber && prDeployments) {
    const currentPr = prDeployments.find(pr => pr.number.toString() === prNumber)
    if (currentPr?.previousDeployments) {
      previousDeployments = currentPr.previousDeployments.filter(sha => sha !== currentSha)
    }
  }

  const hasVersions = !prNumber
    ? trunkDeployments && trunkDeployments.previous.length > 0
    : previousDeployments.length > 0

  return (
    <div className='previous-versions'>
      <h3>Previous Versions</h3>
      {!prNumber && trunkDeployments
        ? (
          trunkDeployments.previous.length > 0
            ? (
              <div className='commit-links'>
                {trunkDeployments.previous.map(deployment => {
                  // For semver deployments, tag and sha are the same, so just show once
                  const label = deployment.tag || deployment.shortSha
                  return (
                    <a
                      key={deployment.sha}
                      href={`${basePath}${deployment.sha}/${name}/`}
                      className='commit-link'
                    >
                      {label}
                    </a>
                  )
                })}
              </div>
            )
            : <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>(none)</p>
        )
        : previousDeployments.length > 0
        ? (
          <div className='commit-links'>
            {previousDeployments.map(sha => (
              <a
                key={sha}
                href={`${basePath}${sha}/${name}/`}
                className='commit-link'
              >
                {sha.substring(0, 7)}
              </a>
            ))}
          </div>
        )
        : <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>(none)</p>}
    </div>
  )
}
