import { Grid } from '@radix-ui/themes'
import * as React from 'react'

interface SwissGridProps {
  variant?: 'symmetric' | 'asymmetric' | 'golden'
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

/**
 * Swiss Grid Component
 *
 * A mathematical grid system inspired by Swiss design principles.
 * Features asymmetric layouts and golden ratio proportions.
 */
export const SwissGrid: React.FC<SwissGridProps> = ({
  variant = 'asymmetric',
  children,
  style,
  className,
}) => {
  const columns = {
    symmetric: 'repeat(12, 1fr)',
    asymmetric: '2fr 3fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    golden: '5fr 3fr 2fr 2fr',
  }[variant]

  return (
    <Grid
      className={className}
      style={{
        gridTemplateColumns: columns,
        columnGap: 'var(--space-3)',
        rowGap: 'var(--space-6)',
        ...style,
      }}
    >
      {children}
    </Grid>
  )
}
