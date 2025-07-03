import React from 'react'

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
        <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M14 5l7 7m0 0l-7 7m7-7H3' />
        </svg>
      </a>
      <a href={versionHref} className='dist-tag-version'>
        {version}
        <span className='permalink-icon'>¶</span>
      </a>
    </div>
  )
}
