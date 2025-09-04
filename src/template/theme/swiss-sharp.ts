import type { ThemeProps } from '@radix-ui/themes'

/**
 * Swiss Sharp Theme Configuration
 *
 * A minimal, sharp design system inspired by Swiss International Style.
 * Features mathematical grids, extreme typography contrast, and monochromatic palette.
 */
export const swissSharpTheme: Partial<ThemeProps> = {
  appearance: 'light',
  accentColor: 'blue',
  grayColor: 'gray',
  radius: 'none', // Sharp edges everywhere - no rounded corners
  scaling: '95%', // Tighter spacing for precision
  panelBackground: 'solid',
}
