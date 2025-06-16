import React, { useState } from 'react'

// Unified shape with both line and track capabilities
const unifiedShape = (size: number, strokeWidth: number, params: any = {}) => {
  const {
    // Display toggles
    showLine = true,
    showTrack = false,

    // Line parameters
    lineAngle = 0,
    linePattern = 'straight', // straight, zigzag, wave
    useLineTilt = false,
    lineTilt = 0, // Individual line rotation tilt
    lineValleyDepth = 1,

    // Track parameters
    trackType = 'circle', // circle, triangle, square, rectangle, pentagon, hexagon
    trackPattern = 'straight', // straight, zigzag, wave
    trackValleyDepth = 1,

    // Shared parameters
    lineLength = 1,
    trackLength = 1,
    lineCount = 1,
    trackCount = 1,
    count = 1, // backward compatibility
    rotation = 0, // backward compatibility
    useLineRotation = false,
    lineRotation = 0,
    useTrackRotation = false,
    trackRotation = 0,
    gap = 0.15, // backward compatibility
    lineGap = 0.15,
    trackGap = 0.15,
    valleyDepth = 1,
    lineDashed = false,
    lineDashLength = 3,
    lineDashGap = 2,
    lineDashCaps = true,
    trackDashed = false,
    trackDashLength = 3,
    trackDashGap = 2,
    trackDashCaps = true,
    roundedCaps = true,
    showDot = false,
    dotSize = 1,

    // Scale and stroke
    useLocalStroke = false, // backward compatibility
    localStrokeWidth = 2, // backward compatibility
    useLineStroke = false,
    lineStrokeWidth = 2,
    useTrackStroke = false,
    trackStrokeWidth = 2,
    useLocalScale = false,
    localScale = 1,

    // Individual line parameters
    line1Length = 1,
    line1Offset = 0,
    line1UseBase = true,
    line1Dashed = false,
    line2Length = 1,
    line2Offset = 0,
    line2UseBase = true,
    line2Dashed = false,
    line3Length = 1,
    line3Offset = 0,
    line3UseBase = true,
    line3Dashed = false,
    line4Length = 1,
    line4Offset = 0,
    line4UseBase = true,
    line4Dashed = false,
    line5Length = 1,
    line5Offset = 0,
    line5UseBase = true,
    line5Dashed = false,
    line6Length = 1,
    line6Offset = 0,
    line6UseBase = true,
    line6Dashed = false,
    line7Length = 1,
    line7Offset = 0,
    line7UseBase = true,
    line7Dashed = false,
    line8Length = 1,
    line8Offset = 0,
    line8UseBase = true,
    line8Dashed = false,
  } = params

  const center = size / 2
  const maxLength = size * 0.6
  const baseRadius = size * 0.2
  const peaks = 3

  const elements = []
  const dots = []

  const lineConfigs = [
    { length: line1UseBase ? 1 : line1Length, offset: line1Offset, dashed: lineDashed || line1Dashed },
    { length: line2UseBase ? 1 : line2Length, offset: line2Offset, dashed: lineDashed || line2Dashed },
    { length: line3UseBase ? 1 : line3Length, offset: line3Offset, dashed: lineDashed || line3Dashed },
    { length: line4UseBase ? 1 : line4Length, offset: line4Offset, dashed: lineDashed || line4Dashed },
    { length: line5UseBase ? 1 : line5Length, offset: line5Offset, dashed: lineDashed || line5Dashed },
    { length: line6UseBase ? 1 : line6Length, offset: line6Offset, dashed: lineDashed || line6Dashed },
    { length: line7UseBase ? 1 : line7Length, offset: line7Offset, dashed: lineDashed || line7Dashed },
    { length: line8UseBase ? 1 : line8Length, offset: line8Offset, dashed: lineDashed || line8Dashed },
  ]

  // Helper function to get polygon vertices
  const getPolygonVertices = (sides: number, radius: number, cx: number, cy: number, isRectangle = false) => {
    const vertices = []
    const angleOffset = sides === 4 && !isRectangle ? Math.PI / 4 : -Math.PI / 2

    if (isRectangle && sides === 4) {
      const width = radius * 2
      const height = width * 0.618
      vertices.push(
        { x: cx - width / 2, y: cy - height / 2 },
        { x: cx + width / 2, y: cy - height / 2 },
        { x: cx + width / 2, y: cy + height / 2 },
        { x: cx - width / 2, y: cy + height / 2 },
      )
    } else {
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) + angleOffset
        vertices.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        })
      }
    }
    return vertices
  }

  // Helper function to apply pattern to a path segment
  const applyPatternToSegment = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    pattern: string,
    amplitude: number,
  ) => {
    if (pattern === 'straight') {
      return `L ${x2} ${y2}`
    }

    const segmentLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const perpAngle = angle + Math.PI / 2

    const waveCount = Math.max(1, Math.floor(segmentLength / (size * 0.05)))
    const waveLength = segmentLength / waveCount

    let pathSegment = ''

    for (let w = 0; w < waveCount; w++) {
      const t1 = w / waveCount
      const t2 = (w + 0.5) / waveCount
      const t3 = (w + 1) / waveCount

      const wx1 = x1 + (x2 - x1) * t1
      const wy1 = y1 + (y2 - y1) * t1
      const wx2 = x1 + (x2 - x1) * t2
      const wy2 = y1 + (y2 - y1) * t2
      const wx3 = x1 + (x2 - x1) * t3
      const wy3 = y1 + (y2 - y1) * t3

      const offset = w % 2 === 0 ? amplitude : -amplitude
      const peakX = wx2 + Math.cos(perpAngle) * offset
      const peakY = wy2 + Math.sin(perpAngle) * offset

      if (pattern === 'wave') {
        pathSegment += ` Q ${peakX} ${peakY} ${wx3} ${wy3}`
      } else {
        pathSegment += ` L ${peakX} ${peakY} L ${wx3} ${wy3}`
      }
    }

    return pathSegment
  }

  // Generate elements for each line/track (use the larger count to ensure all elements are rendered)
  const maxCount = Math.max(showLine ? lineCount : 0, showTrack ? trackCount : 0)
  for (let i = 0; i < maxCount; i++) {
    const config = lineConfigs[i] || { length: 1, offset: 0, dashed: false }

    // Use scoped stroke widths with backward compatibility
    const effectiveLineStrokeWidth = useLineStroke
      ? lineStrokeWidth * size / 32
      : (useLocalStroke ? localStrokeWidth * size / 32 : strokeWidth)
    const effectiveTrackStrokeWidth = useTrackStroke
      ? trackStrokeWidth * size / 32
      : (useLocalStroke ? localStrokeWidth * size / 32 : strokeWidth)

    // Create dash arrays with smooth transition from dots to dashes
    // When dash length = 1, create dots by making dash length equal to stroke width
    // As dash length increases, transition smoothly to longer dashes
    const lineBaseDash = effectiveLineStrokeWidth
    const lineDashValue = lineBaseDash + (lineBaseDash * (lineDashLength - 1))
    const lineDashGapValue = lineBaseDash + (lineBaseDash * (lineDashGap - 1))
    const lineDashArray = config.dashed ? `${lineDashValue} ${lineDashGapValue}` : ''

    const trackBaseDash = effectiveTrackStrokeWidth
    const trackDashValue = trackBaseDash + (trackBaseDash * (trackDashLength - 1))
    const trackDashGapValue = trackBaseDash + (trackBaseDash * (trackDashGap - 1))
    const trackDashArray = trackDashed ? `${trackDashValue} ${trackDashGapValue}` : ''

    // Draw line if enabled and within line count
    if (showLine && i < lineCount) {
      // Calculate gap and centering for lines only
      const hairlineGap = size / 16
      const baseGapDistance = lineGap === 0 ? hairlineGap : Math.max(hairlineGap, size * lineGap)
      // Add stroke width to gap to ensure gap is between outer edges, not centers
      const lineGapDistance = baseGapDistance + effectiveLineStrokeWidth
      const lineElementOffset = (i - (lineCount - 1) / 2) * lineGapDistance

      const perpAngle = (lineAngle + lineRotation) * Math.PI / 180 + Math.PI / 2
      const offsetX = lineElementOffset * Math.cos(perpAngle)
      const offsetY = lineElementOffset * Math.sin(perpAngle)

      const centerX = center + offsetX
      const centerY = center + offsetY

      const fullTrackLength = maxLength
      const visibleLength = fullTrackLength * lineLength * config.length

      if (linePattern === 'straight') {
        const halfLength = visibleLength / 2
        const lineRad = (lineAngle + rotation) * Math.PI / 180

        const trackOffsetX = config.offset * maxLength * 0.25 * Math.cos(lineRad)
        const trackOffsetY = config.offset * maxLength * 0.25 * Math.sin(lineRad)

        const x1 = centerX - halfLength * Math.cos(lineRad) + trackOffsetX
        const y1 = centerY - halfLength * Math.sin(lineRad) + trackOffsetY
        const x2 = centerX + halfLength * Math.cos(lineRad) + trackOffsetX
        const y2 = centerY + halfLength * Math.sin(lineRad) + trackOffsetY

        // Apply individual line tilt rotation if enabled
        const individualRotation = useLineTilt ? lineTilt * (i - (lineCount - 1) / 2) : 0
        const effectiveLineRotation = useLineRotation ? lineRotation : 0
        const transform = `rotate(${individualRotation + effectiveLineRotation} ${centerX} ${centerY})`
        const lineCap = config.dashed && lineDashCaps ? 'stroke-linecap="round"' : 'stroke-linecap="butt"'
        elements.push(
          `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" transform="${transform}" ${
            lineDashArray ? `stroke-dasharray="${lineDashArray}"` : ''
          } ${lineCap} />`,
        )
      } else {
        // Zigzag or wave pattern
        const valleyCount = Math.round(lineLength * 4) // 1 to 4 valleys based on length
        const segmentWidth = fullTrackLength / valleyCount
        const startX = centerX - fullTrackLength / 2 + (config.offset * 0.5 * segmentWidth * 2)
        let path = ''

        if (linePattern === 'wave') {
          path = `M ${startX} ${centerY}`
          let currentX = startX
          let peakCount = 0

          while (currentX - startX < visibleLength && peakCount < valleyCount * 2) {
            const segmentPos = (currentX - (centerX - fullTrackLength / 2)) / segmentWidth
            const isValley = Math.floor(segmentPos) % 2 === 1

            const peakX = currentX + segmentWidth / 2
            const endX = currentX + segmentWidth

            if (peakX > startX + visibleLength) break

            const linePeakHeight = size * 0.08 * lineValleyDepth
            const peakY = centerY + (isValley ? linePeakHeight : -linePeakHeight)
            const finalX = Math.min(endX, startX + visibleLength)

            path += ` Q ${peakX} ${peakY} ${finalX} ${centerY}`
            currentX = finalX
            peakCount++
          }
        } else {
          path = `M ${startX} ${centerY}`
          let currentX = startX

          for (let j = 0; j <= valleyCount * 2 && currentX - startX < visibleLength; j++) {
            const nextX = startX + (j + 1) * segmentWidth / 2
            if (nextX > startX + visibleLength) {
              path += ` L ${startX + visibleLength} ${centerY}`
              break
            }

            const linePeakHeight = size * 0.08 * lineValleyDepth
            const y = j % 2 === 0
              ? centerY
              : (Math.floor(j / 2) % 2 === 0 ? centerY - linePeakHeight : centerY + linePeakHeight)
            path += ` L ${nextX} ${y}`
            currentX = nextX
          }
        }

        // Apply individual line tilt rotation if enabled
        const individualRotation = useLineTilt ? lineTilt * (i - (lineCount - 1) / 2) : 0
        const effectiveLineRotation = useLineRotation ? lineRotation : 0
        const transform = `rotate(${lineAngle + effectiveLineRotation + individualRotation} ${centerX} ${centerY})`
        const lineCap = config.dashed && lineDashCaps ? 'stroke-linecap="round"' : 'stroke-linecap="butt"'
        elements.push(
          `<path d="${path}" transform="${transform}" ${
            lineDashArray ? `stroke-dasharray="${lineDashArray}"` : ''
          } ${lineCap} />`,
        )
      }
    }

    // Draw track if enabled and within track count
    if (showTrack && i < trackCount) {
      // Calculate gap and centering for tracks only
      const hairlineGap = size / 16
      const baseGapDistance = trackGap === 0 ? hairlineGap : Math.max(hairlineGap, size * trackGap)
      // Add stroke width to gap to ensure gap is between outer edges, not centers
      const trackGapDistance = baseGapDistance + effectiveTrackStrokeWidth
      const trackElementOffset = (i - (trackCount - 1) / 2) * trackGapDistance
      const radius = baseRadius + trackElementOffset

      const trackOffsetAngle = config.offset * 180
      const patternAmplitude = size * 0.02 * trackValleyDepth

      const effectiveTrackRotation = useTrackRotation ? trackRotation : 0
      const transform = `rotate(${effectiveTrackRotation} ${center} ${center})`

      if (trackType === 'circle') {
        const arcAngle = 360 * trackLength

        if (trackPattern !== 'straight') {
          // Patterned circle
          let path = ''
          const totalAngle = arcAngle >= 360 ? 360 : arcAngle
          const segmentAngle = 10
          const segments = Math.ceil(totalAngle / segmentAngle)

          const startAngle = (-totalAngle / 2 - 90 + trackOffsetAngle) * Math.PI / 180
          let prevX = center + radius * Math.cos(startAngle)
          let prevY = center + radius * Math.sin(startAngle)
          path = `M ${prevX} ${prevY}`

          const waveCount = Math.max(8, Math.floor(totalAngle / 45))

          for (let j = 1; j <= segments; j++) {
            const angle = (j * totalAngle / segments - totalAngle / 2 - 90 + trackOffsetAngle) * Math.PI / 180

            let r = radius
            if (trackPattern !== 'straight') {
              const wavePhase = j * waveCount * 2 * Math.PI / segments
              const waveOffset = patternAmplitude
              r = radius + waveOffset * Math.sin(wavePhase)
            }

            const px = center + r * Math.cos(angle)
            const py = center + r * Math.sin(angle)

            if (trackPattern === 'wave') {
              const midAngle = ((j - 0.5) * totalAngle / segments - totalAngle / 2 - 90 + trackOffsetAngle) * Math.PI
                / 180
              const midR = radius + patternAmplitude * Math.sin((j - 0.5) * waveCount * 2 * Math.PI / segments)
              const midX = center + midR * Math.cos(midAngle)
              const midY = center + midR * Math.sin(midAngle)
              path += ` Q ${midX} ${midY} ${px} ${py}`
            } else {
              path += ` L ${px} ${py}`
            }
          }

          if (arcAngle >= 360) path += ' Z'
          const trackCap = trackDashed && trackDashCaps ? 'stroke-linecap="round"' : 'stroke-linecap="butt"'
          elements.push(
            `<path d="${path}" transform="${transform}" ${
              trackDashArray ? `stroke-dasharray="${trackDashArray}"` : ''
            } ${trackCap} />`,
          )
        } else {
          // Regular circle
          if (arcAngle >= 360) {
            const trackCap = trackDashed && trackDashCaps ? 'stroke-linecap="round"' : 'stroke-linecap="butt"'
            elements.push(
              `<circle cx="${center}" cy="${center}" r="${radius}" transform="${transform}" ${
                trackDashArray ? `stroke-dasharray="${trackDashArray}"` : ''
              } ${trackCap} />`,
            )
          } else {
            const startAngle = -arcAngle / 2 - 90 + trackOffsetAngle
            const endAngle = arcAngle / 2 - 90 + trackOffsetAngle
            const startRad = startAngle * Math.PI / 180
            const endRad = endAngle * Math.PI / 180

            const x1 = center + radius * Math.cos(startRad)
            const y1 = center + radius * Math.sin(startRad)
            const x2 = center + radius * Math.cos(endRad)
            const y2 = center + radius * Math.sin(endRad)

            const largeArcFlag = arcAngle > 180 ? 1 : 0
            const trackCap = trackDashed && trackDashCaps ? 'stroke-linecap="round"' : 'stroke-linecap="butt"'
            elements.push(
              `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}" transform="${transform}" ${
                trackDashArray ? `stroke-dasharray="${trackDashArray}"` : ''
              } ${trackCap} />`,
            )
          }
        }
      } else {
        // Polygon tracks
        const sides = trackType === 'triangle'
          ? 3
          : trackType === 'square'
          ? 4
          : trackType === 'rectangle'
          ? 4
          : trackType === 'pentagon'
          ? 5
          : 6
        const vertices = getPolygonVertices(sides, radius, center, center, trackType === 'rectangle')

        if (trackLength >= 1) {
          // Full polygon
          if (trackPattern === 'straight') {
            const points = vertices.map(v => `${v.x},${v.y}`).join(' ')
            const trackCap = trackDashed && trackDashCaps ? 'stroke-linecap="round"' : 'stroke-linecap="butt"'
            elements.push(
              `<polygon points="${points}" transform="${transform}" ${
                trackDashArray ? `stroke-dasharray="${trackDashArray}"` : ''
              } ${trackCap} />`,
            )
          } else {
            // Patterned polygon
            let path = `M ${vertices[0].x} ${vertices[0].y}`

            for (let v = 0; v < vertices.length; v++) {
              const nextV = (v + 1) % vertices.length
              const x1 = vertices[v].x
              const y1 = vertices[v].y
              const x2 = vertices[nextV].x
              const y2 = vertices[nextV].y

              path += applyPatternToSegment(x1, y1, x2, y2, trackPattern, patternAmplitude)
            }

            path += ' Z'
            const trackCap = trackDashed && trackDashCaps ? 'stroke-linecap="round"' : 'stroke-linecap="butt"'
            elements.push(
              `<path d="${path}" transform="${transform}" ${
                trackDashArray ? `stroke-dasharray="${trackDashArray}"` : ''
              } ${trackCap} />`,
            )
          }
        } else {
          // Partial polygon (draw as path)
          const totalSides = vertices.length
          const sidesToDraw = trackLength * totalSides
          const fullSides = Math.floor(sidesToDraw)
          const partialSide = sidesToDraw - fullSides

          let path = `M ${vertices[0].x} ${vertices[0].y}`

          // Draw full sides
          for (let v = 0; v < fullSides; v++) {
            const nextV = (v + 1) % vertices.length
            const x1 = vertices[v].x
            const y1 = vertices[v].y
            const x2 = vertices[nextV].x
            const y2 = vertices[nextV].y

            if (trackPattern === 'straight') {
              path += ` L ${x2} ${y2}`
            } else {
              path += applyPatternToSegment(x1, y1, x2, y2, trackPattern, patternAmplitude)
            }
          }

          // Draw partial side if needed
          if (partialSide > 0 && fullSides < vertices.length) {
            const v = fullSides
            const nextV = (v + 1) % vertices.length
            const x1 = vertices[v].x
            const y1 = vertices[v].y
            const x2 = vertices[nextV].x
            const y2 = vertices[nextV].y

            const partialX = x1 + (x2 - x1) * partialSide
            const partialY = y1 + (y2 - y1) * partialSide

            if (trackPattern === 'straight') {
              path += ` L ${partialX} ${partialY}`
            } else {
              // For patterned, we need to scale the pattern segment
              const scaledPattern = applyPatternToSegment(x1, y1, partialX, partialY, trackPattern, patternAmplitude)
              path += scaledPattern
            }
          }

          elements.push(
            `<path d="${path}" transform="${transform}" ${
              trackDashArray ? `stroke-dasharray="${trackDashArray}"` : ''
            } />`,
          )
        }
      }
    }

    // Add dot if enabled (only on center element)
    if (showDot && i === Math.floor((maxCount - 1) / 2)) {
      // Use the appropriate gap for dot positioning based on what's being shown
      const hairlineGap = size / 16
      const lineBaseGap = lineGap === 0 ? hairlineGap : Math.max(hairlineGap, size * lineGap)
      const trackBaseGap = trackGap === 0 ? hairlineGap : Math.max(hairlineGap, size * trackGap)

      // Calculate gap with stroke width included
      const lineGapWithStroke = lineBaseGap + strokeWidth
      const trackGapWithStroke = trackBaseGap + strokeWidth

      const dotGapDistance = showLine && showTrack
        ? Math.max(lineGapWithStroke, trackGapWithStroke)
        : showLine
        ? lineGapWithStroke
        : trackGapWithStroke

      const innermostLineIndex = Math.floor((maxCount - 1) / 2) - Math.floor(maxCount / 2)
      const innermostRadius = baseRadius + innermostLineIndex * dotGapDistance
      const maxDotRadius = Math.max(0, innermostRadius - strokeWidth * 2)
      const baseDotRadius = size * 0.05
      const dotRadius = Math.min(baseDotRadius * dotSize, maxDotRadius)

      const effectiveLineRot = useLineRotation ? lineRotation : 0
      const effectiveTrackRot = useTrackRotation ? trackRotation : 0
      const dotRotation = showLine && showTrack
        ? (effectiveLineRot + effectiveTrackRot) / 2
        : showLine
        ? effectiveLineRot
        : effectiveTrackRot
      const transform = `rotate(${dotRotation} ${center} ${center})`

      const dotShape = (!showTrack || trackType === 'circle')
        ? `<circle cx="${center}" cy="${center}" r="${dotRadius}" fill="#000" transform="${transform}" />`
        : (() => {
          const sides = trackType === 'triangle'
            ? 3
            : trackType === 'square'
            ? 4
            : trackType === 'rectangle'
            ? 4
            : trackType === 'pentagon'
            ? 5
            : 6
          const dotVerts = getPolygonVertices(sides, dotRadius, center, center, trackType === 'rectangle')
          const points = dotVerts.map(v => `${v.x},${v.y}`).join(' ')
          return `<polygon points="${points}" fill="#000" transform="${transform}" />`
        })()
      dots.push(dotShape)
    }
  }

  return `<g>${elements.join('')}${dots.join('')}</g>`
}

