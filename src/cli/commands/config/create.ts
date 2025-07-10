import { Fs, Path } from '@wollybeard/kit'
import consola from 'consola'

const fileName = 'polen.config.ts'
const fileContent = `import { Polen } from 'polen'

export default Polen.defineConfig({
  // Your configuration options
})
`

const filePath = Path.join(process.cwd(), fileName)

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
