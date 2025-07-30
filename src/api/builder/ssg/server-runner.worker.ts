/**
 * Worker pool task that runs a Polen server for SSG.
 * This is executed in a child process by workerpool.
 */
import { debugPolen } from '#singletons/debug'
import { spawn } from 'node:child_process'

const debug = debugPolen.sub(`api:ssg:server-runner`)

export interface ServerConfig {
  serverPath: string
  port: number
}

let serverProcess: ReturnType<typeof spawn> | null = null

/**
 * Start a Polen server on the specified port.
 */
export async function startServer(config: ServerConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    debug(`Starting server with command: node ${config.serverPath}`)
    serverProcess = spawn('node', [config.serverPath], {
      env: {
        ...process.env,
        PORT: config.port.toString(),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    serverProcess.stdout?.on('data', (data) => {
      debug(`[Server ${config.port}] stdout`, data.toString().trim())
    })

    serverProcess.stderr?.on('data', (data) => {
      debug(`[Server ${config.port}] stderr`, data.toString().trim())
    })

    serverProcess.on('error', (error) => {
      reject(new Error(`Server failed to start on port ${config.port}: ${error.message}`))
    })

    serverProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited with code ${code} (signal: ${signal})`))
      }
    })

    // Check if server is ready by polling
    const checkServer = async () => {
      try {
        const response = await fetch(`http://localhost:${config.port}/`)
        if (response.ok || response.status === 404) {
          debug(`[Server ${config.port}] Ready!`)
          resolve()
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
      reject(new Error(`Server on port ${config.port} failed to start within 30 seconds`))
    }, 30000)
  })
}

/**
 * Stop the server gracefully.
 */
export async function stopServer(): Promise<void> {
  if (serverProcess) {
    serverProcess.kill('SIGTERM')
    // Give it time to shut down gracefully
    await new Promise(resolve => setTimeout(resolve, 500))
    if (!serverProcess.killed) {
      serverProcess.kill('SIGKILL')
    }
    serverProcess = null
  }
}

// Register with workerpool for ESM
import workerpool from 'workerpool'

workerpool.worker({
  startServer,
  stopServer,
})
