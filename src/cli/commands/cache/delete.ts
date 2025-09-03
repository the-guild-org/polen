import { Api } from '#api/$'
import { allowGlobalParameter, projectParameter } from '#cli/_/parameters'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { Command } from '@molt/command'
import consola from 'consola'

const args = Command.create()
  .parameter(
    `--project -p`,
    projectParameter,
  )
  .parameter(`--allow-global`, allowGlobalParameter)
  .settings({
    parameters: {
      environment: {
        $default: {
          prefix: `POLEN_CACHE_`,
          enabled: false,
        },
      },
    },
  })
  .parse()

const dir = ensureOptionalAbsoluteWithCwd(args.project)

await Api.Cache.deleteAll(dir)
consola.success(`Polen caches deleted`)
