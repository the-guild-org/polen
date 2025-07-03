import React from 'react'
import { ArrowRightIcon } from './Icons.tsx'

export const DistTagButton: React.FC<{
  tag: string
  version: string
  demoName: string
  basePath: string
  fullSha?: string
}> = ({ tag, version, demoName, basePath, fullSha }) => {
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
