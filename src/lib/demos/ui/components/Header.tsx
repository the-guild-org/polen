import React from 'react'
import type { DemoConfig } from '../../config.ts'
import type { LandingPageData } from '../data-collector.ts'

export const Header: React.FC<{
  config: DemoConfig
  data: LandingPageData
}> = ({ config, data }) => {
  const { prNumber } = data.config

  let title = config.ui.content.title
  let description = config.ui.content.description

  if (prNumber) {
    title = `${title} - PR #${prNumber} Preview`
    description = `Preview of changes in pull request #${prNumber}`
  }

  return (
    <div className='header'>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
