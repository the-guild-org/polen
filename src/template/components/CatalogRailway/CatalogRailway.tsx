import { Catalog } from '#lib/catalog/$'
import { Schema } from '#lib/schema/$'
import { Box } from '@radix-ui/themes'
import React from 'react'
import { BranchPointConnector } from './BranchPointConnector.js'
import './CatalogRailway.css'
import {
  type Address,
  calculateTemporalHeight,
  type Dimensions,
  type LayoutMode,
  type RevisionClickEvent,
} from './helpers.js'
import { VersionTrack } from './VersionTrack.js'

export type RevisionClickEventHandler = (event: RevisionClickEvent) => void
export type VersionClickEventHandler = (event: { schema: Schema.Versioned.Versioned }) => void

interface Props {
  catalog: Catalog.Catalog
  currentAddress?: Address | undefined
  onRevisionClick?: RevisionClickEventHandler | undefined
  onVersionClick?: VersionClickEventHandler | undefined
  layoutMode?: LayoutMode
}

export const CatalogRailway: React.FC<Props> = ({
  catalog,
  currentAddress,
  onRevisionClick,
  onVersionClick,
  layoutMode = 'uniform',
}) => {
  if (Catalog.Unversioned.is(catalog)) {
    throw new Error('Railway visualization requires a versioned catalog.')
  }

  const dimensions: Dimensions = {
    global: {
      fontSize: 11,
    },
    layout: {
      marginLeft: 20,
      marginTop: 50,
      marginBottom: 20,
    },
    track: {
      gap: 20,
    },
    node: {
      width: 8,
      gap: 20,
    },
    versionLabel: {
      marginBottom: 20,
    },
    temporal: {
      pixelsPerDay: 2, // ~730px per year for better spacing
      minGap: 20, // Increase minimum gap between nodes
    },
  }

  // Calculate SVG dimensions based on content and layout mode
  const calculateHeight = () => {
    if (layoutMode === 'temporal') {
      return calculateTemporalHeight({ catalog, dimensions })
    }
    // Uniform layout height calculation
    const maxRevisions = Math.max(...catalog.entries.map(s => {
      const initialNodeCount = s.branchPoint === null ? 1 : 0
      return s.revisions.length + initialNodeCount
    }))
    return dimensions.layout.marginTop + maxRevisions * dimensions.node.gap + dimensions.layout.marginBottom
  }

  const calculatedDimensions = {
    height: calculateHeight(),
    width: dimensions.layout.marginLeft * 2 + catalog.entries.length * dimensions.track.gap,
  }

  return (
    <Box
      style={{
        position: 'relative',
        width: '150px',
        height: 'auto',
        overflowX: 'hidden',
        paddingRight: '1rem',
      }}
    >
      <svg
        width='100%'
        height={calculatedDimensions.height}
        viewBox={`0 0 ${calculatedDimensions.width} ${calculatedDimensions.height}`}
        preserveAspectRatio='xMidYMin meet'
        fontSize={dimensions.global.fontSize}
        fontWeight='bold'
        textAnchor='middle'
        className='catalog-railway'
        style={{
          '--node-fill': 'var(--gray-9)',
          '--node-stroke': 'var(--gray-11)',
          '--node-stroke-width': '1px',
        } as React.CSSProperties}
      >
        {/* Render branch point connectors first (behind tracks) */}
        {catalog.entries.map((schema, index) => (
          <BranchPointConnector
            key={`branch-${index}`}
            schema={schema}
            dimensions={dimensions}
            catalog={catalog}
            layoutMode={layoutMode}
          />
        ))}

        {/* Render version tracks */}
        {catalog.entries.map((schema, index) => (
          <VersionTrack
            key={schema.version.value}
            schema={schema}
            index={index}
            dimensions={dimensions}
            catalog={catalog}
            currentAddress={currentAddress}
            onRevisionClick={onRevisionClick}
            onVersionClick={onVersionClick}
            showVersionLabel={catalog.entries.length > 1}
            layoutMode={layoutMode}
          />
        ))}
      </svg>
    </Box>
  )
}
