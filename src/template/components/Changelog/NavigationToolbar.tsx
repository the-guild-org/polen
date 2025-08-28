import { Button, Flex, Heading, SegmentedControl } from '@radix-ui/themes'
import React from 'react'
import type { LayoutMode } from '../CatalogRailway/helpers.js'

interface NavigationToolbarProps {
  currentIndex: number
  totalCount: number
  currentVersion: string
  onPrevious: () => void
  onNext: () => void
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  isWiggling?: boolean
  layoutMode?: LayoutMode
  onLayoutModeChange?: (mode: LayoutMode) => void
}

export const NavigationToolbar: React.FC<NavigationToolbarProps> = ({
  currentVersion,
  onPrevious,
  onNext,
  canNavigatePrevious,
  canNavigateNext,
  isWiggling = false,
  layoutMode = 'uniform',
  onLayoutModeChange,
}) => {
  const titleText = `Version ${currentVersion}`

  return (
    <>
      <style>
        {`
        @keyframes charShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        .shaking-char {
          display: inline-block;
          animation: charShake 0.3s ease-in-out;
          transform-origin: center center;
        }
      `}
      </style>
      <Flex
        direction='column'
        gap='3'
        style={{
          padding: '1rem 0',
          borderBottom: '1px solid var(--gray-4)',
          marginBottom: '1.5rem',
        }}
      >
        {/* Navigation row */}
        <Flex justify='between' align='center'>
          <Button
            variant='ghost'
            onClick={onPrevious}
            style={{ visibility: canNavigatePrevious ? 'visible' : 'hidden' }}
          >
            ← Newer
          </Button>

          <Heading size='5'>
            {isWiggling
              ? (
                titleText.split('').map((char, index) => (
                  <span
                    key={index}
                    className='shaking-char'
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))
              )
              : titleText}
          </Heading>

          <Button
            variant='ghost'
            onClick={onNext}
            style={{ visibility: canNavigateNext ? 'visible' : 'hidden' }}
          >
            Older →
          </Button>
        </Flex>

        {/* Layout mode toggle */}
        {onLayoutModeChange && (
          <Flex justify='center'>
            <SegmentedControl.Root
              value={layoutMode}
              onValueChange={(value) => onLayoutModeChange(value as LayoutMode)}
              size='1'
            >
              <SegmentedControl.Item value='uniform'>Uniform</SegmentedControl.Item>
              <SegmentedControl.Item value='temporal'>Timeline</SegmentedControl.Item>
            </SegmentedControl.Root>
          </Flex>
        )}
      </Flex>
    </>
  )
}
