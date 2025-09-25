import { Api } from '#api/$'
import { Op, S } from '#dep/effect'
import { Ef } from '#dep/effect'
import { Args, Command, Options } from '@effect/cli'
import * as NodeCmdExecutor from '@effect/platform-node/NodeCommandExecutor'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import * as Cmd from '@effect/platform/Command'
import * as CmdExecutor from '@effect/platform/CommandExecutor'
import { FileSystem } from '@effect/platform/FileSystem'
import { Err, Fs, Manifest, Name, Str } from '@wollybeard/kit'
import { FsLoc } from '@wollybeard/kit'
import * as Ansis from 'ansis'
import consola from 'consola'

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

const getProjectRoot = async (args: { name?: string; path?: string }): Promise<FsLoc.AbsDir> => {
  if (args.path) {
    const pathLoc = S.decodeSync(FsLoc.AbsDir.String)(args.path)
    const isValid = await Ef.runPromise(
      Api.Project.validateProjectDirectory(pathLoc, { mustExist: false, mustBeEmpty: true }).pipe(
        Ef.provide(NodeFileSystem.layer),
      ),
    )
    if (isValid) {
      return pathLoc
    }
    throw new Error('Invalid project directory')
  }

  const name = Str.Case.kebab(args.name ?? Name.generate())

  const findUsableName = async (isRetry?: true): Promise<FsLoc.AbsDir> => {
    const cwd = S.decodeSync(FsLoc.AbsDir.String)(process.cwd())
    const projectRoot = FsLoc.join(
      cwd,
      S.decodeSync(FsLoc.RelDir.String)(name + (isRetry ? `-${Date.now().toString(36).substring(2, 8)}` : '')),
    )
    const result = await Ef.runPromise(
      Ef.gen(function*() {
        const statResult = yield* Ef.either(Fs.stat(projectRoot))
        if (statResult._tag === 'Left') return { notFound: true }
        const stat = statResult.right
        if (stat.type === 'Directory') {
          const files = yield* Fs.read(projectRoot)
          return { notFound: false, isEmptyDir: files.length === 0 }
        }
        return { notFound: false, isEmptyDir: false }
      }).pipe(Ef.provide(NodeFileSystem.layer)),
    )
    if (result.notFound) return projectRoot
    if (result.isEmptyDir) return projectRoot
    return await findUsableName(true)
  }

  return await findUsableName()
}

