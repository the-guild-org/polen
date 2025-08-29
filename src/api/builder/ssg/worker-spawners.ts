import { NodeWorker } from '@effect/platform-node'
import { Path } from '@wollybeard/kit'
import { spawn } from 'node:child_process'
import { Worker as NodeWorkerThread } from 'node:worker_threads'

// ============================================================================
// Server Spawner
// ============================================================================

/**
 * Creates a layer for spawning server processes.
 * Each server runs in its own child process.
 */
export const createServerSpawner = (workerPath: string) =>
  NodeWorker.layer((id: number) =>
    spawn('node', [
      '--experimental-strip-types',
      '--disable-warning=ExperimentalWarning',
      workerPath,
    ], {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      env: {
        ...process.env,
        WORKER_ID: String(id),
      },
    })
  )

// ============================================================================
// Page Generator Spawner
// ============================================================================

/**
 * Creates a layer for spawning page generator workers.
 * Each generator runs in a worker thread for better performance.
 */
export const createPageSpawner = (workerPath: string) =>
  NodeWorker.layer((id: number) =>
    new NodeWorkerThread(workerPath, {
      execArgv: ['--experimental-strip-types', '--disable-warning=ExperimentalWarning'],
      workerData: { workerId: id },
    })
  )
