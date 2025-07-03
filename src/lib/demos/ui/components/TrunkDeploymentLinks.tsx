import React from 'react'
import type { TrunkDeployments } from '../types.ts'
import { DistTagButton } from './DistTagButton.tsx'
import { ArrowRightIcon } from './Icons.tsx'

export const TrunkDeploymentLinks = ({
  deployment,
  name,
  basePath,
}: {
  deployment: TrunkDeployments
  name: string
  basePath: string
}) => {
  const { distTags, latest } = deployment

  if (Object.entries(distTags).length > 0) {
    const sortedTags = Object.entries(distTags)
      .sort(([a], [b]) => (a === `latest` ? -1 : b === `latest` ? 1 : 0))
      .filter(([tag, version]) => {
        // If next points to the same version as latest, filter it out
        if (tag === `next` && distTags[`latest`] === version) {
          return false
        }
        return true
      })

    return (
      <>
        <div className='dist-tags'>
          {sortedTags.map(([tag, version]) => (
            <DistTagButton
              key={tag}
              tag={tag}
              version={version}
              demoName={name}
              basePath={basePath}
            />
          ))}
        </div>
        {distTags?.[`next`] && distTags[`next`] === distTags[`latest`] && (
          <div className='disabled mt-3'>
            <span className='demo-link demo-link-full'>
              No pre-releases since latest
            </span>
          </div>
        )}
      </>
    )
  }

  if (latest) {
    return (
      <a href={`${basePath}latest/${name}/`} className='demo-link'>
        View Latest ({latest.tag || latest.shortSha})
        <ArrowRightIcon />
      </a>
    )
  }

  return <p className='text-muted'>No deployments available</p>
}
