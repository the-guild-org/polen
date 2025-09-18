// TODO: Review and replace inline styles with Tailwind classes
import { Change } from 'graphql-kit'

type CriticalityLevel = 'BREAKING' | 'DANGEROUS' | 'NON_BREAKING'

const CRITICALITY_CONFIG = {
  BREAKING: {
    label: 'Breaking Changes',
    color: 'red',
  },
  DANGEROUS: {
    label: 'Dangerous Changes',
    color: 'orange',
  },
  NON_BREAKING: {
    label: 'Safe Changes',
    color: 'green',
  },
} as const
import type React from 'react'
import { Heading } from '../ui/index.js'

interface CriticalitySectionProps {
  level: CriticalityLevel
  changes: Change.Change[]
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
