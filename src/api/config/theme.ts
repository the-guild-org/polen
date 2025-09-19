import { S } from '#dep/effect'

/**
 * Theme configuration for Polen developer portals.
 */
export const ThemeConfig = S.Struct({
  /**
   * Color mode configuration for your developer portal.
   *
   * - `light` - Light mode only
   * - `dark` - Dark mode only
   * - `system` - Follow system preference
   * - `both` - Allow users to toggle between light and dark
   *
   * @default 'both'
   */
  colorMode: S.optional(S.Enums(
    {
      light: 'light',
      dark: 'dark',
      system: 'system',
      both: 'both',
    } as const,
  )),

  /**
   * Custom color overrides for your theme.
   * These values are CSS color strings that override the default theme colors.
   *
   * @example
   * ```ts
   * colors: {
   *   primary: '#0070f3',
   *   secondary: '#7928ca',
   *   background: '#ffffff',
   *   foreground: '#000000',
   *   muted: '#f1f5f9',
   *   accent: '#0ea5e9',
   * }
   * ```
   */
  colors: S.optional(S.Struct({
    primary: S.optional(S.String),
    secondary: S.optional(S.String),
    background: S.optional(S.String),
    foreground: S.optional(S.String),
    muted: S.optional(S.String),
    accent: S.optional(S.String),
    border: S.optional(S.String),
  })),

  /**
   * Font family configuration.
   *
   * @example
   * ```ts
   * fonts: {
   *   sans: 'Inter, system-ui, sans-serif',
   *   mono: 'JetBrains Mono, monospace',
   * }
   * ```
   */
  fonts: S.optional(S.Struct({
    sans: S.optional(S.String),
    mono: S.optional(S.String),
  })),

  /**
   * Border radius configuration.
   * Controls the roundness of UI elements.
   *
   * - `none` - No border radius (sharp corners)
   * - `sm` - Small radius (slightly rounded)
   * - `md` - Medium radius (moderately rounded)
   * - `lg` - Large radius (very rounded)
   *
   * @default 'none' (Swiss sharp design)
   */
  borderRadius: S.optional(S.Enums(
    {
      none: 'none',
      sm: 'sm',
      md: 'md',
      lg: 'lg',
    } as const,
  )),

  /**
   * Custom CSS file to include in your portal.
   * Path relative to your project root.
   *
   * @example
   * ```ts
   * customCss: './src/styles/custom.css'
   * ```
   */
  customCss: S.optional(S.String),
}).annotations({
  identifier: 'ThemeConfig',
  description: 'Theme configuration for customizing the look and feel of your developer portal.',
})

export type ThemeConfig = S.Schema.Type<typeof ThemeConfig>
