import { Typings } from '#api/typings/$'
import { FileSystem } from '@effect/platform'
import { Effect } from 'effect'
import { type Example } from './example.js'

/**
 * Generate TypeScript type definitions for discovered examples.
 */
export const generateExampleTypes = (
  examples: Example[],
  projectRoot: string,
): Effect.Effect<void, Error, FileSystem.FileSystem> => {
  const exampleNames = examples.map(e => e.name)
  const typeDefinition = generateTypeDefinition(exampleNames)
  return Typings.write(
    {
      name: 'config.examples',
      content: typeDefinition,
    },
    { projectRoot },
  )
}

/**
 * Generate the TypeScript type definition content.
 */
function generateTypeDefinition(exampleNames: string[]): string {
  const quotedNames = exampleNames.map(name => `'${name}'`)
  const namesArray = quotedNames.length > 0
    ? `readonly [${quotedNames.join(', ')}]`
    : 'readonly []'

  const interfaceContent = `/**
 * Augment the global Examples interface with discovered example names.
 * This extends the base interface defined in #api/examples/config.
 */
interface Examples {
  /**
   * Type-safe list of discovered example names from the /examples directory.
   * This property is generated and provides autocomplete for example selection.
   */
  readonly names: ${namesArray}
}`

  return Typings.createGlobalAugmentation(
    interfaceContent,
    'Example type definitions',
  )
}
