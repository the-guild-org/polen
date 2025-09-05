import { Box, Flex } from '@radix-ui/themes'
import useEmblaCarousel from 'embla-carousel-react'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CarouselPill } from './CarouselPill.js'

export interface CarouselProps {
  /** Items to display in the carousel */
  children: React.ReactNode[]
  /** Whether to enable auto-play */
  autoPlay?: boolean
  /** Duration in ms between slides when auto-playing */
  slideDuration?: number
  /** Whether to loop back to start */
  loop?: boolean
  /** Alignment of slides */
  align?: 'start' | 'center' | 'end'
  /** Number of slides to scroll at once */
  slidesToScroll?: number
  /** Whether to show navigation dots */
  showDots?: boolean
  /** Callback when slide changes */
  onSlideChange?: (index: number) => void
  /** Custom class name for carousel container */
  className?: string
  /** Width of each slide as percentage (e.g., '80%' to show partial next slide) */
  slideWidth?: string
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  autoPlay = false,
  slideDuration = 10_000,
  loop = true,
  align = 'center',
  slidesToScroll = 1,
  showDots = true,
  onSlideChange,
  className,
  slideWidth = children.length > 1 ? '80%' : '100%',
}) => {
  // Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop,
    align,
    slidesToScroll,
    containScroll: false,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  // Auto-play state
  const [isHovering, setIsHovering] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef = useRef<number>(0)
  const PROGRESS_UPDATE_INTERVAL = 50

  // No need for height tracking - flexbox handles it naturally

  // Track selected slide
  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap()
      setSelectedIndex(index)
      onSlideChange?.(index)
      // Reset progress on slide change
      elapsedRef.current = 0
      setProgress(0)
    }

    emblaApi.on('select', onSelect)
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSlideChange])

  // Auto-play functionality
  const startAutoPlay = useCallback((resumeFromProgress = false) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)

    if (!resumeFromProgress) {
      elapsedRef.current = 0
      setProgress(0)
    }

    progressIntervalRef.current = setInterval(() => {
      if (!isHovering) {
        elapsedRef.current += PROGRESS_UPDATE_INTERVAL
        const newProgress = (elapsedRef.current / slideDuration) * 100

        if (newProgress >= 100) {
          elapsedRef.current = 0
          if (emblaApi && children.length > 1) {
            emblaApi.scrollNext()
          }
        }

        setProgress(Math.min(newProgress, 100))
      }
    }, PROGRESS_UPDATE_INTERVAL)
  }, [emblaApi, autoPlay, isHovering, children.length, slideDuration])

  const stopAutoPlay = useCallback((preserveProgress = false) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (!preserveProgress) {
      elapsedRef.current = 0
      setProgress(0)
    }
  }, [])

  // Handle auto-play start/stop
  useEffect(() => {
    if (autoPlay && !isHovering && children.length > 1) {
      startAutoPlay(true)
    } else {
      stopAutoPlay(true)
    }

    return () => {
      stopAutoPlay(false)
    }
  }, [autoPlay, isHovering, startAutoPlay, stopAutoPlay, children.length])

  // Keyboard navigation
  useEffect(() => {
    if (!emblaApi) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        emblaApi.scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        emblaApi.scrollNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [emblaApi])

  if (children.length === 0) return null

  return (
    <Box
      position='relative'
      className={className}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Carousel viewport */}
      <Box
        ref={emblaRef}
        style={{
          overflow: 'hidden',
          // Break out of container for full-width effect
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)',
          paddingRight: 'calc(50vw - 50%)',
        }}
      >
        <Flex
          style={{
            display: 'flex',
            // Don't override align-items - let it default to 'stretch'
            // This makes all items equal height based on tallest content
            gap: children.length > 1 ? '2rem' : 0,
          }}
        >
          {React.Children.map(children, (child, index) => (
            <Box
              style={{
                // Control width but let height be determined by content
                flex: `0 0 ${slideWidth}`,
                minWidth: 0,
                // Opacity for focus effect
                opacity: index === selectedIndex ? 1 : 0.5,
                transition: 'opacity 0.3s ease-in-out',
                // Let flexbox stretch items to equal height (default behavior)
                // alignSelf defaults to 'auto' which inherits align-items: stretch
                // Add overflow for tall content
                overflow: 'auto',
                // Make this a flex container to allow children to stretch
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {child}
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Navigation pills with integrated timer */}
      {children.length > 1 && showDots && (
        <Flex justify='center' align='center' gap='2' mt='3'>
          {React.Children.map(children, (_, index) => (
            <CarouselPill
              key={index}
              isActive={index === selectedIndex}
              progress={progress}
              autoPlay={autoPlay}
              isPaused={false}
              isHovering={isHovering}
              onClick={() => emblaApi?.scrollTo(index)}
              index={index}
            />
          ))}
        </Flex>
      )}
    </Box>
  )
}
