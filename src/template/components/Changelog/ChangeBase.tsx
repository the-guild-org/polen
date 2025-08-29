import { Change as GraphqlChange } from '#lib/change/$'
import type React from 'react'

interface ChangeBaseProps {
  change: GraphqlChange.Change
  children: React.ReactNode
}

export const ChangeBase: React.FC<ChangeBaseProps> = ({ change, children }) => {
  return (
    <li style={{ marginBottom: '0.5rem' }}>
      {children}
    </li>
  )
}
