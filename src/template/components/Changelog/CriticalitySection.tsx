import { CRITICALITY_CONFIG, type CriticalityLevel } from '#lib/graphql-change/criticality'
import type { GraphqlChange } from '#lib/graphql-change/index'
import { Heading } from '@radix-ui/themes'
import type React from 'react'

interface CriticalitySectionProps {
  level: CriticalityLevel
  changes: GraphqlChange.Change[]
  children: React.ReactNode
}

export const CriticalitySection: React.FC<CriticalitySectionProps> = ({ level, changes, children }) => {
  if (changes.length === 0) {
    return null
  }

  const config = CRITICALITY_CONFIG[level]

  return (
    <section>
      <Heading as='h3' size='4' mb='3'>
        {config.label}
      </Heading>
      <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
        {children}
      </ul>
    </section>
  )
}
