import { Command } from '@molt/command'
import { Fs, Manifest, Name, Path, Str } from '@wollybeard/kit'
import consola from 'consola'
import { z } from 'zod'
import { $ } from 'zx'

const Examples = z.enum([`github`, `pokemon`])

const args = Command
  .create()
  .parameter(`name`, z.string().default(() => Name.generate()).describe(`Defaults to a random name.`))
  .parameter(
    `link`,
    z.boolean().default(false).describe(
      `When installing polen, do so as a link. You must have Polen globally linked on your machine.`,
    ),
  )
  .parameter(`example`, Examples.default(`pokemon`).describe(`The example to use to scaffold your project.`))
  .parse()

const cwd = process.cwd()
const isCwdEmpty = await Fs.isEmptyDir(cwd)
const name = Str.Case.kebab(args.name)
const projectRoot = isCwdEmpty ? cwd : Path.join(cwd, name)

if (!isCwdEmpty) {
  const isProjectRootExists = await Fs.exists(projectRoot)
  const isEmpty = isProjectRootExists && await Fs.isEmptyDir(projectRoot)
  if (isProjectRootExists && !isEmpty) {
    consola.error(`Project root of name "${name}" already exists`)
    process.exit(1)
  }
  consola.info(`creating your project in ./${name}`)
} else {
  consola.info(`Current working directory is empty, creating your project here`)
}

// Scaffold Example

// Pull an example from the Polen repository
// Copy all the files to the project root
const repository = `https://github.com/the-guild-org/polen`
const repoExampleDir = `examples/${args.example}`

consola.info(`Scaffolding "${args.example}" example...`)

try {
  // Create temporary directory
  const { stdout: tmpDir } = await $`mktemp -d`
  const tmpDirPath = tmpDir.trim()

  try {
    // Clone only the specific example directory using sparse checkout
    await $({ quiet: true })`git clone --depth 1 --filter=blob:none --sparse ${repository} ${tmpDirPath}`
    await $`cd ${tmpDirPath} && git sparse-checkout set ${repoExampleDir}`

    const sourceExamplePath = Path.join(tmpDirPath, repoExampleDir)

    // Verify the example exists
    if (!await Fs.exists(sourceExamplePath)) {
      throw new Error(`Example "${args.example}" not found in the repository`)
    }

    // Create project root directory if needed
    await $`mkdir -p ${projectRoot}`

    // Copy files excluding build artifacts and dependencies using rsync
    await $`rsync -av --exclude="node_modules/" --exclude="dist/" --exclude=".bundle-explorer/" --exclude="pnpm-lock.yaml" ${sourceExamplePath}/ ${projectRoot}/`

    consola.success(`Done`)

    if (!isCwdEmpty) {
      consola.success(`Your project is ready! Get Started:`)
    }
  } finally {
    // Clean up temporary directory
    await $`rm -rf ${tmpDirPath}`
  }
} catch (error) {
  consola.error(`Failed to scaffold example: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

// End Scaffold Example
// --------------------

await Manifest.resource.update((manifest) => {
  manifest.name = name
  manifest.description = `A new project`
  manifest.packageManager = `pnpm@10.11.0`
}, projectRoot)

if (args.link) {
  await $`pnpm link polen`
}

console.log(``)
console.log(`    cd ./${Path.relative(cwd, projectRoot)} && pnpm dev`)
