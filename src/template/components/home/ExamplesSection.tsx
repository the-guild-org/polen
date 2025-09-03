import type { Api } from '#api/$'
import { Catalog } from '#lib/catalog/$'
import { Box, Button, Flex, Heading, Section } from '@radix-ui/themes'
import useEmblaCarousel from 'embla-carousel-react'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { GraphQLDocument } from '../GraphQLDocument.js'

interface ExamplesSectionProps {
  schemaCatalog?: Catalog.Catalog | undefined
  title?: string | undefined
  description?: string | undefined
  maxExamples?: number | undefined
  examples: readonly Api.Examples.Example.Example[]
}

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({
  examples,
  schemaCatalog,
  title = 'API Examples',
  maxExamples = 3,
}) => {
  if (examples.length === 0) {
    return null
  }

  // Limit examples to maxExamples
  const displayExamples = examples.slice(0, maxExamples)

  // Carousel setup with smaller slide size to show partial slides
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center', // Center the active slide
    slidesToScroll: 1,
    containScroll: false, // Allow slides to go beyond container
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Track selected slide for dots indicator
  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on('select', onSelect)
    onSelect() // Set initial state

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  // Add keyboard navigation
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

  return (
    <Section size='3' id='examples' style={{ overflow: 'visible' }}>
      <Box mb='4' style={{ textAlign: 'center' }}>
        <Heading size='6' mb='2'>
          {title}
        </Heading>
      </Box>

      {/* No Card wrapper - let content flow naturally */}
      <Box position='relative' style={{ overflow: 'visible' }}>
        {/* Carousel viewport - extends to full viewport width */}
        <Box
          ref={emblaRef}
          style={{
            overflow: 'hidden', // Hide overflow to prevent horizontal scroll
            // Use viewport-based margins to break out of all containers
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            paddingLeft: 'calc(50vw - 50%)',
            paddingRight: 'calc(50vw - 50%)',
          }}
        >
          <Flex
            style={{
              display: 'flex',
            }}
          >
            {displayExamples.map((example, index) => (
              <Box
                key={example.name}
                style={{
                  flex: displayExamples.length > 1 ? '0 0 80%' : '0 0 100%', // Smaller width to show partial slides
                  minWidth: 0,
                  paddingRight: displayExamples.length > 1 ? '2rem' : 0, // Use padding instead of margin for consistent spacing
                  opacity: index === selectedIndex ? 1 : 0.5, // Reduced opacity for non-focused items
                  transition: 'opacity 0.3s ease-in-out',
                }}
              >
                <GraphQLDocument
                  document={example.document}
                  schemaCatalog={schemaCatalog}
                  showVersionPicker={true}
                  interactive={true}
                />
              </Box>
            ))}
          </Flex>
        </Box>

        {/* Dots indicator - only show if more than one example */}
        {displayExamples.length > 1 && (
          <Flex justify='center' gap='2' mt='3'>
            {displayExamples.map((_, index) => (
              <Button
                key={index}
                size='1'
                variant={index === selectedIndex ? 'solid' : 'soft'}
                onClick={() => emblaApi?.scrollTo(index)}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  padding: 0,
                  cursor: 'pointer',
                }}
                aria-label={`Go to example ${index + 1}`}
              />
            ))}
          </Flex>
        )}
      </Box>
    </Section>
  )
}
