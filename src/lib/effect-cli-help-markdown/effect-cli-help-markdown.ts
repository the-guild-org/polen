import type { Command, CommandDescriptor, Options, Args, Primitive, HelpDoc } from '@effect/cli'

// ============================================================================
// Types
// ============================================================================

export interface MarkdownOptions {
  /**
   * The heading level to start with (1-6)
   * @default 1
   */
  baseHeadingLevel?: number
  /**
   * Whether to include the command name as a heading
   * @default true
   */
  includeCommandName?: boolean
}

// Internal descriptor types based on actual Effect CLI structure
interface DescriptorBase {
  _tag: string
}

interface StandardDescriptor extends DescriptorBase {
  _tag: 'Standard'
  name: string
  description: DescriptionStructure
  options: OptionsStructure
  args: ArgsStructure
}

interface SubcommandsDescriptor extends DescriptorBase {
  _tag: 'Subcommands'
  parent: {
    command: StandardDescriptor
  }
  children: CommandWrapper[]
}

interface MapDescriptor extends DescriptorBase {
  _tag: 'Map'
  command: StandardDescriptor
}

interface CommandWrapper {
  _tag: 'Map'
  command: StandardDescriptor | MapDescriptor
}

interface DescriptionStructure {
  _tag: 'Empty' | 'Paragraph'
  value?: {
    value: string
  }
}

interface OptionsStructure extends DescriptorBase {
  _tag: 'Empty' | 'Single' | 'Map' | 'Both' | 'WithDefault'
  options?: OptionsStructure
  left?: OptionsStructure
  right?: OptionsStructure
  fallback?: unknown
  name?: string
  fullName?: string
  placeholder?: string
  aliases?: string[]
  primitiveType?: PrimitiveTypeStructure
  description?: DescriptionStructure
}

interface ArgsStructure extends DescriptorBase {
  _tag: 'Empty' | 'Single' | 'Map' | 'Both' | 'WithDefault'
  args?: ArgsStructure
  left?: ArgsStructure
  right?: ArgsStructure
  fallback?: { _tag: 'Some' | 'None'; value?: unknown }
  name?: string
  pseudoName?: { _tag: 'Some' | 'None'; value?: string }
  primitiveType?: PrimitiveTypeStructure
  description?: DescriptionStructure
}

interface PrimitiveTypeStructure extends DescriptorBase {
  _tag: 'Bool' | 'Text' | 'Integer' | 'Float' | 'Choice'
  defaultValue?: { _tag: 'Some' | 'None'; value?: unknown }
  alternatives?: Array<[string, string]>
}