const shapes = {
  'unified': unifiedShape,
}

// Control definitions
const baseControls = [
  { name: 'Local Scale', param: 'localScale', min: 0.5, max: 1.5, step: 0.05, toggle: 'useLocalScale' },
]

const controls = {
  'unified': [
    ...baseControls,

    // Line section
    { name: 'Show', param: 'showLine', type: 'checkbox', section: 'Line' },
    {
      name: 'Stroke Width',
      param: 'lineStrokeWidth',
      min: 0.5,
      max: 10,
      step: 0.1,
      toggle: 'useLineStroke',
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Angle',
      param: 'lineAngle',
      min: -90,
      max: 90,
      step: 15,
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Pattern',
      param: 'linePattern',
      type: 'select',
      options: ['straight', 'zigzag', 'wave'],
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Length',
      param: 'lineLength',
      min: 0.1,
      max: 1,
      step: 0.05,
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Count',
      param: 'lineCount',
      min: 0,
      max: 8,
      step: 1,
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Rotation',
      param: 'lineRotation',
      min: -180,
      max: 180,
      step: 15,
      toggle: 'useLineRotation',
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Tilt',
      param: 'lineTilt',
      min: -45,
      max: 45,
      step: 5,
      toggle: 'useLineTilt',
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Gap',
      param: 'lineGap',
      min: 0,
      max: 0.3,
      step: 0.01,
      showWhen: (params: any) => params.showLine,
      disabled: (params: any) => params.lineCount === 0,
      tooltip: (params: any) => params.lineCount === 0 ? 'Gap is disabled when count is 0' : '',
      section: 'Line',
    },
    {
      name: 'Valley Depth',
      param: 'lineValleyDepth',
      min: 0,
      max: 2,
      step: 0.1,
      showWhen: (params: any) => params.showLine && params.linePattern !== 'straight',
      section: 'Line',
    },
    {
      name: 'Dashed',
      param: 'lineDashed',
      type: 'checkbox',
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Dash Length',
      param: 'lineDashLength',
      min: 1,
      max: 10,
      step: 0.5,
      dependsOn: 'lineDashed',
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Dash Gap',
      param: 'lineDashGap',
      min: 1,
      max: 10,
      step: 0.5,
      dependsOn: 'lineDashed',
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },
    {
      name: 'Dash Caps',
      param: 'lineDashCaps',
      type: 'checkbox',
      dependsOn: 'lineDashed',
      showWhen: (params: any) => params.showLine,
      section: 'Line',
    },

    // Shape section
    { name: 'Show', param: 'showTrack', type: 'checkbox', section: 'Shape' },
    {
      name: 'Stroke Width',
      param: 'trackStrokeWidth',
      min: 0.5,
      max: 10,
      step: 0.1,
      toggle: 'useTrackStroke',
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Type',
      param: 'trackType',
      type: 'select',
      options: ['circle', 'triangle', 'square', 'rectangle', 'pentagon', 'hexagon'],
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Pattern',
      param: 'trackPattern',
      type: 'select',
      options: ['straight', 'zigzag', 'wave'],
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Length',
      param: 'trackLength',
      min: 0.1,
      max: 1,
      step: 0.05,
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Count',
      param: 'trackCount',
      min: 0,
      max: 8,
      step: 1,
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Rotation',
      param: 'trackRotation',
      min: -180,
      max: 180,
      step: 15,
      toggle: 'useTrackRotation',
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Gap',
      param: 'trackGap',
      min: 0,
      max: 0.3,
      step: 0.01,
      showWhen: (params: any) => params.showTrack,
      disabled: (params: any) => params.trackCount === 0,
      tooltip: (params: any) => params.trackCount === 0 ? 'Gap is disabled when count is 0' : '',
      section: 'Shape',
    },
    {
      name: 'Valley Depth',
      param: 'trackValleyDepth',
      min: 0,
      max: 2,
      step: 0.1,
      showWhen: (params: any) => params.showTrack && params.trackPattern !== 'straight',
      section: 'Shape',
    },
    {
      name: 'Dashed',
      param: 'trackDashed',
      type: 'checkbox',
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Dash Length',
      param: 'trackDashLength',
      min: 1,
      max: 10,
      step: 0.5,
      dependsOn: 'trackDashed',
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Dash Gap',
      param: 'trackDashGap',
      min: 1,
      max: 10,
      step: 0.5,
      dependsOn: 'trackDashed',
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },
    {
      name: 'Dash Caps',
      param: 'trackDashCaps',
      type: 'checkbox',
      dependsOn: 'trackDashed',
      showWhen: (params: any) => params.showTrack,
      section: 'Shape',
    },

    // Shared controls
    { name: 'Show Dot', param: 'showDot', type: 'checkbox' },
    { name: 'Dot Size', param: 'dotSize', min: 0.5, max: 2, step: 0.1, dependsOn: 'showDot' },
    { name: 'Rounded Caps', param: 'roundedCaps', type: 'checkbox' },
  ],
}

