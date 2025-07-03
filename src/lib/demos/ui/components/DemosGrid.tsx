import React from 'react'
import type { DemoConfig } from '../../config.ts'
import { getOrderedDemos } from '../../config.ts'
import type { LandingPageData } from '../data-collector.ts'
import { DemoCard } from './DemoCard.tsx'

export const DemosGrid: React.FC<{
  config: DemoConfig
  data: LandingPageData
}> = ({ config, data }) => {
  const { demoMetadata, demoExamples } = data
  const orderedExamples = getOrderedDemos(config, demoExamples)

  // Add disabled demos to the list
  const allDemos = [...orderedExamples]
  for (const [name, metadata] of Object.entries(demoMetadata)) {
    if (!metadata.enabled && !allDemos.includes(name)) {
      allDemos.push(name)
    }
  }

  return (
    <div className='demos-grid'>
      {allDemos.map(name => (
        <DemoCard
          key={name}
          name={name}
          metadata={demoMetadata[name] || { title: name, description: ``, enabled: true }}
          data={data}
        />
      ))}
    </div>
  )
}
