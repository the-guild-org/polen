import React from 'react'
import type { PrDeployments } from '../types.ts'
import { ArrowRightIcon } from './Icons.tsx'

const DistTagButton = ({
  tag,
  version,
  demoName,
  basePath,
  fullSha,
}: {
  tag: string
  version: string
  demoName: string
  basePath: string
  fullSha?: string
}) => {
  const tagHref = `${basePath}${tag}/${demoName}/`
  const versionHref = `${basePath}${fullSha || version}/${demoName}/`

  return (
    <div className='dist-tag-button'>
      <a href={tagHref} className='dist-tag-label'>
        {tag}
        <ArrowRightIcon />
      </a>
      <a href={versionHref} className='dist-tag-version'>
        {version}
        <span className='permalink-icon'>¶</span>
      </a>
    </div>
  )
}

export const PrDeploymentLinks = ({
  deployment,
  name,
  basePath,
}: {
  deployment: PrDeployments
  name: string
  basePath: string
}) => {
  const { currentSha, deployments: prDeployments } = deployment

  if (prDeployments.length > 0) {
    if (currentSha) {
      return (
        <div className='dist-tags'>
          <DistTagButton
            tag='latest'
            version={currentSha.substring(0, 7)}
            demoName={name}
            basePath={basePath}
            fullSha={currentSha}
          />
        </div>
      )
    }

    if (prDeployments[0]?.sha) {
      return (
        <div className='dist-tags'>
          <DistTagButton
            tag='latest'
            version={prDeployments[0].sha}
            demoName={name}
            basePath={basePath}
            fullSha={prDeployments[0].sha}
          />
        </div>
      )
    }
  }

  return <p className='text-muted'>No deployments available</p>
}