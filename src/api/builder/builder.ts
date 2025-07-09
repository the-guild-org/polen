import { ConfigResolver } from '#api/config-resolver/index'
import { Config } from '#api/config/index'
import { Vite } from '#dep/vite/index'
import { Fs } from '@wollybeard/kit'
import consola from 'consola'

const buildDefaults = {
  debug: false,
  architecture: Config.BuildArchitecture.enum.ssg,
}

interface BuildConfigInput {
  debug?: boolean
  architecture?: Config.BuildArchitecture
  base?: string
}

export const build = async (buildConfigInput: BuildConfigInput) => {
  const buildConfig = { ...buildDefaults, ...buildConfigInput }

  const viteUserConfig = await ConfigResolver.fromFile({
    dir: process.cwd(),
    overrides: {
      build: {
        architecture: buildConfig.architecture,
        ...(buildConfig.base ? { base: buildConfig.base } : {}),
      },
      advanced: {
        debug: buildConfig.debug,
      },
    },
  })

  const builder = await Vite.createBuilder({
    ...viteUserConfig,
    mode: 'production',
    builder: {}, // Enable builder mode for RSC plugin
  })
  await builder.buildApp()

  if (buildConfig.architecture === `ssg`) {
    consola.info(`Generating static site...`)
    // SSG is now handled by the RSC SSG plugin during the build process
    // The plugin generates HTML files directly to the dist directory
    consola.success(`Done`)
    consola.info(`try it: npx serve ${viteUserConfig._polen.paths.project.relative.build.root} -p 4000`)
  } else if (buildConfig.architecture === `ssr`) {
    // For SSR, we need to create a server entry point that loads the SSR handler
    const ssrServerCode = `
import { createServer } from 'http'
import handler from './ssr/index.js'

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, \`http://\${req.headers.host}\`)
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
    })
    
    const response = await handler(request)
    
    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    
    const body = await response.text()
    res.end(body)
  } catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

const port = process.env.PORT || 3001
server.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`)
})
`
    await Fs.write({
      path: viteUserConfig._polen.paths.project.absolute.build.serverEntrypoint,
      content: ssrServerCode,
    })
    consola.info(`try it: node ${viteUserConfig._polen.paths.project.relative.build.root}/app.js`)
    consola.info(`Then visit http://localhost:3001`)
  }
}