// Command with internal descriptor property
// We can't extend Command directly, so we type it as an intersection
type CommandInternal<Name extends string, R, E, A> = Command.Command<Name, R, E, A> & {
  descriptor: StandardDescriptor | SubcommandsDescriptor | MapDescriptor
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Convert an Effect CLI Command to markdown documentation
 */
export const commandToMarkdown = <Name extends string, R, E, A>(
  command: Command.Command<Name, R, E, A>,
  options: MarkdownOptions = {},
): string => {
  const {
    baseHeadingLevel = 1,
    includeCommandName = true,
  } = options

  const sections: string[] = []

  // Extract command info - we need to access internal properties
  const internalCommand = command as unknown as CommandInternal<Name, R, E, A>
  const commandInfo = extractCommandInfo(internalCommand)

  // Add command name as heading if requested
  if (includeCommandName && commandInfo.name) {
    sections.push(`${'#'.repeat(baseHeadingLevel)} \`${commandInfo.name}\``)
    sections.push('')
  }

  // Add description
  if (commandInfo.description) {
    sections.push(commandInfo.description)
    sections.push('')
  }

  // Add usage section
  if (commandInfo.usage) {
    sections.push(`${'#'.repeat(baseHeadingLevel + 1)} Usage`)
    sections.push('')
    sections.push('```sh')
    sections.push(commandInfo.usage)
    sections.push('```')
    sections.push('')
  }

  // Add arguments section
  if (commandInfo.args && commandInfo.args.length > 0) {
    sections.push(`${'#'.repeat(baseHeadingLevel + 1)} Arguments`)
    sections.push('')

    for (const arg of commandInfo.args) {
      sections.push(`- \`${arg.name}\` ${arg.required ? '(required)' : '(optional)'}`)
      if (arg.description) {
        sections.push(`  - ${arg.description}`)
      }
      if (arg.type) {
        sections.push(`  - Type: \`${arg.type}\``)
      }
      if (arg.default !== undefined) {
        sections.push(`  - Default: \`${arg.default}\``)
      }
    }
    sections.push('')
  }

  // Add options section
  if (commandInfo.options && commandInfo.options.length > 0) {
    sections.push(`${'#'.repeat(baseHeadingLevel + 1)} Options`)
    sections.push('')
    sections.push('| Option | Alias | Type | Required | Default | Description |')
    sections.push('|--------|-------|------|----------|---------|-------------|')

    for (const option of commandInfo.options) {
      const alias = option.alias ? `-${option.alias}` : ''
      const required = option.required ? 'Yes' : 'No'
      const defaultVal = option.default !== undefined ? `\`${option.default}\`` : '-'
      const description = option.description || '-'

      sections.push(
        `| \`--${option.name}\` | \`${alias}\` | ${option.type} | ${required} | ${defaultVal} | ${description} |`,
      )
    }
    sections.push('')
  }

  // Add subcommands section
  if (commandInfo.subcommands && commandInfo.subcommands.length > 0) {
    sections.push(`${'#'.repeat(baseHeadingLevel + 1)} Subcommands`)
    sections.push('')

    for (const subcommand of commandInfo.subcommands) {
      sections.push(`- \`${subcommand.name}\` - ${subcommand.description || 'No description'}`)
    }
    sections.push('')

    // Add detailed subcommand documentation
    for (const subcommand of commandInfo.subcommands) {
      sections.push(`${'#'.repeat(baseHeadingLevel + 2)} \`${commandInfo.name} ${subcommand.name}\``)
      sections.push('')

      if (subcommand.description) {
        sections.push(subcommand.description)
        sections.push('')
      }

      // Recursively generate documentation for subcommand
      // Note: This is simplified - in reality we'd need to handle the subcommand properly
      if (subcommand.usage) {
        sections.push('```sh')
        sections.push(subcommand.usage)
        sections.push('```')
        sections.push('')
      }
    }
  }

  // Add examples section
  if (commandInfo.examples && commandInfo.examples.length > 0) {
    sections.push(`${'#'.repeat(baseHeadingLevel + 1)} Examples`)
    sections.push('')

    for (const example of commandInfo.examples) {
      if (example.description) {
        sections.push(example.description)
        sections.push('')
      }
      sections.push('```sh')
      sections.push(example.command)
      sections.push('```')
      sections.push('')
    }
  }

  return sections.join('\n').trim()
}

// ============================================================================
// Helper Functions
// ============================================================================

interface CommandInfo {
  name?: string
  description?: string
  usage?: string
  args?: ArgumentInfo[]
  options?: OptionInfo[]
  subcommands?: SubcommandInfo[]
  examples?: ExampleInfo[]
}

interface ArgumentInfo {
  name: string
  description?: string
  type?: string
  required: boolean
  default?: unknown
}

interface OptionInfo {
  name: string
  alias?: string | undefined
  description?: string | undefined
  type: string
  required: boolean
  default?: unknown | undefined
}

interface SubcommandInfo {
  name: string
  description?: string | undefined
  usage?: string | undefined
}

interface ExampleInfo {
  description?: string
  command: string
}

/**
 * Extract command information from an Effect CLI Command
 * This uses the command's descriptor property to access metadata
 */
const extractCommandInfo = <Name extends string, R, E, A>(
  command: CommandInternal<Name, R, E, A>,
): CommandInfo => {
  const info: CommandInfo = {}

  // Access the descriptor property which contains command metadata
  const descriptor = command.descriptor

  if (descriptor) {
    // For subcommands within a Map structure, the actual command is nested
    const actualCommand = getActualCommand(descriptor)
    
    // Extract name from descriptor
    if (actualCommand.name) {
      info.name = actualCommand.name
      info.usage = `polen ${actualCommand.name} [options]`
    }

    // Extract description if available
    if (actualCommand.description && actualCommand.description._tag !== 'Empty') {
      // Description might be wrapped in a structure
      if (actualCommand.description.value?.value) {
        info.description = actualCommand.description.value.value
      }
    }

    // Extract options from descriptor
    if (actualCommand.options) {
      info.options = extractOptionsFromDescriptor(actualCommand.options)
    }

    // Extract arguments from descriptor
    if (actualCommand.args) {
      info.args = extractArgsFromDescriptor(actualCommand.args)
    }
  }

  return info
}

/**
 * Get the actual command descriptor from various wrapper structures
 */
const getActualCommand = (descriptor: StandardDescriptor | SubcommandsDescriptor | MapDescriptor): StandardDescriptor => {
  if (descriptor._tag === 'Map' && 'command' in descriptor) {
    return descriptor.command
  }
  if (descriptor._tag === 'Subcommands') {
    return descriptor.parent.command
  }
  return descriptor as StandardDescriptor
}

/**
 * Extract options from a descriptor's options
 */
const extractOptionsFromDescriptor = (options: OptionsStructure): OptionInfo[] => {
  if (!options) return []

  const result: OptionInfo[] = []

  // Handle Effect CLI option structures
  switch (options._tag) {
    case 'Single':
      // Single option
      result.push(extractSingleOption(options))
      break
    case 'Map':
      // Nested option structure
      if (options.options) {
        result.push(...extractOptionsFromDescriptor(options.options))
      }
      break
    case 'Both':
      // Two options combined
      if (options.left) {
        result.push(...extractOptionsFromDescriptor(options.left))
      }
      if (options.right) {
        result.push(...extractOptionsFromDescriptor(options.right))
      }
      break
    case 'WithDefault':
      // Option with default value
      if (options.options) {
        result.push(...extractOptionsFromDescriptor(options.options))
      }
      break
    case 'Empty':
      // No options
      break
  }

  return result
}

/**
 * Extract a single option's information
 */
const extractSingleOption = (option: OptionsStructure): OptionInfo => {
  // Extract description from complex structure
  let description = ''
  if (option.description) {
    if (option.description.value?.value) {
      description = option.description.value.value
    }
  }

  // Extract type from primitiveType
  let type = 'string'
  if (option.primitiveType) {
    switch (option.primitiveType._tag) {
      case 'Bool':
        type = 'boolean'
        break
      case 'Text':
        type = 'string'
        break
      case 'Integer':
        type = 'number'
        break
      case 'Float':
        type = 'number'
        break
      case 'Choice':
        const choices = option.primitiveType.alternatives?.map(alt => alt[0]).join(' | ') || ''
        type = choices || 'choice'
        break
      default:
        type = 'string' // fallback for unknown primitive types
    }
  }

  // Extract aliases
  const aliases = Array.isArray(option.aliases) ? option.aliases : []
  const alias = aliases.length > 0 ? aliases[0] : undefined

  // Extract default value
  let defaultValue = undefined
  if (option.primitiveType?.defaultValue?._tag === 'Some') {
    defaultValue = option.primitiveType.defaultValue.value
  }

  return {
    name: option.name || 'unknown',
    alias,
    description,
    type,
    required: false, // Effect CLI options are typically optional
    default: defaultValue,
  }
}

/**
 * Extract arguments from a descriptor's args
 */
const extractArgsFromDescriptor = (args: ArgsStructure): ArgumentInfo[] => {
  if (!args) return []

  const result: ArgumentInfo[] = []

  // Handle Effect CLI argument structures
  switch (args._tag) {
    case 'Single':
      // Single argument
      result.push(extractSingleArg(args))
      break
    case 'Map':
      // Nested argument structure
      if (args.args) {
        result.push(...extractArgsFromDescriptor(args.args))
      }
      break
    case 'Both':
      // Two arguments combined
      if (args.left) {
        result.push(...extractArgsFromDescriptor(args.left))
      }
      if (args.right) {
        result.push(...extractArgsFromDescriptor(args.right))
      }
      break
    case 'WithDefault':
      // Argument with default value
      if (args.args) {
        result.push(...extractArgsFromDescriptor(args.args))
      }
      break
    case 'Empty':
      // No arguments
      break
  }

  return result
}

/**
 * Extract a single argument's information
 */
const extractSingleArg = (arg: ArgsStructure): ArgumentInfo => {
  // Extract description from complex structure
  let description = ''
  if (arg.description) {
    if (arg.description.value?.value) {
      description = arg.description.value.value
    }
  }

  // Extract type from primitiveType
  let type = 'string'
  if (arg.primitiveType) {
    switch (arg.primitiveType._tag) {
      case 'Bool':
        type = 'boolean'
        break
      case 'Text':
        type = 'string'
        break
      case 'Integer':
        type = 'number'
        break
      case 'Float':
        type = 'number'
        break
      default:
        type = arg.primitiveType._tag?.toLowerCase() || 'string'
    }
  }

  // Use pseudoName if available for cleaner display
  const displayName = arg.pseudoName?._tag === 'Some' ? arg.pseudoName.value : arg.name

  return {
    name: displayName || arg.name || 'unknown',
    description,
    type,
    required: arg.fallback === undefined || arg.fallback?._tag === 'None',
    default: arg.fallback?._tag === 'Some' ? arg.fallback.value : undefined,
  }
}

/**
 * Extract subcommands from a descriptor
 */
const extractSubcommandsFromDescriptor = (subcommands: unknown): SubcommandInfo[] => {
  if (!subcommands) return []

  const result: SubcommandInfo[] = []

  if (Array.isArray(subcommands)) {
    for (const subcommand of subcommands) {
      if (subcommand && typeof subcommand === 'object' && 'name' in subcommand) {
        const info: SubcommandInfo = {
          name: subcommand.name as string,
          description: (subcommand as { description?: string }).description,
          usage: (subcommand as { usage?: string }).usage,
        }
        result.push(info)
      }
    }
  } else if (typeof subcommands === 'object') {
    for (const key of Object.keys(subcommands as object)) {
      const subcommand = (subcommands as Record<string, unknown>)[key]
      if (subcommand && typeof subcommand === 'object' && 'name' in subcommand) {
        const info: SubcommandInfo = {
          name: (subcommand as { name?: string }).name || key,
          description: (subcommand as { description?: string }).description,
          usage: (subcommand as { usage?: string }).usage,
        }
        result.push(info)
      }
    }
  }

  return result
}

/**
 * Generate markdown documentation for a CLI with subcommands
 * This function traverses the command tree and generates documentation for each subcommand
 */
export const cliToMarkdown = <Name extends string, R, E, A>(
  command: Command.Command<Name, R, E, A>,
  options: MarkdownOptions & {
    includeGlobalOptions?: boolean
  } = {},
): string => {
  const sections: string[] = []
  const internalCommand = command as unknown as CommandInternal<Name, R, E, A>
  const descriptor = internalCommand.descriptor

  // Based on debugging output, the structure is:
  // descriptor._tag: "Subcommands"
  // descriptor.children: array of subcommands
  // descriptor.parent.command.options: global options
  if (descriptor && descriptor._tag === 'Subcommands' && 'children' in descriptor) {
    // Extract subcommands from the children array
    const subcommands = descriptor.children

    // Sort subcommands alphabetically by name for consistent output
    const sortedSubcommands = [...subcommands].sort((a, b) => {
      const nameA = getCommandName(a) || ''
      const nameB = getCommandName(b) || ''
      return nameA.localeCompare(nameB)
    })

    for (const subcommand of sortedSubcommands) {
      if (subcommand && typeof subcommand === 'object') {
        // The subcommands in children array don't have a descriptor property
        // Instead they have the command structure directly
        // We need to wrap it to match what commandToMarkdown expects
        // Create a wrapper object that has the descriptor property
        const wrappedCommand = {
          descriptor: subcommand.command || subcommand
        }
        
        // Generate markdown for each subcommand
        const markdown = commandToMarkdown(wrappedCommand as unknown as Command.Command<string, unknown, unknown, unknown>, {
          ...options,
          includeCommandName: true,
          baseHeadingLevel: options.baseHeadingLevel || 3,
        })

        if (markdown) {
          sections.push(markdown)
          sections.push('')
        }
      }
    }
  }

  // Add global options if requested
  if (options.includeGlobalOptions !== false) {
    // Extract global options from the main command
    const globalOptionsMarkdown = extractGlobalOptions(internalCommand, options.baseHeadingLevel || 2)
    if (globalOptionsMarkdown) {
      sections.push('')
      sections.push(globalOptionsMarkdown)
    }
  }

  return sections.join('\n').trim()
}

/**
 * Get command name from a command wrapper
 */
const getCommandName = (commandWrapper: CommandWrapper): string | undefined => {
  if (commandWrapper.command) {
    if ('name' in commandWrapper.command) {
      return commandWrapper.command.name
    }
    if ('command' in commandWrapper.command && commandWrapper.command.command) {
      return commandWrapper.command.command.name
    }
  }
  return undefined
}

/**
 * Extract and format global options from the main CLI command
 */
const extractGlobalOptions = <Name extends string, R, E, A>(
  command: CommandInternal<Name, R, E, A>,
  baseHeadingLevel: number = 2,
): string => {
  const sections: string[] = []
  const descriptor = command.descriptor

  // Based on debugging, global options are at descriptor.parent.command.options
  // for a Subcommands descriptor
  let globalOptions: OptionsStructure | undefined = undefined
  
  if (descriptor._tag === 'Subcommands' && 'parent' in descriptor) {
    globalOptions = descriptor.parent.command.options
  } else if ('options' in descriptor) {
    // Fallback to descriptor.options if it's not a Subcommands type
    globalOptions = descriptor.options
  }

  if (globalOptions) {
    const optionsInfo = extractOptionsFromDescriptor(globalOptions)

    if (optionsInfo.length > 0) {
      sections.push(`${'#'.repeat(baseHeadingLevel)} Global Options`)
      sections.push('')
      sections.push('All commands support these global options:')
      sections.push('')

      for (const option of optionsInfo) {
        const alias = option.alias ? `, -${option.alias}` : ''
        const description = option.description || 'No description available'
        sections.push(`- \`--${option.name}${alias}\` - ${description}`)
      }
    }
  }

  // Add standard Effect CLI options that are always available
  if (sections.length > 0) {
    sections.push('')
    sections.push('Additionally, the following standard options are available:')
    sections.push('')
    sections.push('- `--help` - Show help for the command')
    sections.push('- `--wizard` - Start wizard mode for guided command construction')
    sections.push('- `--completions <shell>` - Generate shell completions for bash/zsh/fish')
  }

  return sections.join('\n')
}

// ============================================================================
// Exports
// ============================================================================

export default {
  commandToMarkdown,
  cliToMarkdown,
}