// Add individual line controls
const individualLineControls = []
for (let i = 1; i <= 8; i++) {
  individualLineControls.push(
    {
      name: `Line ${i} Length`,
      param: `line${i}Length`,
      min: 0.3,
      max: 2,
      step: 0.1,
      toggle: `line${i}UseBase`,
      toggleInverse: true,
      showWhen: (params: any) => params.lineCount >= i,
    },
    {
      name: `Line ${i} Offset`,
      param: `line${i}Offset`,
      min: -2,
      max: 2,
      step: 0.2,
      showWhen: (params: any) => params.lineCount >= i,
    },
    {
      name: `Line ${i} Dashed`,
      param: `line${i}Dashed`,
      type: 'checkbox',
      showWhen: (params: any) => params.lineCount >= i,
    },
  )
}

controls['unified'].push(...individualLineControls)

interface ShapeRowProps {
  shapeName: string
  baseStrokeWidth: number
  baseScale: number
}

function ShapeRow({ shapeName, baseStrokeWidth, baseScale }: ShapeRowProps) {
  const shapeControls = controls[shapeName as keyof typeof controls] || []

  // Calculate maximum dot size based on current parameters
  const calculateMaxDotSize = (params: any, size: number = 32) => {
    const maxCount = Math.max(params.lineCount || 0, params.trackCount || 0)
    if (maxCount === 0) return 2

    const baseRadius = size * 0.2
    const strokeWidth = params.useLocalStroke
      ? params.localStrokeWidth * size / 32
      : Math.max(1, size / 32) * baseStrokeWidth / 2
    const hairlineGap = size / 16

    // Use the larger gap for dot size calculation (including stroke width)
    const lineBaseGap = params.lineGap === 0 ? hairlineGap : Math.max(hairlineGap, size * params.lineGap)
    const trackBaseGap = params.trackGap === 0 ? hairlineGap : Math.max(hairlineGap, size * params.trackGap)
    const lineGapDistance = lineBaseGap + strokeWidth
    const trackGapDistance = trackBaseGap + strokeWidth
    const gapDistance = Math.max(lineGapDistance, trackGapDistance)

    const innermostLineIndex = Math.floor((maxCount - 1) / 2) - Math.floor(maxCount / 2)
    const innermostRadius = baseRadius + innermostLineIndex * gapDistance

    const maxDotRadius = Math.max(0, innermostRadius - strokeWidth * 2)
    const baseDotRadius = size * 0.05

    return Math.max(0.1, maxDotRadius / baseDotRadius)
  }

  // Calculate maximum stroke width based on gap (stroke should not consume gap space)
  const calculateMaxStrokeWidth = (params: any, size: number = 32) => {
    return 10 // Fixed limit - stroke width should not be constrained by gap
  }

  // Initialize default params
  const getDefaultParams = () => {
    const defaults: any = {
      // Display toggles
      showLine: true,
      showTrack: false,

      // Line parameters
      lineAngle: 0,
      linePattern: 'straight',
      useLineTilt: false,
      lineTilt: 0,
      lineValleyDepth: 1,

      // Track parameters
      trackType: 'circle',
      trackPattern: 'straight',
      trackValleyDepth: 1,

      // Shared parameters
      useLocalStroke: false,
      localStrokeWidth: 2,
      useLineStroke: false,
      lineStrokeWidth: 2,
      useTrackStroke: false,
      trackStrokeWidth: 2,
      useLocalScale: false,
      localScale: 1,
      lineLength: 1,
      trackLength: 1,
      lineCount: 1,
      trackCount: 1,
      count: 1, // backward compatibility
      rotation: 0, // backward compatibility
      useLineRotation: false,
      lineRotation: 0,
      useTrackRotation: false,
      trackRotation: 0,
      gap: 0.15, // backward compatibility
      lineGap: 0.15,
      trackGap: 0.15,
      valleyDepth: 1,
      dotSize: 1,
      lineDashLength: 3,
      lineDashGap: 2,
      lineDashCaps: true,
      trackDashLength: 3,
      trackDashGap: 2,
      trackDashCaps: true,
      roundedCaps: true,
      lineDashed: false,
      trackDashed: false,
      showDot: false,
      randomOffsetRange: 2,
      randomLengthRange: 1.7,
    }

    // Set individual line defaults
    for (let i = 1; i <= 8; i++) {
      defaults[`line${i}UseBase`] = true
      defaults[`line${i}Length`] = 1
      defaults[`line${i}Offset`] = 0
      defaults[`line${i}Dashed`] = false
    }

    return defaults
  }

  const [params, setParams] = useState(getDefaultParams)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Randomize individual line offsets
  const randomizeOffsets = () => {
    const newParams = { ...params }
    const range = params.randomOffsetRange
    for (let i = 1; i <= params.lineCount; i++) {
      // Generate random offset within the specified range
      newParams[`line${i}Offset`] = Math.round((Math.random() * range * 2 - range) * 10) / 10 // Round to 1 decimal
    }
    setParams(newParams)
  }

  // Randomize individual line lengths
  const randomizeLengths = () => {
    const newParams = { ...params }
    const range = params.randomLengthRange
    for (let i = 1; i <= params.lineCount; i++) {
      // Generate random length within the specified range (0.3 to 0.3 + range)
      newParams[`line${i}Length`] = Math.round((Math.random() * range + 0.3) * 10) / 10 // Round to 1 decimal
      newParams[`line${i}UseBase`] = false // Turn off "use base" so custom length is used
    }
    setParams(newParams)
  }

  const updateParam = (param: string, value: any) => {
    const newParams = { ...params, [param]: value }

    // If changing parameters that affect dot size maximum, clamp dot size
    if (
      param === 'lineCount' || param === 'trackCount' || param === 'gap' || param === 'useLocalStroke'
      || param === 'localStrokeWidth'
    ) {
      const maxDotSize = calculateMaxDotSize(newParams)
      if (newParams.dotSize > maxDotSize) {
        newParams.dotSize = maxDotSize
      }
    }

    // If changing parameters that affect stroke width maximum, clamp stroke width
    if ((param === 'lineCount' || param === 'trackCount' || param === 'gap') && newParams.useLocalStroke) {
      const maxStrokeWidth = calculateMaxStrokeWidth(newParams)
      if (newParams.localStrokeWidth > maxStrokeWidth) {
        newParams.localStrokeWidth = maxStrokeWidth
      }
    }

    setParams(newParams)
  }

  const shapeFunc = shapes[shapeName as keyof typeof shapes]
  if (!shapeFunc) return null

  // Export SVG function
  const exportSVG = () => {
    const exportSize = 128 // Fixed export size
    const scale = params.useLocalScale ? params.localScale : baseScale
    const scaledSize = exportSize * scale
    const baseStroke = Math.max(1, exportSize / 32) * baseStrokeWidth / 2
    const strokeWidth = params.useLocalStroke ? params.localStrokeWidth * exportSize / 32 : baseStroke
    const shapeContent = shapeFunc(scaledSize, strokeWidth, params)

    // Calculate offset to center scaled shape
    const offset = (exportSize - scaledSize) / 2

    const svgContent =
      `<svg width="${exportSize}" height="${exportSize}" viewBox="0 0 ${exportSize} ${exportSize}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${offset}, ${offset})">
    <g fill="none" stroke="#000" stroke-width="${strokeWidth}" stroke-linecap="${
        params.roundedCaps ? 'round' : 'butt'
      }" stroke-linejoin="${params.roundedCaps ? 'round' : 'miter'}">
      ${shapeContent}
    </g>
  </g>
</svg>`

    // Create download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'shape-export.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Separate basic, sectioned, and advanced controls
  const basicControls = shapeControls.filter(c => !c.param.match(/^line\d/) && !c.section)
  const lineControls = shapeControls.filter(c => c.section === 'Line')
  const shapeControls2 = shapeControls.filter(c => c.section === 'Shape')
  const advancedControls = shapeControls.filter(c => c.param.match(/^line\d/))

  const sizes = [16, 32, 64, 128]

  return (
    <div style={{ marginBottom: '3rem', paddingBottom: '3rem', borderBottom: '1px solid #e5e5e5' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Unified Shape Editor</h3>

      <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
        <div style={{ flex: '1', maxWidth: '400px' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Controls</h4>
            {basicControls.map(control => {
              // Check if control should be shown
              if (control.showWhen && !control.showWhen(params)) return null
              if (control.dependsOn && !params[control.dependsOn]) return null

              // Disable gap controls when respective counts <= 1
              const isDisabled = (control.param === 'lineGap' && params.lineCount <= 1)
                || (control.param === 'trackGap' && params.trackCount <= 1)

              // Dynamic max for stroke width
              let dynamicMax = control.max
              if (control.param === 'localStrokeWidth') {
                dynamicMax = calculateMaxStrokeWidth(params)
              } else if (control.param === 'dotSize') {
                dynamicMax = Math.min(control.max, calculateMaxDotSize(params))
              }

              return (
                <div key={control.param} style={{ marginBottom: '0.75rem' }}>
                  {control.type === 'checkbox'
                    ? (
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type='checkbox'
                          checked={params[control.param] || false}
                          onChange={(e) => updateParam(control.param, e.target.checked)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span>{control.name}</span>
                      </label>
                    )
                    : control.type === 'select'
                    ? (
                      <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                          {control.name}
                        </span>
                        <select
                          value={params[control.param] || control.options![0]}
                          onChange={(e) => updateParam(control.param, e.target.value)}
                          style={{ width: '100%', padding: '0.25rem' }}
                        >
                          {control.options!.map((opt: string) => (
                            <option key={opt} value={opt}>{opt.replace(/-/g, ' ')}</option>
                          ))}
                        </select>
                      </label>
                    )
                    : (
                      <div>
                        <span
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.25rem',
                            fontSize: '0.875rem',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {control.toggle && (
                              <input
                                type='checkbox'
                                checked={control.toggleInverse ? !params[control.toggle] : params[control.toggle]}
                                onChange={(e) =>
                                  updateParam(
                                    control.toggle,
                                    control.toggleInverse ? !e.target.checked : e.target.checked,
                                  )}
                                style={{ cursor: 'pointer' }}
                              />
                            )}
                            <span
                              style={{
                                opacity: (isDisabled
                                    || (control.toggle
                                      && (control.toggleInverse ? params[control.toggle] : !params[control.toggle])))
                                  ? 0.5
                                  : 1,
                              }}
                            >
                              {control.name}
                            </span>
                          </span>
                          <span
                            style={{
                              opacity: (isDisabled
                                  || (control.toggle
                                    && (control.toggleInverse ? params[control.toggle] : !params[control.toggle])))
                                ? 0.5
                                : 1,
                            }}
                          >
                            {params[control.param] || control.min}
                          </span>
                        </span>
                        <input
                          type='range'
                          min={control.min}
                          max={dynamicMax}
                          step={control.step}
                          value={params[control.param] || control.min}
                          onChange={(e) => updateParam(control.param, parseFloat(e.target.value))}
                          disabled={isDisabled
                            || (control.toggle
                              && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))}
                          style={{
                            width: '100%',
                            opacity: (isDisabled
                                || (control.toggle
                                  && (control.toggleInverse ? params[control.toggle] : !params[control.toggle])))
                              ? 0.5
                              : 1,
                          }}
                        />
                      </div>
                    )}
                </div>
              )
            })}

            {/* Line Section */}
            {lineControls.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 'bold', color: '#666' }}>Line</h5>
                {lineControls.map(control => {
                  // Check if control should be shown
                  if (control.showWhen && !control.showWhen(params)) return null
                  if (control.dependsOn && !params[control.dependsOn]) return null

                  return (
                    <div key={control.param} style={{ marginBottom: '0.75rem' }}>
                      {control.type === 'checkbox'
                        ? (
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type='checkbox'
                              checked={params[control.param] || false}
                              onChange={(e) => updateParam(control.param, e.target.checked)}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <span>{control.name}</span>
                          </label>
                        )
                        : control.type === 'select'
                        ? (
                          <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                              {control.name}
                            </span>
                            <select
                              value={params[control.param] || control.options![0]}
                              onChange={(e) => updateParam(control.param, e.target.value)}
                              style={{ width: '100%', padding: '0.25rem' }}
                            >
                              {control.options!.map((opt: string) => (
                                <option key={opt} value={opt}>{opt.replace(/-/g, ' ')}</option>
                              ))}
                            </select>
                          </label>
                        )
                        : (
                          <div>
                            <span
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.25rem',
                                fontSize: '0.875rem',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {control.toggle && (
                                  <input
                                    type='checkbox'
                                    checked={control.toggleInverse ? !params[control.toggle] : params[control.toggle]}
                                    onChange={(e) =>
                                      updateParam(
                                        control.toggle,
                                        control.toggleInverse ? !e.target.checked : e.target.checked,
                                      )}
                                    style={{ cursor: 'pointer' }}
                                  />
                                )}
                                <span
                                  style={{
                                    opacity: ((control.toggle
                                        && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                        || (control.disabled && control.disabled(params)))
                                      ? 0.5
                                      : 1,
                                  }}
                                  title={control.tooltip ? control.tooltip(params) : ''}
                                >
                                  {control.name}
                                </span>
                              </span>
                              <span
                                style={{
                                  opacity: ((control.toggle
                                      && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                      || (control.disabled && control.disabled(params)))
                                    ? 0.5
                                    : 1,
                                }}
                              >
                                {params[control.param] || control.min}
                              </span>
                            </span>
                            <input
                              type='range'
                              min={control.min}
                              max={control.max}
                              step={control.step}
                              value={params[control.param] || control.min}
                              onChange={(e) => updateParam(control.param, parseFloat(e.target.value))}
                              disabled={(control.toggle
                                && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                || (control.disabled && control.disabled(params))}
                              style={{
                                width: '100%',
                                opacity: ((control.toggle
                                    && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                    || (control.disabled && control.disabled(params)))
                                  ? 0.5
                                  : 1,
                              }}
                            />
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Shape Section */}
            {shapeControls2.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 'bold', color: '#666' }}>
                  Shape
                </h5>
                {shapeControls2.map(control => {
                  // Check if control should be shown
                  if (control.showWhen && !control.showWhen(params)) return null
                  if (control.dependsOn && !params[control.dependsOn]) return null

                  return (
                    <div key={control.param} style={{ marginBottom: '0.75rem' }}>
                      {control.type === 'checkbox'
                        ? (
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type='checkbox'
                              checked={params[control.param] || false}
                              onChange={(e) => updateParam(control.param, e.target.checked)}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <span>{control.name}</span>
                          </label>
                        )
                        : control.type === 'select'
                        ? (
                          <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                              {control.name}
                            </span>
                            <select
                              value={params[control.param] || control.options![0]}
                              onChange={(e) => updateParam(control.param, e.target.value)}
                              style={{ width: '100%', padding: '0.25rem' }}
                            >
                              {control.options!.map((opt: string) => (
                                <option key={opt} value={opt}>{opt.replace(/-/g, ' ')}</option>
                              ))}
                            </select>
                          </label>
                        )
                        : (
                          <div>
                            <span
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.25rem',
                                fontSize: '0.875rem',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {control.toggle && (
                                  <input
                                    type='checkbox'
                                    checked={control.toggleInverse ? !params[control.toggle] : params[control.toggle]}
                                    onChange={(e) =>
                                      updateParam(
                                        control.toggle,
                                        control.toggleInverse ? !e.target.checked : e.target.checked,
                                      )}
                                    style={{ cursor: 'pointer' }}
                                  />
                                )}
                                <span
                                  style={{
                                    opacity: ((control.toggle
                                        && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                        || (control.disabled && control.disabled(params)))
                                      ? 0.5
                                      : 1,
                                  }}
                                  title={control.tooltip ? control.tooltip(params) : ''}
                                >
                                  {control.name}
                                </span>
                              </span>
                              <span
                                style={{
                                  opacity: ((control.toggle
                                      && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                      || (control.disabled && control.disabled(params)))
                                    ? 0.5
                                    : 1,
                                }}
                              >
                                {params[control.param] || control.min}
                              </span>
                            </span>
                            <input
                              type='range'
                              min={control.min}
                              max={control.max}
                              step={control.step}
                              value={params[control.param] || control.min}
                              onChange={(e) => updateParam(control.param, parseFloat(e.target.value))}
                              disabled={(control.toggle
                                && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                || (control.disabled && control.disabled(params))}
                              style={{
                                width: '100%',
                                opacity: ((control.toggle
                                    && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                    || (control.disabled && control.disabled(params)))
                                  ? 0.5
                                  : 1,
                              }}
                            />
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {params.lineCount > 1 && advancedControls.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    background: 'none',
                    border: '1px solid #ddd',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Individual Line Controls
                </button>

                {showAdvanced && (
                  <>
                    <button
                      onClick={randomizeOffsets}
                      style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🎲 Randomize Offsets
                    </button>
                    <button
                      onClick={randomizeLengths}
                      style={{
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🎰 Randomize Lengths
                    </button>
                  </>
                )}
              </div>

              {showAdvanced && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Randomization Ranges</h4>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block' }}>
                      <span
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem',
                          fontSize: '0.875rem',
                        }}
                      >
                        <span>Offset Range (±)</span>
                        <span>{params.randomOffsetRange}</span>
                      </span>
                      <input
                        type='range'
                        min={0.1}
                        max={4}
                        step={0.1}
                        value={params.randomOffsetRange}
                        onChange={(e) => updateParam('randomOffsetRange', parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </label>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block' }}>
                      <span
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem',
                          fontSize: '0.875rem',
                        }}
                      >
                        <span>Length Range</span>
                        <span>{params.randomLengthRange}</span>
                      </span>
                      <input
                        type='range'
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={params.randomLengthRange}
                        onChange={(e) => updateParam('randomLengthRange', parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {showAdvanced && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Individual Line Controls</h4>
                  {advancedControls.map(control => {
                    if (control.showWhen && !control.showWhen(params)) return null

                    return (
                      <div key={control.param} style={{ marginBottom: '0.5rem' }}>
                        {control.type === 'checkbox'
                          ? (
                            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                              <input
                                type='checkbox'
                                checked={params[control.param] || false}
                                onChange={(e) => updateParam(control.param, e.target.checked)}
                                style={{ marginRight: '0.5rem' }}
                              />
                              <span>{control.name}</span>
                            </label>
                          )
                          : (
                            <div>
                              <span
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '0.25rem',
                                  fontSize: '0.75rem',
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {control.toggle && (
                                    <input
                                      type='checkbox'
                                      checked={control.toggleInverse ? !params[control.toggle] : params[control.toggle]}
                                      onChange={(e) =>
                                        updateParam(
                                          control.toggle,
                                          control.toggleInverse ? !e.target.checked : e.target.checked,
                                        )}
                                      style={{ cursor: 'pointer' }}
                                    />
                                  )}
                                  <span
                                    style={{
                                      opacity: ((control.toggle && (control.toggleInverse
                                          ? params[control.toggle]
                                          : !params[control.toggle])) || (control.disabled && control.disabled(params)))
                                        ? 0.5
                                        : 1,
                                    }}
                                    title={control.tooltip ? control.tooltip(params) : ''}
                                  >
                                    {control.name}
                                  </span>
                                </span>
                                <span
                                  style={{
                                    opacity: ((control.toggle
                                        && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                        || (control.disabled && control.disabled(params)))
                                      ? 0.5
                                      : 1,
                                  }}
                                >
                                  {params[control.param] || control.min}
                                </span>
                              </span>
                              <input
                                type='range'
                                min={control.min}
                                max={control.max}
                                step={control.step}
                                value={params[control.param] || control.min}
                                onChange={(e) => updateParam(control.param, parseFloat(e.target.value))}
                                disabled={(control.toggle
                                  && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                  || (control.disabled && control.disabled(params))}
                                style={{
                                  width: '100%',
                                  opacity: ((control.toggle
                                      && (control.toggleInverse ? params[control.toggle] : !params[control.toggle]))
                                      || (control.disabled && control.disabled(params)))
                                    ? 0.5
                                    : 1,
                                }}
                              />
                            </div>
                          )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            position: 'sticky',
            top: '20px',
            alignSelf: 'flex-start',
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'flex-end',
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginRight: '1rem' }}>
          </div>
          {sizes.map(size => {
            const scale = params.useLocalScale ? params.localScale : baseScale
            const scaledSize = size * scale
            const baseStroke = Math.max(1, size / 32) * baseStrokeWidth / 2
            const strokeWidth = params.useLocalStroke ? params.localStrokeWidth * size / 32 : baseStroke
            const shapeContent = shapeFunc(scaledSize, strokeWidth, params)

            // Calculate offset to center scaled shape
            const offset = (size - scaledSize) / 2

            return (
              <div key={size} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    borderRadius: '4px',
                    background: 'white',
                    width: size + 16,
                    height: size + 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    style={{ overflow: 'visible' }}
                  >
                    <g transform={`translate(${offset}, ${offset})`}>
                      <g
                        fill='none'
                        stroke='#000'
                        strokeWidth={strokeWidth}
                        strokeLinecap={params.roundedCaps ? 'round' : 'butt'}
                        strokeLinejoin={params.roundedCaps ? 'round' : 'miter'}
                        dangerouslySetInnerHTML={{ __html: shapeContent }}
                      />
                    </g>
                  </svg>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>{size}px</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ShapesGalleryUnified() {
  const [baseStrokeWidth, setBaseStrokeWidth] = useState(2)
  const [baseScale, setBaseScale] = useState(1)

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          background: '#f5f5f5',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Universal Controls</h3>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Base Stroke Width</span>
              <span>{baseStrokeWidth.toFixed(1)}</span>
            </span>
            <input
              type='range'
              min='0.5'
              max='5'
              step='0.1'
              value={baseStrokeWidth}
              onChange={(e) => setBaseStrokeWidth(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Base Scale</span>
              <span>{baseScale.toFixed(2)}x</span>
            </span>
            <input
              type='range'
              min='0.5'
              max='1.5'
              step='0.05'
              value={baseScale}
              onChange={(e) => setBaseScale(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
        </div>
      </div>

      <ShapeRow
        shapeName='unified'
        baseStrokeWidth={baseStrokeWidth}
        baseScale={baseScale}
      />
    </div>
  )
}
