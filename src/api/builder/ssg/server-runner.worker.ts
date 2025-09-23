/**
 * Worker that runs a Polen server for SSG.
 * This is executed in a child process using Effect Worker API.
 */
import { Ef } from '#dep/effect'
import { WorkerRunner } from '@effect/platform'
import { NodeRuntime, NodeWorkerRunner } from '@effect/platform-node'
import { Duration, Layer, Ref } from 'effect'
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { ServerMessage } from './worker-messages.js'

// Store the server process reference for cleanup
const serverProcessRef = Ref.unsafeMake<ChildProcess | null>(null)

// ============================================================================
// Handlers
// ============================================================================

const handlers = {
  StartServer: ({ serverPath, port }: { serverPath: string; port: number }) =>
    Ef.gen(function*() {
      // If there's already a server running, stop it first
      const existingProcess = yield* Ref.get(serverProcessRef)
      if (existingProcess) {
        existingProcess.kill('SIGTERM')
        yield* Ef.sleep(Duration.millis(500))
        if (!existingProcess.killed) {
          existingProcess.kill('SIGKILL')
        }
        yield* Ref.set(serverProcessRef, null)
      }

      // Start the server process
      yield* Ef.logDebug(`Starting server with command: node ${serverPath}`)

      const proc = yield* Ef.sync(() => {
        const serverProc = spawn('node', [serverPath], {
          env: {
            ...process.env,
            PORT: port.toString(),
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        })

        // Log server output
        serverProc.stdout?.on('data', (data) => {
          Ef.logDebug(`[Server ${port}] stdout: ${data.toString().trim()}`).pipe(
            Ef.runSync,
          )
        })

        serverProc.stderr?.on('data', (data) => {
          Ef.logDebug(`[Server ${port}] stderr: ${data.toString().trim()}`).pipe(
            Ef.runSync,
          )
        })

        return serverProc
      })

      yield* Ref.set(serverProcessRef, proc)

      // Wait for server to be ready with proper interruption support
      const waitForReady = Ef.async<void>((resume) => {
        // Handle process errors
        const errorHandler = (error: Error) => {
          resume(Ef.die(new Error(`Server failed to start on port ${port}: ${error.message}`)))
        }

        // Handle process exit
        const exitHandler = (code: number | null, signal: NodeJS.Signals | null) => {
          if (code !== 0 && code !== null) {
            resume(Ef.die(new Error(`Server exited with code ${code} (signal: ${signal})`)))
          }
        }

        proc.on('error', errorHandler)
        proc.on('exit', exitHandler)

        // Check if server is ready by polling
        let checkInterval: NodeJS.Timeout | null = null
        const checkServer = async () => {
          try {
            const response = await fetch(`http://localhost:${port}/`)
            if (response.ok || response.status === 404) {
              Ef.logDebug(`[Server ${port}] Ready!`).pipe(Ef.runSync)
              if (checkInterval) clearInterval(checkInterval)
              proc.removeListener('error', errorHandler)
              proc.removeListener('exit', exitHandler)
              resume(Ef.succeed(undefined))
            }
          } catch (error) {
            // Server not ready yet, will retry on next interval
          }
        }

        // Start polling after initial delay
        setTimeout(() => {
          checkServer() // First check
          checkInterval = setInterval(checkServer, 100)
        }, 500)

        // Return cleanup function for interruption
        return Ef.sync(() => {
          if (checkInterval) {
            clearInterval(checkInterval)
          }
          proc.removeListener('error', errorHandler)
          proc.removeListener('exit', exitHandler)
        })
      })

      // Apply timeout with proper Effect interruption
      yield* waitForReady.pipe(
        Ef.timeout(Duration.seconds(30)),
        Ef.catchTag('TimeoutException', () =>
          Ef.die(new Error(`Server on port ${port} failed to start within 30 seconds`))),
      )

      yield* Ef.logDebug(`Server on port ${port} started successfully`)
    }),
  StopServer: ({ port }: { port?: number | undefined }) =>
    Ef.gen(function*() {
      const serverProc = yield* Ref.get(serverProcessRef)
      if (serverProc) {
        if (port !== undefined) {
          yield* Ef.logDebug(`Stopping server on port ${port}`)
        }
        serverProc.kill('SIGTERM')
        // Give it time to shut down gracefully
        yield* Ef.sleep(Duration.millis(500))
        if (!serverProc.killed) {
          serverProc.kill('SIGKILL')
        }
        yield* Ref.set(serverProcessRef, null)
        if (port !== undefined) {
          yield* Ef.logDebug(`Server on port ${port} stopped`)
        }
      }
    }),
}

// ============================================================================
// Worker Runner
// ============================================================================

// Run the worker
WorkerRunner.launch(
  Layer.provide(
    WorkerRunner.layerSerialized(ServerMessage, handlers),
    NodeWorkerRunner.layer,
  ),
).pipe(NodeRuntime.runMain)
