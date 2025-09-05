import { Box } from '@radix-ui/themes'
import * as React from 'react'

export interface CarouselPillProps {
  /** Whether this pill represents the active slide */
  isActive: boolean
  /** Progress percentage (0-100) for the active pill */
  progress: number
  /** Whether autoplay is enabled */
  autoPlay: boolean
  /** Whether the carousel is paused */
  isPaused: boolean
  /** Whether the carousel is being hovered */
  isHovering: boolean
  /** Click handler to navigate to this slide */
  onClick: () => void
  /** Slide index for accessibility */
  index: number
}

export const CarouselPill: React.FC<CarouselPillProps> = ({
  isActive,
  progress,
  autoPlay,
  isPaused,
  isHovering,
  onClick,
  index,
}) => {
  const pillWidth = 24
  const pillHeight = 4
  const borderRadius = 2
  const gap = 2 // Gap between pill and progress stroke
  const strokeWidth = 1.5

  // SVG canvas needs to fit both pill and surrounding progress ring
  const svgWidth = pillWidth + (gap * 2) + (strokeWidth * 2)
  const svgHeight = pillHeight + (gap * 2) + (strokeWidth * 2)

  // Progress ring dimensions (surrounds the pill with gap)
  const progressWidth = pillWidth + (gap * 2) + 1
  const progressHeight = pillHeight + (gap * 2) + 1
  const progressRadius = borderRadius + gap

  // Calculate perimeter for progress animation
  const perimeter = 2 * (progressWidth + progressHeight - 2 * progressRadius) + 2 * Math.PI * progressRadius

  return (
    <Box
      onClick={onClick}
      style={{
        cursor: 'pointer',
        opacity: isActive ? 1 : 0.6,
        transition: 'opacity 0.3s ease',
      }}
      aria-label={`Go to slide ${index + 1}`}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {/* Background pill - centered in the SVG */}
        <rect
          x={gap + strokeWidth}
          y={gap + strokeWidth}
          width={pillWidth}
          height={pillHeight}
          rx={borderRadius}
          ry={borderRadius}
          fill={isActive ? 'var(--accent-9)' : 'var(--gray-5)'}
          style={{
            transition: 'fill 0.3s ease',
          }}
        />

        {/* Progress ring - only for active slide with autoplay */}
        {isActive && autoPlay && (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={progressWidth}
            height={progressHeight}
            rx={progressRadius}
            ry={progressRadius}
            fill='none'
            stroke='var(--accent-11)'
            strokeWidth={strokeWidth}
            strokeDasharray={perimeter}
            strokeDashoffset={perimeter * (1 - progress / 100)}
            style={{
              transition: isPaused || isHovering ? 'none' : 'stroke-dashoffset 0.05s linear',
              opacity: '0.5',
              transformOrigin: 'center',
            }}
          />
        )}
      </svg>
    </Box>
  )
}
