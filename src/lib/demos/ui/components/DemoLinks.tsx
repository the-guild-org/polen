import React from 'react'
import type { LandingPageData } from '../data-collector.ts'
import { DistTagButton } from './DistTagButton.tsx'

export const DemoLinks: React.FC<{
  name: string
  data: LandingPageData
}> = ({ name, data }) => {
  const { basePath, prNumber, currentSha } = data.config
  const { distTags, trunkDeployments, prDeployments } = data

  // For trunk deployments, show dist-tag buttons
  if (!prNumber) {
    if (distTags && Object.entries(distTags).length > 0) {
      const sortedTags = Object.entries(distTags)
        .sort(([a], [b]) => a === `latest` ? -1 : b === `latest` ? 1 : 0)
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
            <div className='disabled' style={{ marginTop: '0.75rem' }}>
              <span className='demo-link' style={{ width: '100%', justifyContent: 'center' }}>
                No pre-releases since latest
              </span>
            </div>
          )}
        </>
      )
    }

    if (trunkDeployments?.latest) {
      return (
        <a href={`${basePath}latest/${name}/`} className='demo-link'>
          View Latest ({trunkDeployments.latest.tag || trunkDeployments.latest.shortSha})
          <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M14 5l7 7m0 0l-7 7m7-7H3' />
          </svg>
        </a>
      )
    }

    return <p style={{ color: '#666', fontSize: '0.875rem' }}>No deployments available</p>
  }

  // For PR deployments
  if (prDeployments && prDeployments.length > 0) {
    if (currentSha) {
      // If we have currentSha, show the specific deployment
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

    // Otherwise show available deployments for this PR
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

  return <p style={{ color: '#666', fontSize: '0.875rem' }}>No deployments available</p>
}
