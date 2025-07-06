/* eslint-disable */
// @ts-nocheck
import { Command } from '@molt/command'
import { Err, Fs, Manifest, Name, Path, Str } from '@wollybeard/kit'
import * as Ansis from 'ansis'
import consola from 'consola'
import { z } from 'zod'
import { $ } from 'zx'

const Examples = z.enum([`hive`])

const args = Command
  .create()
  .parameter(
    `name`,
    z.string().optional().describe(
      `The name of your project. Used by the package name and the default path. Defaults to a random name.`,
    ),
  )
  .parameter(
    `path`,
    z.string().optional().describe(
      `The path to a directory to create your project. Must point to an empty or non-existing directory. Defaults to a new directory named after your project in your cwd (current working directory).`,
    ),
  )
  .parameter(
    `link`,
    z.boolean().default(false).describe(
      `When installing polen, do so as a link. You must have Polen globally linked on your machine.`,
    ),
  )
  .parameter(
    `version`,
    z.string().optional().describe(`Version of Polen to use. Defaults to latest release. Ignored if --link is used.`),
  )
  .parameter(`example`, Examples.default(`hive`).describe(`The example to use to scaffold your project.`))
  .settings({
    parameters: {
      environment: {
        $default: {
          // todo prfix seting doesn't seem to work with Molt!
          prefix: `POLEN_CREATE_`,
          enabled: false,
        },
      },
    },
  })
  .parse()

const getProjectRoot = async (): Promise<string> => {
  if (args.path) {
    const stat = await Fs.stat(args.path)
    if (Fs.isNotFoundError(stat)) return args.path
    if (stat.isDirectory() && await Fs.isEmptyDir(args.path)) return args.path
    consola.error(`The given path ${args.path} already exists and is not an empty directory`)
    process.exit(1)
  }

  const findUsableName = async (isRetry?: true): Promise<string> => {
    const projectRoot = Path.join(process.cwd(), name + (isRetry ? `-${Date.now().toString(36).substring(2, 8)}` : ``))
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
          `Example "${args.example}" not found in the Polen repository. Are you using the latest version of the CLI?`,
        )
        await cleanup()
        process.exit(1)
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
    process.exit(1)
  }
}

// -- main

const name = Str.Case.kebab(args.name ?? Name.generate())
const projectRoot = await getProjectRoot()
const project$ = $({ cwd: projectRoot })

console.log(``)
consola.info(`Creating your Polen project "${Ansis.green(Str.Case.title(name))}"`)

consola.info(`Initializing with example "${Ansis.green(Str.Case.title(args.example))}"`)
await copyGitRepositoryTemplate({
  repository: {
    url: new URL(`https://github.com/the-guild-org/polen`),
    templatePath: Path.join(`examples`, args.example),
  },
  destinationPath: projectRoot,
})

await Manifest.resource.update((manifest) => {
  manifest.name = name
  manifest.description = `A new project`
  manifest.packageManager = `pnpm@10.11.0`
  delete manifest.dependencies.polen // Repo uses links, we will install polen next.
}, projectRoot)

if (args.link) {
  await project$`pnpm link polen`
} else {
  const fqpn = `polen${args.ver ? `@${args.ver}` : ''}`
  consola.info(`Installing ${Ansis.magenta(fqpn)}`)
  await project$`pnpm add ${fqpn}`
}

consola.success(`Your project is ready! Get Started:`)
console.log(``)
console.log(Ansis.magenta(`  cd ${Path.relative(process.cwd(), projectRoot)} && pnpm dev`))
