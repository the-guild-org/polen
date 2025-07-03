import React from 'react'
import type { DemoPageData } from '../types.ts'
import { ExternalLinkIcon, HomeIcon } from './Icons.tsx'

export const PageHeader = ({ data }: { data: DemoPageData }) => {
  const { prNumber, content, repo } = data

  return (
    <>
      {prNumber && (
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
                href={`https://github.com/${repo.owner}/${repo.name}/pull/${prNumber}`}
                className='pr-banner-link'
                target='_blank'
                rel='noreferrer'
              >
                <ExternalLinkIcon />
                View PR on GitHub
              </a>
              <a href={`https://${repo.owner}.github.io/${repo.name}/`} className='pr-banner-link'>
                <HomeIcon />
                Go to Production Demos
              </a>
            </div>
          </div>
        </div>
      )}
      <div className='header'>
        <h1>{content.title}{prNumber && ` - PR #${prNumber} Preview`}</h1>
        <p>{prNumber ? `Preview of changes in pull request #${prNumber}` : content.description}</p>
      </div>
    </>
  )
}