const copyGitRepositoryTemplate = (input: {
  repository: {
    url: URL
    templatePath: string
  }
  destinationPath: FsLoc.AbsDir
  exampleName: string
}): Ef.Effect<void, Error, CmdExecutor.CommandExecutor | FileSystem> =>
  Ef.scoped(
    Ef.gen(function*() {
      const tmpDirPath = yield* Fs.makeTempDirectoryScoped()

      // Clone only the specific example directory using sparse checkout
      const gitClone = Cmd.make(
        'git',
        'clone',
        '--depth',
        '1',
        '--filter=blob:none',
        '--sparse',
        input.repository.url.href,
        FsLoc.encodeSync(tmpDirPath),
      )

      yield* CmdExecutor.CommandExecutor.pipe(
        Ef.flatMap(executor =>
          executor.exitCode(gitClone).pipe(
            Ef.flatMap(exitCode =>
              exitCode === 0
                ? Ef.succeed(undefined)
                : Ef.fail(new Error(`Git clone failed with exit code ${exitCode}`))
            ),
          )
        ),
      )

      // Set sparse-checkout
      const gitSparseCheckout = Cmd.make('git', 'sparse-checkout', 'set', input.repository.templatePath).pipe(
        Cmd.workingDirectory(FsLoc.encodeSync(tmpDirPath)),
      )

      yield* CmdExecutor.CommandExecutor.pipe(
        Ef.flatMap(executor =>
          executor.exitCode(gitSparseCheckout).pipe(
            Ef.flatMap(exitCode =>
              exitCode === 0
                ? Ef.succeed(undefined)
                : Ef.fail(new Error(`Git sparse-checkout failed with exit code ${exitCode}`))
            ),
          )
        ),
      )

      const templateRelPath = S.decodeSync(FsLoc.RelDir.String)(input.repository.templatePath)
      const templatePath = FsLoc.join(tmpDirPath, templateRelPath)

      // Verify the example exists
      const exists = yield* Ef.gen(function*() {
        const result = yield* Ef.either(Fs.stat(templatePath))
        return result._tag === 'Right'
      })

      if (!exists) {
        yield* Ef.sync(() => {
          consola.error(
            `Example "${input.exampleName}" not found in the Polen repository. Are you using the latest version of the CLI?`,
          )
        })
        yield* Ef.fail(new Error(`Example not found`))
      }

      yield* Fs.copy(templatePath, input.destinationPath)
    }).pipe(
      Ef.catchAll((error) =>
        Ef.gen(function*() {
          yield* Ef.sync(() => {
            consola.error(`Failed to scaffold example`)
            Err.log(Err.ensure(error))
          })
          yield* Ef.fail(error)
        })
      ),
    ),
  )

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
    Ef.gen(function*() {
      const finalName = Str.Case.kebab(Op.getOrUndefined(name) ?? Name.generate())
      const nameValue = Op.getOrUndefined(name)
      const pathValue = Op.getOrUndefined(path)
      const projectRoot = yield* Ef.tryPromise({
        try: () =>
          getProjectRoot({
            ...(nameValue && { name: nameValue }),
            ...(pathValue && { path: pathValue }),
          }),
        catch: (error) => new Error(`Failed to get project root: ${String(error)}`),
      })

      console.log('')
      consola.info(`Creating your Polen project "${Ansis.green(Str.Case.title(finalName))}"`)

      consola.info(`Initializing with example "${Ansis.green(Str.Case.title(example))}"`)
      yield* copyGitRepositoryTemplate({
        repository: {
          url: new URL('https://github.com/the-guild-org/polen'),
          templatePath: `examples/${example}`,
        },
        destinationPath: projectRoot,
        exampleName: example,
      })

      yield* Ef.gen(function*() {
        const manifest = yield* Manifest.resource.readOrEmpty(projectRoot)
        const mutable = manifest.toMutable()
        mutable.name = finalName
        mutable.description = 'A new project'
        mutable.packageManager = 'pnpm@10.11.0'
        if (mutable.dependencies) {
          delete mutable.dependencies['polen'] // Repo uses links, we will install polen next.
        }
        yield* Manifest.resource.write(Manifest.make(mutable), projectRoot)
      }).pipe(Ef.provide(NodeFileSystem.layer))

      if (link) {
        const linkCommand = Cmd.make('pnpm', 'link', 'polen').pipe(
          Cmd.workingDirectory(FsLoc.encodeSync(projectRoot)),
        )

        yield* CmdExecutor.CommandExecutor.pipe(
          Ef.flatMap(executor =>
            executor.exitCode(linkCommand).pipe(
              Ef.flatMap(exitCode =>
                exitCode === 0
                  ? Ef.succeed(undefined)
                  : Ef.fail(new Error(`Failed to link polen: pnpm link exited with code ${exitCode}`))
              ),
            )
          ),
        )
      } else {
        const versionStr = Op.getOrUndefined(version)
        const fqpn = `polen${versionStr ? `@${versionStr}` : ''}`
        consola.info(`Installing ${Ansis.magenta(fqpn)}`)

        const addCommand = Cmd.make('pnpm', 'add', fqpn).pipe(
          Cmd.workingDirectory(FsLoc.encodeSync(projectRoot)),
        )

        yield* CmdExecutor.CommandExecutor.pipe(
          Ef.flatMap(executor =>
            executor.exitCode(addCommand).pipe(
              Ef.flatMap(exitCode =>
                exitCode === 0
                  ? Ef.succeed(undefined)
                  : Ef.fail(new Error(`Failed to install ${fqpn}: pnpm add exited with code ${exitCode}`))
              ),
            )
          ),
        )
      }

      consola.success('Your project is ready! Get Started:')
      console.log('')
      const cwdLoc = S.decodeSync(FsLoc.AbsDir.String)(process.cwd())
      const relPath = FsLoc.toRel(cwdLoc, projectRoot)
      console.log(Ansis.magenta(`  cd ${FsLoc.encodeSync(relPath)} && pnpm dev`))
    }).pipe(
      Ef.provide(NodeFileSystem.layer),
      Ef.provide(NodeCmdExecutor.layer),
    ),
)
