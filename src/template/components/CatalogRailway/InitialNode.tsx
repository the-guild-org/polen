import React from 'react'
import { Node } from './Node.js'

interface Props {
  x: number
  y: number
  width?: number
}

export const InitialNode: React.FC<Props> = ({ x, y, width }) => {
  const width_ = width ?? 10
  return (
    <g key={'__initial__'} className='catalog-railway-initial-node'>
      <Node
        x={x}
        y={y}
        width={width_}
        data-type='initial'
      />
    </g>
  )
}
