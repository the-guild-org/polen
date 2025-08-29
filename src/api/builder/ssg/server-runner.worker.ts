/**
 * Worker that runs a Polen server for SSG.
 * This is executed in a child process using Effect Worker API.
 */
import { debugPolen } from '#singletons/debug'
import { WorkerRunner } from '@effect/platform'
import { NodeRuntime, NodeWorkerRunner } from '@effect/platform-node'
import { Duration, Effect, Layer } from 'effect'
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

      yield* Effect.async<void, Error>((resume) => {
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

        serverProcess.on('error', (error) => {
          resume(Effect.die(new Error(`Server failed to start on port ${port}: ${error.message}`)))
        })

        serverProcess.on('exit', (code, signal) => {
          if (code !== 0 && code !== null) {
            resume(Effect.die(new Error(`Server exited with code ${code} (signal: ${signal})`)))
          }
        })

        // Check if server is ready by polling
        const checkServer = async () => {
          try {
            const response = await fetch(`http://localhost:${port}/`)
            if (response.ok || response.status === 404) {
              debug(`[Server ${port}] Ready!`)
              resume(Effect.succeed(undefined))
            } else {
              setTimeout(checkServer, 100)
            }
          } catch (error) {
            // Server not ready yet, retry
            setTimeout(checkServer, 100)
          }
        }

        // Start checking after a small delay
        setTimeout(checkServer, 500)

        // Timeout after 30 seconds
        setTimeout(() => {
          resume(Effect.die(new Error(`Server on port ${port} failed to start within 30 seconds`)))
        }, 30000)
      })
    }),
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
    WorkerRunner.layerSerialized(ServerMessage, handlers as any),
    NodeWorkerRunner.layer,
  ),
).pipe(NodeRuntime.runMain as any)
