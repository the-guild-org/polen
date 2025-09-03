import { Api } from '#api/$'
import { allowGlobalParameter, projectParameter } from '#cli/_/parameters'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { Command } from '@molt/command'
import { Fs, Path } from '@wollybeard/kit'
import consola from 'consola'

const args = Command.create()
  .parameter(
    `--project -p`,
    projectParameter,
  )
  .parameter(`--allow-global`, allowGlobalParameter)
  .parse()

const dir = ensureOptionalAbsoluteWithCwd(args.project)

if (!await Api.Project.validateProjectDirectory(dir)) {
  process.exit(1)
}

const fileName = 'polen.config.ts'
const fileContent = `import { Polen } from 'polen'

export default Polen.defineConfig({
  // Your configuration options
})
`

const filePath = Path.join(dir, fileName)

const exists = await Fs.exists(filePath)
if (exists) {
  consola.info(`Polen configuration file already exists at ${fileName}`)
  process.exit(0)
}

await Fs.write({
  path: filePath,
  content: fileContent,
})

consola.success(`Created Polen configuration file at ${fileName}`)
