import React from 'react'
import type { DemoMetadata, LandingPageData } from '../data-collector.ts'
import { DemoLinks } from './DemoLinks.tsx'
import { PreviousVersions } from './PreviousVersions.tsx'

export const DemoCard: React.FC<{
  name: string
  metadata: DemoMetadata
  data: LandingPageData
}> = ({ name, metadata, data }) => {
  const { title, description, enabled } = metadata

  if (!enabled) {
    return (
      <div className='demo-card disabled'>
        <h2>{title}</h2>
        <p>{description}</p>
        <span className='demo-link'>
          Coming Soon
        </span>
      </div>
    )
  }

  return (
    <div className='demo-card'>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className='demo-links'>
        <DemoLinks name={name} data={data} />
        <PreviousVersions name={name} data={data} />
      </div>
    </div>
  )
}
