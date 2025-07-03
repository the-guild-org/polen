import React from 'react'

export const PrBanner: React.FC<{
  prNumber: string
}> = ({ prNumber }) => {
  // These should be set by the GitHub Actions environment
  const repoOwner = process.env[`GITHUB_REPOSITORY_OWNER`] || `the-guild-org`
  const repoName = process.env[`GITHUB_REPOSITORY`]?.split(`/`)[1] || `polen`

  return (
    <div className='pr-banner'>
      <div className='container'>
        <div className='pr-banner-content'>
          <span className='pr-banner-badge'>PR Preview</span>
          <span className='pr-banner-text'>
            You're viewing a preview deployment for Pull Request #{prNumber}
          </span>
        </div>
        <div className='pr-banner-links'>
          <a
            href={`https://github.com/${repoOwner}/${repoName}/pull/${prNumber}`}
            className='pr-banner-link'
            target='_blank'
            rel='noreferrer'
          >
            <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
              />
            </svg>
            View PR on GitHub
          </a>
          <a href={`https://${repoOwner}.github.io/${repoName}/`} className='pr-banner-link'>
            <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
              />
            </svg>
            Go to Production Demos
          </a>
        </div>
      </div>
    </div>
  )
}
