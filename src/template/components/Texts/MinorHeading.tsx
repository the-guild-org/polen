import type { React } from '#dep/react/index'
import { Text, type TextProps } from '@radix-ui/themes'

export const MinorHeading: React.FC<TextProps> = (props) => {
  return (
    <Text
      {...props}
      weight='bold'
      style={{
        ...props.style,
        color: 'var(--accent-10)',
        fontSize: '0.6rem',
        letterSpacing: '0.025rem',
        textTransform: 'uppercase',
      }}
    />
  )
}
