/**
 * CLI command dispatcher that dynamically imports and runs commands based on arguments.
 * Usage: tsx main.ts <command> [...args]
 */
import { CommandDispatch } from '../lib/command-dispatch/_namespace.js'

/**
 * Define the relative path to command modules from this file
 */
const commandsBasePath = new URL('./commands/', import.meta.url).pathname

/**
 * Main function that launches the CLI
 */
const main = async (): Promise<void> => {
  try {
    await CommandDispatch.run(process.argv, commandsBasePath)
  } catch (error) {
    console.error('Unhandled error:', error)
    process.exit(1)
  }
}

// Execute the main function
main()
