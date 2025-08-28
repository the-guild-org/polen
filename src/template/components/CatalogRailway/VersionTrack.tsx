import { Catalog } from '#lib/catalog/$'
import { Schema } from '#lib/schema/$'
import React from 'react'
import type { RevisionClickEventHandler, VersionClickEventHandler } from './CatalogRailway.js'
import { type Address, calculateNodePosition, type Dimensions, type LayoutMode, RevisionAddress } from './helpers.js'
import { InitialNode } from './InitialNode.js'
import { RevisionNode } from './RevisionNode.js'

interface Props {
  schema: Schema.Versioned.Versioned
  index: number
  dimensions: Dimensions
  catalog: Catalog.Versioned.Versioned
  currentAddress?: Address | undefined
  onRevisionClick?: RevisionClickEventHandler | undefined
  onVersionClick?: VersionClickEventHandler | undefined
  showVersionLabel?: boolean
  layoutMode?: LayoutMode
}

export const VersionTrack: React.FC<Props> = ({
  schema,
  index,
  dimensions,
  catalog,
  currentAddress,
  onRevisionClick,
  onVersionClick,
  showVersionLabel = true,
  layoutMode = 'uniform',
}) => {
  const isInitialVersion = schema.branchPoint === null
  const initialNodeCount = isInitialVersion ? 1 : 0
  const totalNodes = schema.revisions.length + initialNodeCount

  // Check if this version is the current one from URL
  const isCurrentVersion = currentAddress?.schema === schema
  const trackOpacity = currentAddress ? (isCurrentVersion ? 1 : 0.5) : 1

  const x = dimensions.layout.marginLeft + index * dimensions.track.gap

  // Calculate Y positions based on layout mode
  const calculateTrackPositions = () => {
    if (layoutMode === 'temporal' && dimensions.temporal) {
      // For temporal layout, calculate based on actual dates
      if (schema.revisions.length === 0) {
        return { yStart: dimensions.layout.marginTop, yEnd: dimensions.layout.marginTop }
      }

      // Get positions for first and last revisions
      const firstRevision = schema.revisions[0]! // Newest
      const lastRevision = schema.revisions[schema.revisions.length - 1]! // Oldest

      const firstPos = calculateNodePosition({
        address: RevisionAddress.make(schema, firstRevision),
        dimensions,
        catalog,
        layoutMode,
      })

      const lastPos = calculateNodePosition({
        address: RevisionAddress.make(schema, lastRevision),
        dimensions,
        catalog,
        layoutMode,
      })

      return { yStart: firstPos.y, yEnd: lastPos.y }
    }

    // Uniform layout
    const yStart = dimensions.layout.marginTop
    const yEnd = yStart + (totalNodes - 1) * dimensions.node.gap
    return { yStart, yEnd }
  }

  const { yStart, yEnd } = calculateTrackPositions()

  return (
    <g key={schema.version.value} opacity={trackOpacity}>
      {/* Version label */}
      {showVersionLabel && (
        <text
          x={x}
          y={yStart - dimensions.versionLabel.marginBottom}
          fill={isCurrentVersion ? 'var(--accent-11)' : 'var(--gray-11)'}
          fontWeight={isCurrentVersion ? 'bold' : 'normal'}
          style={{ cursor: 'pointer' }}
          onClick={() => onVersionClick?.({ schema })}
        >
          {schema.version.value}
        </text>
      )}

      {/* Track line */}
      <line
        x1={x}
        y1={yStart}
        x2={x}
        y2={yEnd}
        stroke='var(--gray-8)'
        strokeWidth='2'
      />

      {/* Initial node at the bottom */}
      {isInitialVersion && (
        <InitialNode
          x={x}
          y={yEnd}
          width={dimensions.node.width}
        />
      )}

      {/* Revision nodes - display oldest at bottom, newest at top (reverse data order) */}
      {schema.revisions.map((revision) => {
        const address = RevisionAddress.make(schema, revision)
        const position = calculateNodePosition({ address, dimensions, catalog, layoutMode })
        const isCurrent = currentAddress?._tag === 'RevisionAddress'
          && currentAddress.schema === schema
          && currentAddress.revision === revision

        return (
          <RevisionNode
            key={`${schema.version.value}-${revision.date}`}
            address={address}
            x={position.x}
            y={position.y}
            isCurrent={isCurrent}
            width={dimensions.node.width}
            onClick={onRevisionClick}
          />
        )
      })}
    </g>
  )
}
