import { HashSet } from 'effect'
import type { ExampleName, ExampleSelection } from './config.js'
import { Example } from './schemas/example/$.js'

/**
 * Filter examples based on the display configuration.
 *
 * @param examples - All available examples
 * @param selection - The display configuration
 * @returns Filtered examples based on the selection criteria
 */
export const filterExamplesBySelection = (
  examples: Example.Example[],
  selection: ExampleSelection | undefined,
): Example.Example[] => {
  // If no selection config, default to all
  if (selection === undefined) {
    return examples
  }

  // Handle string literals
  if (selection === 'all') {
    return examples
  }

  if (selection === 'none') {
    return []
  }

  // Handle include pattern
  if ('include' in selection) {
    const includeSet = HashSet.fromIterable(selection.include)
    return examples.filter(example => HashSet.has(includeSet, example.name as ExampleName))
  }

  // Handle exclude pattern
  if ('exclude' in selection) {
    const excludeSet = HashSet.fromIterable(selection.exclude)
    return examples.filter(example => !HashSet.has(excludeSet, example.name as ExampleName))
  }

  // Fallback to all examples if selection pattern is not recognized
  return examples
}

/**
 * Check if an example should be displayed based on the selection criteria.
 *
 * @param exampleName - The ID of the example to check
 * @param selection - The display configuration
 * @returns Whether the example should be displayed
 */
export const shouldDisplayExample = (
  exampleName: ExampleName,
  selection: ExampleSelection | undefined,
): boolean => {
  // If no selection config, default to show
  if (selection === undefined) {
    return true
  }

  // Handle string literals
  if (selection === 'all') {
    return true
  }

  if (selection === 'none') {
    return false
  }

  // Handle include pattern
  if ('include' in selection) {
    const includeSet = HashSet.fromIterable(selection.include)
    return HashSet.has(includeSet, exampleName)
  }

  // Handle exclude pattern
  if ('exclude' in selection) {
    const excludeSet = HashSet.fromIterable(selection.exclude)
    return !HashSet.has(excludeSet, exampleName)
  }

  // Fallback to show if selection pattern is not recognized
  return true
}
