import React from 'react'
import type { PrDeployments } from '../types.ts'
import { DistTagButton } from './DistTagButton.tsx'

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
