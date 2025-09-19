// TODO: Review and replace inline styles with Tailwind classes
import type { React } from '#dep/react/index'
import { Text, type TextProps } from '../ui/index.js'

export const MinorHeading: React.FC<TextProps> = (props) => {
  return (
    <Text
      {...props}
      weight='bold'
      style={{
        ...props.style,
        color: `var(--accent-10)`,
        fontSize: `0.6rem`,
        letterSpacing: `0.025rem`,
        textTransform: `uppercase`,
      }}
    />
  )
}
