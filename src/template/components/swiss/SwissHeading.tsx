import { Heading } from '@radix-ui/themes'
import * as React from 'react'

/**
 * Swiss Heading Component
 *
 * A sharp, impactful heading component that splits words for vertical stacking.
 * Features extreme typography contrast and tight tracking.
 */
export const SwissHeading: React.FC<React.ComponentProps<typeof Heading>> = ({
  children,
  ...props
}) => {
  // Split words for stacked display
  const words = typeof children === 'string'
    ? children.split(' ')
    : React.Children.toArray(children)

  return (
    <Heading
      {...props}
      weight='bold'
      style={{
        fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
        lineHeight: 0.9,
        letterSpacing: '-0.04em',
        fontWeight: 900,
        ...props.style,
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            marginBottom: i < words.length - 1 ? '-0.05em' : 0,
          }}
        >
          {word}
        </span>
      ))}
    </Heading>
  )
}
