/**
 * Compatibility layer for Radix Themes → shadcn migration
 * Maps old Radix props to new shadcn/Tailwind equivalents
 */

/**
 * Maps Radix numeric sizes to named sizes
 */
export const mapRadixSize = (size: string | number | undefined): string | undefined => {
  if (!size) return undefined

  const sizeMap: Record<string, string> = {
    '1': 'xs',
    '2': 'sm',
    '3': 'base',
    '4': 'lg',
    '5': 'xl',
    '6': '2xl',
    '7': '3xl',
    '8': '4xl',
    '9': '5xl',
  }

  return sizeMap[String(size)] ?? String(size)
}

/**
 * Maps Radix gap values to Tailwind gap classes
 */
export const mapRadixGap = (gap: string | number | undefined): string | undefined => {
  if (!gap) return undefined

  const gapMap: Record<string, string> = {
    '1': 'sm',
    '2': 'md',
    '3': 'lg',
    '4': 'xl',
    '5': 'xl',
    '6': 'xl',
    '7': 'xl',
    '8': 'xl',
    '9': 'xl',
  }

  return gapMap[String(gap)] ?? String(gap)
}

/**
 * Maps Radix color props to shadcn colors
 */
export const mapRadixColor = (color: string | undefined): string | undefined => {
  if (!color) return undefined

  const colorMap: Record<string, string> = {
    'gray': 'muted',
    'grey': 'muted',
    'blue': 'primary',
    'red': 'destructive',
    'green': 'accent',
    'yellow': 'accent',
    'orange': 'accent',
    'purple': 'primary',
  }

  return colorMap[color] ?? color
}

/**
 * Maps Radix button variants to shadcn variants
 */
export const mapRadixVariant = (variant: string | undefined): string | undefined => {
  if (!variant) return undefined

  const variantMap: Record<string, string> = {
    'solid': 'default',
    'soft': 'secondary',
    'surface': 'secondary',
    'outline': 'outline',
    'ghost': 'ghost',
  }

  return variantMap[variant] ?? variant
}

/**
 * Converts Radix spacing props to Tailwind classes
 */
export const mapSpacingToClassName = (props: {
  m?: string | number
  mt?: string | number
  mr?: string | number
  mb?: string | number
  ml?: string | number
  mx?: string | number
  my?: string | number
  p?: string | number
  pt?: string | number
  pr?: string | number
  pb?: string | number
  pl?: string | number
  px?: string | number
  py?: string | number
}): string => {
  const classes: string[] = []

  const spacingMap: Record<string, string> = {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
  }

  const mapValue = (value: string | number | undefined) => {
    if (!value) return null
    return spacingMap[String(value)] ?? String(value)
  }

  // Margin
  if (props.m) classes.push(`m-${mapValue(props.m)}`)
  if (props.mt) classes.push(`mt-${mapValue(props.mt)}`)
  if (props.mr) classes.push(`mr-${mapValue(props.mr)}`)
  if (props.mb) classes.push(`mb-${mapValue(props.mb)}`)
  if (props.ml) classes.push(`ml-${mapValue(props.ml)}`)
  if (props.mx) classes.push(`mx-${mapValue(props.mx)}`)
  if (props.my) classes.push(`my-${mapValue(props.my)}`)

  // Padding
  if (props.p) classes.push(`p-${mapValue(props.p)}`)
  if (props.pt) classes.push(`pt-${mapValue(props.pt)}`)
  if (props.pr) classes.push(`pr-${mapValue(props.pr)}`)
  if (props.pb) classes.push(`pb-${mapValue(props.pb)}`)
  if (props.pl) classes.push(`pl-${mapValue(props.pl)}`)
  if (props.px) classes.push(`px-${mapValue(props.px)}`)
  if (props.py) classes.push(`py-${mapValue(props.py)}`)

  return classes.join(' ')
}
