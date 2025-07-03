import React from 'react'
import type { LandingPageData } from '../data-collector.ts'

export const VersionInfo: React.FC<{
  data: LandingPageData
}> = ({ data }) => {
  const { trunkDeployments, distTags } = data

  if (!trunkDeployments) return null

  const basePath = data.config.basePath || `/`

  const distTagsElements = distTags
    ? Object.entries(distTags).map(([tag, version]) => {
      const className = tag === `latest`
        ? `version-tag latest`
        : tag === `next`
        ? `version-tag next`
        : `version-tag`
      return (
        <a key={tag} href={`${basePath}${version}/`} className={className}>
          {tag}: {version}
        </a>
      )
    })
    : []

  const previousVersionsElements = trunkDeployments.previous && trunkDeployments.previous.length > 0
    ? trunkDeployments.previous
      .slice(0, 10) // Limit to recent versions
      .map(version => (
        <a key={version.tag} href={`${basePath}${version.tag}/`} className='version-tag'>
          {version.tag}
        </a>
      ))
    : []

  // Only show the version info section if there's content to display
  if (distTagsElements.length === 0 && previousVersionsElements.length === 0) {
    return null
  }

  return (
    <div className='version-info'>
      <h3>Available Versions</h3>
      {distTagsElements.length > 0 && <div className='version-list'>{distTagsElements}</div>}
      {previousVersionsElements.length > 0 && (
        <>
          <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
            Previous Versions:
          </h4>
          <div className='version-list'>{previousVersionsElements}</div>
        </>
      )}
    </div>
  )
}
