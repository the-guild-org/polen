import { Api } from '#api/$'
import { Args, Command, Options } from '@effect/cli'
import { Err, Fs, Manifest, Name, Path, Str } from '@wollybeard/kit'
import * as Ansis from 'ansis'
import consola from 'consola'
import { Console, Effect, Option } from 'effect'
import { $ } from 'zx'

// Define all the options and arguments exactly matching the original
const nameArg = Args.text({ name: 'name' }).pipe(
  Args.optional,
  Args.withDescription(
    'The name of your project. Used by the package name and the default path. Defaults to a random name.',
  ),
)

const pathArg = Args.text({ name: 'path' }).pipe(
  Args.optional,
  Args.withDescription(
    'The path to a directory to create your project. Must point to an empty or non-existing directory. Defaults to a new directory named after your project in your cwd (current working directory).',
  ),
)

const link = Options.boolean('link').pipe(
  Options.withDefault(false),
  Options.withDescription(
    'When installing polen, do so as a link. You must have Polen globally linked on your machine.',
  ),
)

const version = Options.text('version').pipe(
  Options.optional,
  Options.withDescription('Version of Polen to use. Defaults to latest release. Ignored if --link is used.'),
)

const example = Options.choice('example', ['hive']).pipe(
  Options.withDefault('hive' as const),
  Options.withDescription('The example to use to scaffold your project.'),
)

const getProjectRoot = async (args: { name?: string; path?: string }): Promise<string> => {
  if (args.path) {
    if (await Api.Project.validateProjectDirectory(args.path, { mustExist: false, mustBeEmpty: true })) {
      return args.path
    }
    throw new Error('Invalid project directory')
  }

  const name = Str.Case.kebab(args.name ?? Name.generate())

  const findUsableName = async (isRetry?: true): Promise<string> => {
    const projectRoot = Path.join(process.cwd(), name + (isRetry ? `-${Date.now().toString(36).substring(2, 8)}` : ''))
    const stat = await Fs.stat(projectRoot)
    if (Fs.isNotFoundError(stat)) return projectRoot
    if (stat.isDirectory() && await Fs.isEmptyDir(projectRoot)) return projectRoot
    return await findUsableName(true)
  }

  return await findUsableName()
}

const copyGitRepositoryTemplate = async (input: {
  repository: {
    url: URL
    templatePath: string
  }
  destinationPath: string
  exampleName: string
}): Promise<void> => {
  try {
    const tmpDirPath = await Fs.makeTemporaryDirectory()
    const cleanup = async () => await Fs.remove(tmpDirPath)

    try {
      // Clone only the specific example directory using sparse checkout
      await $({
        quiet: true,
      })`git clone --depth 1 --filter=blob:none --sparse ${input.repository.url.href} ${tmpDirPath}`
      await $`cd ${tmpDirPath} && git sparse-checkout set ${input.repository.templatePath}`

      const templatePath = Path.join(tmpDirPath, input.repository.templatePath)

      // Verify the example exists
      if (!await Fs.exists(templatePath)) {
        consola.error(
          `Example "${input.exampleName}" not found in the Polen repository. Are you using the latest version of the CLI?`,
        )
        await cleanup()
        throw new Error(`Example not found`)
      }

      await Fs.copyDir({
        from: templatePath,
        to: input.destinationPath,
      })
    } finally {
      await cleanup()
    }
  } catch (error) {
    consola.error(`Failed to scaffold example`)
    Err.log(Err.ensure(error))
    throw error
  }
}

export const create = Command.make(
  'create',
  {
    name: nameArg,
    path: pathArg,
    link,
    version,
    example,
  },
  ({ name, path, link, version, example }) =>
    Effect.gen(function*() {
      const finalName = Str.Case.kebab(Option.getOrUndefined(name) ?? Name.generate())
      const nameValue = Option.getOrUndefined(name)
      const pathValue = Option.getOrUndefined(path)
      const projectRoot = yield* Effect.promise(() =>
        getProjectRoot({
          ...(nameValue && { name: nameValue }),
          ...(pathValue && { path: pathValue }),
        })
      )
      const project$ = $({ cwd: projectRoot })

      console.log('')
      consola.info(`Creating your Polen project "${Ansis.green(Str.Case.title(finalName))}"`)

      consola.info(`Initializing with example "${Ansis.green(Str.Case.title(example))}"`)
      yield* Effect.promise(() =>
        copyGitRepositoryTemplate({
          repository: {
            url: new URL('https://github.com/the-guild-org/polen'),
            templatePath: Path.join('examples', example),
          },
          destinationPath: projectRoot,
          exampleName: example,
        })
      )

      yield* Effect.promise(() =>
        Manifest.resource.update((manifest) => {
          manifest.name = finalName
          manifest.description = 'A new project'
          manifest.packageManager = 'pnpm@10.11.0'
          if (manifest.dependencies) {
            delete manifest.dependencies['polen'] // Repo uses links, we will install polen next.
          }
        }, projectRoot)
      )

      if (link) {
        yield* Effect.promise(() => project$`pnpm link polen`)
      } else {
        const versionStr = Option.getOrUndefined(version)
        const fqpn = `polen${versionStr ? `@${versionStr}` : ''}`
        consola.info(`Installing ${Ansis.magenta(fqpn)}`)
        yield* Effect.promise(() => project$`pnpm add ${fqpn}`)
      }

      consola.success('Your project is ready! Get Started:')
      console.log('')
      console.log(Ansis.magenta(`  cd ${Path.relative(process.cwd(), projectRoot)} && pnpm dev`))
    }),
)
