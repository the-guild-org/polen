// Take the given URL and run dev over it
// e.g. polen open https://api.graphql-hive.com/graphql

import { Vite } from '#dep/vite/index.js'
import { Grafaid } from '#lib/grafaid/index.js'
import { Command } from '@molt/command'
import { Graffle } from 'graffle'
import { Introspection } from 'graffle/extensions/introspection'
import { z } from 'zod'
import { defineConfig } from '../../create-configuration.js'
import { Fs } from '@wollybeard/kit'

const args = Command
  .create()
  .parameter(`url`, z.string().url())
  .parse()

const graffle = Graffle
  .create()
  .use(Introspection())
  .transport({
    url: args.url,
  })

const introspectionResult = await graffle.introspect()
if (!introspectionResult) throw new Error(`Failed to introspect schema.`)

const schema = Grafaid.Schema.fromIntrospectionQuery(introspectionResult)

const config = await defineConfig({
  root: await Fs.makeTemporaryDirectory(),
  schema: {
    dataSources: {
      data: {
        versions: [
          {
            before: Grafaid.Schema.empty,
            after: schema,
            changes: [],
            date: new Date(),
          },
        ],
      },
    },
  },
})

const viteDevServer = await Vite.createServer(config)

await viteDevServer.listen()

viteDevServer.printUrls()
