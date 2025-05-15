import { Fs, Path } from '@wollybeard/kit'
import * as Url from 'node:url'

export const dispatch = async (params: {
  commandName?: string,
  argv?: string[],
  commandsDir: string,
}) => {
  const argv = params.argv
  const commandTarget = getCommandTarget(argv)
  const type = commandTarget.type
  const commandsDirPath = stripFileProtocol(params.commandsDir)

  shiftArgvForCommand({ argv, type })

  const moduleName = getModuleName(commandTarget)
  const moduleId = getModuleId(moduleName, commandsDirPath)

  if (!await Fs.exists(moduleId)) {
    console.error(`Error: Command module not found: ${moduleName} at ${moduleId}`)
    process.exit(1)
  }

  try {
    await import(moduleId)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

const getModuleName = (commandTarget: CommandTarget): string => {
  return commandTarget.type === `sub` ? commandTarget.name : `$default`
}

type ProcessArgs = string[]

type CommandTarget = {
  type: `sub`,
  name: string,
} | {
  type: `default`,
}

const getCommandTarget = (argv?: ProcessArgs): CommandTarget => {
  const args = getProcessArgs(argv)
  const commandName = args[0]?.trim()
  if (!commandName || isNamedParameter(commandName)) {
    return {
      type: `default`,
    }
  }
  return {
    type: `sub`,
    name: commandName,
  }
}

const isNamedParameter = (arg: string): boolean => arg.startsWith(`-`)

export const parseSubCommandNameFromArgv = (argv?: string[]): string | null => {
  const args = getProcessArgs(argv)
  const commandName = args[0] ?? null
  return commandName
}

const getProcessArgs = (argv?: string[]): string[] => (argv ?? process.argv).slice(2)

const shiftArgvForCommand = (
  params: { argv?: string[], type: `default` | `sub` },
): void => {
  const argv = params.argv ?? process.argv
  argv.shift()
  argv.shift()
  if (params.type === `sub`) argv.shift()
}

export const getCodeFileExtensionOrThrow = (): string => {
  const { ext } = Path.parse(Url.fileURLToPath(import.meta.url))
  return ext
}

const getModuleId = (name: string, commandsDir: string): string => {
  const { ext } = Path.parse(Url.fileURLToPath(import.meta.url))
  return `${Path.normalize(Path.join(commandsDir, name))}.${ext}`
}

const stripFileProtocol = (url: string): string => {
  if (url.startsWith(fileProtocol)) {
    return url.slice(fileProtocol.length)
  }
  return url
}

const fileProtocol = `file://`
