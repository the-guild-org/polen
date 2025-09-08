import { useMemo } from 'react'

/**
 * Generic hook for calculating the maximum character width of names in a list.
 * Used to align columns in lists like fields, arguments, etc.
 *
 * @param items - Array of items to measure
 * @param getName - Function to extract the name from each item
 * @returns Maximum character width across all names
 */
export const useAlignedColumns = <T>(
  items: T[],
  getName: (item: T) => string,
): number => {
  return useMemo(() => {
    if (items.length === 0) return 0
    return Math.max(...items.map(item => getName(item).length))
  }, [items])
}
