import { Command, Options } from '@effect/cli'
import { Effect } from 'effect'
import { ViteController } from '../../lib/vite-controller/_namespace'
import { Vite } from '../../lib/vite/_namespace'
import { createServer as createViteServer } from 'vite'
import http from 'node:http'
import { H3 } from '../../lib/h3/_namespace'
import { Server } from '../../lib/server/_namespace'

const options = {
  schema: Options.text(`schema`).pipe(
    Options.withDescription(`Path to GraphQL schema file`),
    Options.withAlias(`s`),
    Options.withDefault(`./schema.graphql`),
  ),
  // ssr: Options.boolean(`ssr`).pipe(
  //   Options.withDescription(`Enable server-side rendering`),
  //   Options.withDefault(true),
  // ),
}

export const devCommand = Command.make(
  `dev`,
  options,
  ({ schema: _schema }) =>
    Effect.gen(function*() {
      // todo: withDefault(true) above does not work.
      const ssr = true
      // console.log(ssr)
      // eslint-disable-next-line
      if (ssr) {
        const config = yield* Effect.tryPromise(() => ViteController.createDevConfig({ ssr }))

        const viteServer = yield* Effect.tryPromise(() => createViteServer(config))

        const h3Server = yield* Effect.tryPromise(() => Server.createServer(viteServer))

        // Start the server
        const nodeServer = yield* Effect.sync(() => {
          const listener = H3.toNodeListener(h3Server)
          const httpServer = http.createServer(listener)
          httpServer.listen(viteServer.config.server.port, () => {
            console.log(
              `  ➜  Server running at: http://localhost:${viteServer.config.server.port.toString()}/`,
            )
          })
          return httpServer
        })

        // Handle cleanup when the process is terminated
        const cleanupEffect = Effect.acquireRelease(
          Effect.sync(() => ({
            nodeServer,
          })),
          resources =>
            Effect.sync(() => {
              resources.nodeServer.close()
              console.log(`SSR dev server closed`)
            }),
        )

        // Run with scope management
        const effect = cleanupEffect.pipe(
          Effect.flatMap(() => Effect.never),
          Effect.scoped,
        )

        yield* effect
      } else {
        // Standard dev mode without SSR
        const config = yield* Effect.tryPromise(() => ViteController.createDevConfig({ ssr }))

        const server = yield* Effect.tryPromise(() =>
          Vite
            .createServer(config)
            .then(server => server.listen())
        )

        server.printUrls()

        // Keep the process running
        yield* Effect.never
      }
    }),
)
