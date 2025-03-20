import { Command } from '@molt/command'
import { z } from 'zod'
import * as Vite from 'vite'

/**
 * Run the development server
 * @param cmdArgs - Command line arguments passed from main CLI
 */
export const run = async (cmdArgs: string[]): Promise<void> => {
  const args = Command.create()
    .parse({ line: cmdArgs })

  const server = await Vite.createServer()
  await server.listen()
  server.printUrls()
}
