/**
 * Command dispatch library for CLI applications
 * Provides utilities for parsing, loading, and executing commands
 */

/**
 * Interface for command modules that can be dynamically imported
 */
export type CommandModule = {
  run: (args: string[]) => Promise<void> | void
}

/**
 * Represents a parsed command with its arguments
 */
export type ParsedCommand = {
  /** Name of the command to execute */
  name: string
  /** Arguments to pass to the command */
  args: string[]
}

/**
 * Parse process arguments into a command name and arguments
 * 
 * @param argv - Process arguments array
 * @returns ParsedCommand object with name and args, or null if no command specified
 */
export const parseCommand = (argv: string[]): ParsedCommand | null => {
  // Command name is the first argument after node and script name
  const commandName = argv[2]
  
  if (!commandName) {
    return null
  }

  // Arguments are everything after the command name
  const commandArgs = argv.slice(3)
  
  return {
    name: commandName,
    args: commandArgs
  }
}

/**
 * Load a command module by name
 * 
 * @param commandName - Name of the command to load
 * @param basePath - Base path for importing modules (defaults to './')
 * @returns Promise resolving to the loaded command module
 * @throws Error if module not found or doesn't export a run function
 */
export const loadCommandModule = async (
  commandName: string, 
  basePath = './'
): Promise<CommandModule> => {
  // Try to import the command module dynamically
  const commandModule = await import(`${basePath}${commandName}.js`) as CommandModule
  
  // Check if the module has a run function
  if (typeof commandModule.run !== 'function') {
    throw new Error(`Command module '${commandName}' does not export a 'run' function`)
  }
  
  return commandModule
}

/**
 * Execute a command with its arguments
 * 
 * @param command - ParsedCommand object containing name and args
 * @param basePath - Base path for importing modules (defaults to './')
 */
export const executeCommand = async (
  command: ParsedCommand,
  basePath = './'
): Promise<void> => {
  try {
    const module = await loadCommandModule(command.name, basePath)
    await module.run(command.args)
  } catch (error) {
    // Handle module not found errors in a type-safe way
    if (error instanceof Error && 
        'code' in error && 
        error.code === 'MODULE_NOT_FOUND') {
      console.error(`Error: Command '${command.name}' not found`)
    } else {
      console.error(`Error executing command '${command.name}':`, error)
    }
    process.exit(1)
  }
}

/**
 * Main CLI dispatcher function
 * Parses command from process.argv and executes it
 * 
 * @param argv - Process arguments (defaults to process.argv)
 * @param basePath - Base path for importing modules (defaults to './')
 */
export const run = async (
  argv = process.argv,
  basePath = './'
): Promise<void> => {
  const command = parseCommand(argv)
  
  if (!command) {
    console.error('Error: No command specified')
    console.log('Usage: <script> <command> [...args]')
    process.exit(1)
  }
  
  await executeCommand(command, basePath)
}
