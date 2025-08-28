import { pickMatching } from '#lib/kit-temp/other'
import React from 'react'

interface Props {
  x: number
  y: number
  width: number
  className?: string
  onClick?: () => void
  title?: string
  [key: `data-${string}`]: any
}

export const Node: React.FC<Props> = ({
  x,
  y,
  width,
  className = 'catalog-railway-node',
  onClick,
  title,
  ...props
}) => {
  // Extract data attributes from props
  const dataAttributes = pickMatching(props, key => key.toString().startsWith('data-'))
  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={width / 2}
        className={className}
        onClick={onClick}
        style={{
          fill: 'var(--node-fill)',
          stroke: 'var(--node-stroke)',
          strokeWidth: 'var(--node-stroke-width)',
          strokeDasharray: 'var(--node-stroke-dasharray, none)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
        }}
        {...dataAttributes}
      />
      {title && <title>{title}</title>}
    </>
  )
}
