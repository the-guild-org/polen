import { Api } from '#api/$'
import { O } from '#dep/effect'
import { Args, Command, Options } from '@effect/cli'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { FileSystem } from '@effect/platform/FileSystem'
import { Err, Manifest, Name, Path, Str } from '@wollybeard/kit'
import * as Ansis from 'ansis'
import consola from 'consola'
import { Effect } from 'effect'
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
    const isValid = await Effect.runPromise(
      Api.Project.validateProjectDirectory(args.path, { mustExist: false, mustBeEmpty: true }).pipe(
        Effect.provide(NodeFileSystem.layer),
      ),
    )
    if (isValid) {
      return args.path
    }
    throw new Error('Invalid project directory')
  }

  const name = Str.Case.kebab(args.name ?? Name.generate())

  const findUsableName = async (isRetry?: true): Promise<string> => {
    const projectRoot = Path.join(process.cwd(), name + (isRetry ? `-${Date.now().toString(36).substring(2, 8)}` : ''))
    const result = await Effect.runPromise(
      Effect.gen(function*() {
        const fs = yield* FileSystem
        const statResult = yield* Effect.either(fs.stat(projectRoot))
        if (statResult._tag === 'Left') return { notFound: true }
        const stat = statResult.right
        if (stat.type === 'Directory') {
          const files = yield* fs.readDirectory(projectRoot)
          return { notFound: false, isEmptyDir: files.length === 0 }
        }
        return { notFound: false, isEmptyDir: false }
      }).pipe(Effect.provide(NodeFileSystem.layer)),
    )
    if (result.notFound) return projectRoot
    if (result.isEmptyDir) return projectRoot
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
    const tmpDirPath = await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function*() {
          const fs = yield* FileSystem
          return yield* fs.makeTempDirectoryScoped()
        }),
      ).pipe(Effect.provide(NodeFileSystem.layer)),
    )
    const cleanup = async () =>
      await Effect.runPromise(
        Effect.gen(function*() {
          const fs = yield* FileSystem
          yield* fs.remove(tmpDirPath, { recursive: true })
        }).pipe(Effect.provide(NodeFileSystem.layer)),
      )

    try {
      // Clone only the specific example directory using sparse checkout
      await $({
        quiet: true,
      })`git clone --depth 1 --filter=blob:none --sparse ${input.repository.url.href} ${tmpDirPath}`
      await $`cd ${tmpDirPath} && git sparse-checkout set ${input.repository.templatePath}`

      const templatePath = Path.join(tmpDirPath, input.repository.templatePath)

      // Verify the example exists
      const exists = await Effect.runPromise(
        Effect.gen(function*() {
          const fs = yield* FileSystem
          const result = yield* Effect.either(fs.stat(templatePath))
          return result._tag === 'Right'
        }).pipe(Effect.provide(NodeFileSystem.layer)),
      )
      if (!exists) {
        consola.error(
          `Example "${input.exampleName}" not found in the Polen repository. Are you using the latest version of the CLI?`,
        )
        await cleanup()
        throw new Error(`Example not found`)
      }

      await Effect.runPromise(
        Effect.gen(function*() {
          const fs = yield* FileSystem
          yield* fs.copy(templatePath, input.destinationPath)
        }).pipe(Effect.provide(NodeFileSystem.layer)),
      )
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
      const finalName = Str.Case.kebab(O.getOrUndefined(name) ?? Name.generate())
      const nameValue = O.getOrUndefined(name)
      const pathValue = O.getOrUndefined(path)
      const projectRoot = yield* Effect.tryPromise({
        try: () =>
          getProjectRoot({
            ...(nameValue && { name: nameValue }),
            ...(pathValue && { path: pathValue }),
          }),
        catch: (error) => new Error(`Failed to get project root: ${String(error)}`),
      })
      const project$ = $({ cwd: projectRoot })

      console.log('')
      consola.info(`Creating your Polen project "${Ansis.green(Str.Case.title(finalName))}"`)

      consola.info(`Initializing with example "${Ansis.green(Str.Case.title(example))}"`)
      yield* Effect.tryPromise({
        try: () =>
          copyGitRepositoryTemplate({
            repository: {
              url: new URL('https://github.com/the-guild-org/polen'),
              templatePath: Path.join('examples', example),
            },
            destinationPath: projectRoot,
            exampleName: example,
          }),
        catch: (error) => new Error(`Failed to copy template: ${String(error)}`),
      })

      yield* Effect.gen(function*() {
        const manifest = yield* Manifest.resource.readOrEmpty(projectRoot)
        manifest.name = finalName
        manifest.description = 'A new project'
        manifest.packageManager = 'pnpm@10.11.0'
        if (manifest.dependencies) {
          delete manifest.dependencies['polen'] // Repo uses links, we will install polen next.
        }
        yield* Manifest.resource.write(manifest, projectRoot)
      }).pipe(Effect.provide(NodeFileSystem.layer))

      if (link) {
        yield* Effect.tryPromise({
          try: () => project$`pnpm link polen`,
          catch: (error) => new Error(`Failed to link polen: ${String(error)}`),
        })
      } else {
        const versionStr = O.getOrUndefined(version)
        const fqpn = `polen${versionStr ? `@${versionStr}` : ''}`
        consola.info(`Installing ${Ansis.magenta(fqpn)}`)
        yield* Effect.tryPromise({
          try: () => project$`pnpm add ${fqpn}`,
          catch: (error) => new Error(`Failed to install ${fqpn}: ${String(error)}`),
        })
      }

      consola.success('Your project is ready! Get Started:')
      console.log('')
      console.log(Ansis.magenta(`  cd ${Path.relative(process.cwd(), projectRoot)} && pnpm dev`))
    }).pipe(Effect.provide(NodeFileSystem.layer)),
)
