import { Ef } from '#dep/effect'
import { Command } from '@effect/cli'
import { consola } from 'consola'

// Import subcommands
import { configCreate } from './config/create.js'

// Default config command that shows usage
const configDefault = Command.make(
  'config',
  {},
  () =>
    Ef.gen(function*() {
      consola.info('Available config commands:')
      console.log('')
      console.log('  polen config create    Create a Polen configuration file')
      console.log('')
      consola.info('Run a command to see its help.')
    }),
)

// Export the config command with subcommands
export const config = configDefault.pipe(
  Command.withSubcommands([configCreate]),
)
