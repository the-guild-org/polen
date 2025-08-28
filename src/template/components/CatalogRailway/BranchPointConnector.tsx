import { Catalog } from '#lib/catalog/$'
import { Schema } from '#lib/schema/$'
import React from 'react'
import { calculateNodePosition, type LayoutMode, RevisionAddress } from './helpers.js'
import type { Dimensions } from './helpers.js'

interface Props {
  schema: Schema.Versioned.Versioned
  dimensions: Dimensions
  catalog: Catalog.Versioned.Versioned
  layoutMode?: LayoutMode
}

export const BranchPointConnector: React.FC<Props> = ({
  schema,
  dimensions,
  catalog,
  layoutMode = 'uniform',
}) => {
  // Only render if schema has a branch point
  if (!schema.branchPoint) return null

  const parentAddress = RevisionAddress.make(
    schema.branchPoint!.schema,
    schema.branchPoint!.revision,
  )
  const childAddress = RevisionAddress.make(
    schema,
    schema.revisions[schema.revisions.length - 1]!,
  )

  const parentPosition = calculateNodePosition({ address: parentAddress, dimensions, catalog, layoutMode })
  const childPosition = calculateNodePosition({ address: childAddress, dimensions, catalog, layoutMode })

  // Create a curved branch connector
  const midY = parentPosition.y + (childPosition.y - parentPosition.y) / 2

  return (
    <g className='branch-connector'>
      {/* Curved path from parent to child */}
      <path
        d={`M ${parentPosition.x} ${parentPosition.y} Q ${
          parentPosition.x + (childPosition.x - parentPosition.x) / 2
        } ${midY} ${childPosition.x} ${childPosition.y}`}
        fill='none'
        stroke='var(--gray-7)'
        strokeWidth='1.5'
        strokeDasharray='3,2'
        opacity='0.6'
      />

      {/* Arrow head at child end */}
      <polygon
        points={`${childPosition.x - 3},${childPosition.y - 3} ${childPosition.x + 3},${
          childPosition.y - 3
        } ${childPosition.x},${childPosition.y + 2}`}
        fill='var(--gray-7)'
        opacity='0.6'
      />
    </g>
  )
}
