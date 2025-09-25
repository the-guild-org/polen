import { NodeWorker } from '@effect/platform-node'
import { Worker as NodeWorkerThread } from 'node:worker_threads'

// ============================================================================
// Server Spawner
// ============================================================================

/**
 * Creates a layer for spawning server processes.
 * Each server runs in its own worker thread.
 */
export const createServerSpawner = (workerPath: string) =>
  NodeWorker.layer((id: number) => {
    // For TypeScript files, we need to use tsx import
    const isTypeScript = workerPath.endsWith('.ts')

    if (isTypeScript) {
      // Use tsx import for TypeScript (Node 20.6+ / 18.19+)
      return new NodeWorkerThread(workerPath, {
        execArgv: ['--import', 'tsx'],
        env: {
          ...process.env,
          WORKER_ID: String(id),
        },
      })
    } else {
      // For JavaScript, use worker threads directly
      return new NodeWorkerThread(workerPath, {
        env: {
          ...process.env,
          WORKER_ID: String(id),
        },
      })
    }
  })

// ============================================================================
// Page Generator Spawner
// ============================================================================

/**
 * Creates a layer for spawning page generator workers.
 * Each generator runs in a worker thread for better performance.
 */
export const createPageSpawner = (workerPath: string) =>
  NodeWorker.layer((id: number) => {
    // For TypeScript files, we need to use tsx import
    const isTypeScript = workerPath.endsWith('.ts')

    if (isTypeScript) {
      // Use tsx import for TypeScript (Node 20.6+ / 18.19+)
      return new NodeWorkerThread(workerPath, {
        execArgv: ['--import', 'tsx'],
        env: {
          ...process.env,
          WORKER_ID: String(id),
        },
      })
    } else {
      // For JavaScript, use worker threads directly
      return new NodeWorkerThread(workerPath, {
        env: {
          ...process.env,
          WORKER_ID: String(id),
        },
      })
    }
  })
