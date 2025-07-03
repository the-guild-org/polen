import React from 'react'
import type { DemoPageData } from '../types.ts'

export const VersionInfo = ({ data }: { data: DemoPageData }) => {
  const { deployments, basePath } = data

  if (deployments.type !== 'trunk') {
    return null
  }

  const { distTags, previous } = deployments

  const distTagsElements = Object.entries(distTags).map(([tag, version]) => {
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

  const previousVersionsElements = previous && previous.length > 0
    ? previous
      .slice(0, 10) // Limit to recent versions
      .map(version => (
        <a key={version.tag || version.sha} href={`${basePath}${version.tag || version.sha}/`} className='version-tag'>
          {version.tag || version.shortSha}
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
          <h4 className='version-subheader'>
            Previous Versions:
          </h4>
          <div className='version-list'>{previousVersionsElements}</div>
        </>
      )}
    </div>
  )
}
