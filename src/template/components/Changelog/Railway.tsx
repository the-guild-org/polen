import { Catalog } from '#lib/catalog/$'
import { Box } from '@radix-ui/themes'
import React from 'react'

interface RailwayProps {
  entries: Array<{
    schema: any
    parent: any | null
    revisions: any[]
  }>
  currentPosition?: { version: string; revision: string } | undefined
  onNodeClick?: ((version: string, revision: string) => void) | undefined
}

export const Railway: React.FC<RailwayProps> = ({
  entries,
  currentPosition,
  onNodeClick,
}) => {
  // Calculate layout dimensions
  const trackWidth = 80
  const nodeRadius = 4
  const nodeSpacing = 45
  const branchCurveRadius = 15

  // Calculate total height based on revisions
  const totalHeight = Math.max(
    ...entries.map(entry => entry.revisions.length * nodeSpacing + 100),
  )

  // Get version from schema
  const getVersion = (entry: any) => {
    // Check if entry has a schema with a version
    if (entry?.schema?.version) {
      const version = entry.schema.version
      // Version might be an object with value property (from Effect Schema)
      return typeof version === 'object' && version.value
        ? version.value
        : version
    }
    // For unversioned schemas
    return 'main'
  }

  // Build parent map for branch connections with revision info
  const parentMap = new Map<string, { version: string; revision?: string }>()
  entries.forEach(entry => {
    const version = getVersion(entry)
    if (entry.parent) {
      const parentVer = entry.parent.version
      const parentVersion = typeof parentVer === 'object' && parentVer.value
        ? parentVer.value
        : parentVer || 'main'
      const branchRevision = entry.parent.revisions && entry.parent.revisions.length > 0
        ? entry.parent.revisions[0].date
        : undefined
      parentMap.set(version, { version: parentVersion, revision: branchRevision })
    }
  })

  // Position entries from left to right (newest to oldest)
  const entryPositions = entries.map((entry, index) => ({
    entry,
    x: 20 + index * trackWidth,
    version: getVersion(entry),
  }))

  return (
    <Box
      style={{
        position: 'sticky',
        top: '2rem',
        width: '280px',
        height: 'calc(100vh - 4rem)',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '1rem',
      }}
    >
      <svg
        width='100%'
        height={totalHeight}
        viewBox={`0 0 ${20 + entries.length * trackWidth} ${totalHeight}`}
        style={{ minHeight: '100%' }}
        preserveAspectRatio='xMidYMid meet'
      >
        {/* Define gradient for fading track ends */}
        <defs>
          <linearGradient id='trackFade' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='var(--gray-8)' stopOpacity='1' />
            <stop offset='95%' stopColor='var(--gray-8)' stopOpacity='1' />
            <stop offset='100%' stopColor='var(--gray-8)' stopOpacity='0.3' />
          </linearGradient>
        </defs>
        {/* Draw tracks and connections */}
        {entryPositions.map(({ entry, x, version }, index) => {
          const revisionCount = entry.revisions.length
          const hasInitialNode = !entry.parent
          const totalNodes = revisionCount + (hasInitialNode ? 1 : 0)

          // Track always runs from top to bottom of all nodes
          const trackStartY = 20
          const trackEndY = 20 + (totalNodes - 1) * nodeSpacing

          return (
            <g key={version}>
              {/* Main track line */}
              <line
                x1={x}
                y1={trackStartY}
                x2={x}
                y2={trackEndY}
                stroke='var(--gray-8)'
                strokeWidth='2'
              />

              {/* Branch connection from parent - draws a curve from parent node to start of this track */}
              {(() => {
                const parentInfo = parentMap.get(version)
                if (!parentInfo) return null

                // Find parent entry and its position
                const parentEntryIndex = entryPositions.findIndex(ep => getVersion(ep.entry) === parentInfo.version)
                if (parentEntryIndex === -1) return null

                const parentEntry = entryPositions[parentEntryIndex]!
                const parentX = parentEntry.x

                // Find the Y position of the branch point on parent track
                let branchY: number
                const parentHasInitialNode = !parentEntry.entry.parent

                if (parentInfo.revision && parentEntry.entry.revisions) {
                  // Branch from a specific revision
                  // Since revisions are displayed oldest to newest (reversed), we need to find the reversed index
                  const revisionIndex = parentEntry.entry.revisions.findIndex(
                    r => r.date === parentInfo.revision,
                  )
                  if (revisionIndex >= 0) {
                    // Reverse the index since we're displaying oldest to newest
                    const displayIndex = parentEntry.entry.revisions.length - 1 - revisionIndex
                    branchY = 20 + displayIndex * nodeSpacing
                  } else {
                    // Fallback to initial if revision not found
                    branchY = 20 + parentEntry.entry.revisions.length * nodeSpacing
                  }
                } else if (parentHasInitialNode) {
                  // Branch from initial node (at the bottom)
                  branchY = 20 + parentEntry.entry.revisions.length * nodeSpacing
                } else {
                  // No initial node, branch from top
                  branchY = 20
                }

                // Find where to connect on the child track
                // We need to find the oldest revision of the child
                const childOldestRevisionY = 20 + (entry.revisions.length - 1) * nodeSpacing

                // Draw horizontal line from parent node to child's oldest revision
                return (
                  <line
                    x1={parentX}
                    y1={branchY}
                    x2={x}
                    y2={childOldestRevisionY}
                    stroke='var(--gray-8)'
                    strokeWidth='2'
                  />
                )
              })()}

              {/* Version label - positioned above the track, not connected */}
              <text
                x={x}
                y={10}
                textAnchor='middle'
                fontSize='11'
                fill='var(--gray-11)'
                fontWeight='bold'
              >
                v{version}
              </text>

              {/* Initial node for root versions (no parent) - at the bottom */}
              {!entry.parent && (() => {
                const initialY = 20 + entry.revisions.length * nodeSpacing
                return (
                  <g key={`${version}-initial`}>
                    <circle
                      cx={x}
                      cy={initialY}
                      r={nodeRadius}
                      fill='var(--gray-7)'
                      stroke='var(--gray-9)'
                      strokeWidth='1'
                      strokeDasharray='2 1'
                    />
                    <text
                      x={x}
                      y={initialY + 15}
                      fontSize='8'
                      fill='var(--gray-9)'
                      textAnchor='middle'
                      fontStyle='italic'
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      initial
                    </text>

                    {/* Branch indicator for initial node */}
                    {(() => {
                      // Check if any version branches from this version's initial state
                      const branchesFromInitial = Array.from(parentMap.entries()).filter(
                        ([childVersion, parentInfo]) =>
                          parentInfo.version === version
                          && !parentInfo.revision,
                      )
                      if (branchesFromInitial.length === 0) return null

                      return (
                        <circle
                          cx={x}
                          cy={initialY}
                          r={nodeRadius + 2}
                          fill='none'
                          stroke='var(--gray-10)'
                          strokeWidth='2'
                        />
                      )
                    })()}
                  </g>
                )
              })()}

              {/* Revision nodes - displayed from oldest (bottom) to newest (top) */}
              {[...entry.revisions].reverse().map((revision, revIndex) => {
                // Position from top, chronologically oldest to newest
                const y = 20 + revIndex * nodeSpacing
                const isCurrentPosition = currentPosition?.version === version
                  && currentPosition?.revision === revision.date

                return (
                  <g key={`${version}-${revision.date}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={nodeRadius}
                      fill={isCurrentPosition ? 'var(--accent-9)' : 'var(--gray-9)'}
                      stroke={isCurrentPosition ? 'var(--accent-11)' : 'var(--gray-11)'}
                      strokeWidth={isCurrentPosition ? '2' : '1'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onNodeClick?.(version, revision.date)}
                    />

                    {/* Revision date label */}
                    <text
                      x={x}
                      y={y + 15}
                      fontSize='8'
                      fill='var(--gray-10)'
                      textAnchor='middle'
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {revision.date}
                    </text>

                    {/* Current position indicator */}
                    {isCurrentPosition && (
                      <>
                        <text
                          x={x - 15}
                          y={y + 3}
                          fontSize='10'
                          fill='var(--accent-11)'
                          textAnchor='end'
                        >
                          ▶
                        </text>
                        <circle
                          cx={x}
                          cy={y}
                          r={nodeRadius + 4}
                          fill='none'
                          stroke='var(--accent-9)'
                          strokeWidth='1'
                          opacity='0.5'
                        >
                          <animate
                            attributeName='r'
                            from={nodeRadius + 4}
                            to={nodeRadius + 8}
                            dur='2s'
                            repeatCount='indefinite'
                          />
                          <animate
                            attributeName='opacity'
                            from='0.5'
                            to='0'
                            dur='2s'
                            repeatCount='indefinite'
                          />
                        </circle>
                      </>
                    )}

                    {/* Branch point indicator - just a ring around the node */}
                    {(() => {
                      // Check if any version branches from this revision
                      const branchesFromHere = Array.from(parentMap.entries()).filter(
                        ([childVersion, parentInfo]) =>
                          parentInfo.version === version
                          && parentInfo.revision === revision.date,
                      )
                      if (branchesFromHere.length === 0) return null

                      return (
                        <circle
                          cx={x}
                          cy={y}
                          r={nodeRadius + 2}
                          fill='none'
                          stroke='var(--gray-10)'
                          strokeWidth='2'
                        />
                      )
                    })()}

                    {/* Revision ID on hover */}
                    <title>{`${version} - ${revision.date}`}</title>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </Box>
  )
}
