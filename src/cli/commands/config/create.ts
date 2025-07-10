import { Fs, Path } from '@wollybeard/kit'
import consola from 'consola'

const CONFIG_FILENAME = 'polen.config.ts'
const CONFIG_CONTENT = `import { Polen } from 'polen'

export default Polen.defineConfig({
  // Your configuration options
})
`

// Check if config file already exists
const configPath = Path.join(process.cwd(), CONFIG_FILENAME)
const exists = await Fs.exists(configPath)

if (exists) {
  consola.info(`Polen configuration file already exists at ${CONFIG_FILENAME}`)
  process.exit(0)
}

// Create the config file
try {
  await Fs.writeFile(configPath, CONFIG_CONTENT)
  consola.success(`Created Polen configuration file at ${CONFIG_FILENAME}`)
} catch (error) {
  consola.error(`Failed to create configuration file:`, error)
  process.exit(1)
}
