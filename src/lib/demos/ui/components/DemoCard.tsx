import React from 'react'
import type { Demo, DemoPageData } from '../types.ts'
import { PrDeploymentLinks } from './PrDeploymentLinks.tsx'
import { TrunkDeploymentLinks } from './TrunkDeploymentLinks.tsx'

export const DemoCard = ({ demo, data }: { demo: Demo; data: DemoPageData }) => {
  const { name, title, description, enabled } = demo
  const { basePath, deployments } = data

  if (!enabled) {
    return (
      <div className='demo-card disabled'>
        <h2>{title}</h2>
        <p>{description}</p>
        <span className='demo-link'>Coming Soon</span>
      </div>
    )
  }

  const renderLinks = () => {
    if (deployments.type === 'trunk') {
      return <TrunkDeploymentLinks deployment={deployments} name={name} basePath={basePath} />
    }
    return <PrDeploymentLinks deployment={deployments} name={name} basePath={basePath} />
  }

  const renderPreviousVersions = () => {
    let previousVersions: Array<{ label: string; href: string }> = []

    if (deployments.type === 'trunk') {
      previousVersions = deployments.previous.map(deployment => ({
        label: deployment.tag || deployment.shortSha,
        href: `${basePath}${deployment.sha}/${name}/`,
      }))
    } else {
      // For PR deployments, find the current PR
      const currentPr = deployments.deployments.find(
        pr => pr.number.toString() === deployments.prNumber,
      )
      if (currentPr?.previousDeployments) {
        previousVersions = currentPr.previousDeployments
          .filter(sha => sha !== deployments.currentSha)
          .map(sha => ({
            label: sha.substring(0, 7),
            href: `${basePath}${sha}/${name}/`,
          }))
      }
    }

    return (
      <div className='previous-versions'>
        <h3>Previous Versions</h3>
        {previousVersions.length > 0
          ? (
            <div className='commit-links'>
              {previousVersions.map(({ label, href }) => (
                <a key={label} href={href} className='commit-link'>
                  {label}
                </a>
              ))}
            </div>
          )
          : <p className='text-muted-inline'>(none)</p>}
      </div>
    )
  }

  return (
    <div className='demo-card'>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className='demo-links'>
        {renderLinks()}
        {renderPreviousVersions()}
      </div>
    </div>
  )
}
