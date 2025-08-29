/**
 * Worker that runs a Polen server for SSG.
 * This is executed in a child process using Effect Worker API.
 */
import { debugPolen } from '#singletons/debug'
import { WorkerRunner } from '@effect/platform'
import { NodeRuntime, NodeWorkerRunner } from '@effect/platform-node'
import { Duration, Effect, Layer, Scope } from 'effect'
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { ServerMessage } from './worker-messages.js'

const debug = debugPolen.sub(`api:ssg:server-runner`)

// Store the server process for cleanup
let serverProcess: ChildProcess | null = null

// ============================================================================
// Handlers
// ============================================================================

const handlers = {
  StartServer: ({ serverPath, port }: { serverPath: string; port: number }) =>
    Effect.gen(function*() {
      // If there's already a server running, stop it first
      if (serverProcess) {
        serverProcess.kill('SIGTERM')
        yield* Effect.sleep(Duration.millis(500))
        if (!serverProcess.killed) {
          serverProcess.kill('SIGKILL')
        }
        serverProcess = null
      }

      // Start the server process
      const startServer = Effect.sync((): ChildProcess => {
        debug(`Starting server with command: node ${serverPath}`)

        serverProcess = spawn('node', [serverPath], {
          env: {
            ...process.env,
            PORT: port.toString(),
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        })

        serverProcess.stdout?.on('data', (data) => {
          debug(`[Server ${port}] stdout`, data.toString().trim())
        })

        serverProcess.stderr?.on('data', (data) => {
          debug(`[Server ${port}] stderr`, data.toString().trim())
        })

        return serverProcess
      })

      const proc: ChildProcess = yield* startServer

      // Wait for server to be ready with proper interruption support
      const waitForReady = Effect.async<void>((resume) => {
        // Handle process errors
        const errorHandler = (error: Error) => {
          resume(Effect.die(new Error(`Server failed to start on port ${port}: ${error.message}`)))
        }

        // Handle process exit
        const exitHandler = (code: number | null, signal: NodeJS.Signals | null) => {
          if (code !== 0 && code !== null) {
            resume(Effect.die(new Error(`Server exited with code ${code} (signal: ${signal})`)))
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
              debug(`[Server ${port}] Ready!`)
              if (checkInterval) clearInterval(checkInterval)
              proc.removeListener('error', errorHandler)
              proc.removeListener('exit', exitHandler)
              resume(Effect.succeed(undefined))
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
        return Effect.sync(() => {
          if (checkInterval) {
            clearInterval(checkInterval)
          }
          proc.removeListener('error', errorHandler)
          proc.removeListener('exit', exitHandler)
        })
      })

      // Apply timeout with proper Effect interruption
      yield* waitForReady.pipe(
        Effect.timeout(Duration.seconds(30)),
        Effect.catchTag('TimeoutException', () =>
          Effect.die(new Error(`Server on port ${port} failed to start within 30 seconds`))),
      )

      // Add finalizer to ensure cleanup
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          debug(`Finalizer: Stopping server on port ${port}`)
          if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGTERM')
            // Try to kill forcefully after a brief wait
            setTimeout(() => {
              if (serverProcess && !serverProcess.killed) {
                serverProcess.kill('SIGKILL')
              }
              serverProcess = null
            }, 100)
          }
        })
      )
    }).pipe(Effect.scoped),
  StopServer: () =>
    Effect.gen(function*() {
      if (serverProcess) {
        serverProcess.kill('SIGTERM')
        // Give it time to shut down gracefully
        yield* Effect.sleep(Duration.millis(500))
        if (!serverProcess.killed) {
          serverProcess.kill('SIGKILL')
        }
        serverProcess = null
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
