import { FileSystem, Path } from '@effect/platform'
import { Effect } from 'effect'
import * as path from 'node:path'

interface GlobalLocalCheckOptions {
  /**
   * The package name to check for (e.g., 'polen', 'eslint', etc.)
   */
  packageName: string
  /**
   * The current executable path (typically process.argv[1])
   */
  currentExecutablePath: string
  /**
   * The flag name to bypass the check (default: '--allow-global')
   */
  allowGlobalFlag?: string
  /**
   * Custom error message template
   */
  errorMessageTemplate?: {
    title?: string
    explanation?: string
    solutions?: string[]
    bypassInstructions?: string
  }
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

/**
 * Check if a package exists in any package.json from the current directory up to root
 */
const findPackageInAncestors = (packageName: string): Effect.Effect<string | null, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    let dir = process.cwd()

    while (true) {
      const packageJsonPath = path.join(dir, 'package.json')
      const fs = yield* FileSystem.FileSystem

      try {
        const content = yield* fs.readFileString(packageJsonPath)
        const pkg: PackageJson = JSON.parse(content)

        if (
          pkg.dependencies?.[packageName]
          || pkg.devDependencies?.[packageName]
          || pkg.peerDependencies?.[packageName]
        ) {
          return dir
        }
      } catch {
        // No package.json in this directory, continue
      }

      const parent = path.dirname(dir)
      if (parent === dir) {
        // Reached root directory
        break
      }
      dir = parent
    }

    return null
  })

/**
 * Create a descriptive error for global vs local package conflicts
 */
function createGlobalLocalConflictError(
  packageName: string,
  projectDir: string,
  template?: GlobalLocalCheckOptions['errorMessageTemplate'],
): Error {
  const defaultSolutions = [
    `pnpm exec ${packageName} <command>`,
    `npx ${packageName} <command>`,
    `./node_modules/.bin/${packageName} <command>`,
  ]

  const title = template?.title || `Global ${packageName} running in project with local ${packageName}`
  const explanation = template?.explanation
    || `This project has ${packageName} in its package.json at ${projectDir}, but you're using a global ${packageName} installation. `
      + `This can cause version mismatches and unexpected behavior.`
  const solutions = template?.solutions || defaultSolutions
  const bypassInstructions = template?.bypassInstructions || `${packageName} <command> --allow-global`

  const message = `
${title}

${explanation}

To use the project's ${packageName}:
${solutions.map(s => `  • ${s}`).join('\n')}

To bypass this check:
  • ${bypassInstructions}
`.trim()

  return new Error(message)
}

/**
 * Check if a globally installed package is being run in a project that has the package installed locally.
 * This helps prevent version conflicts and confusion.
 *
 * @example
 * ```typescript
 * // In your CLI entry point
 * await Effect.runPromise(
 *   Effect.provide(
 *     checkGlobalVsLocal({
 *       packageName: 'my-cli',
 *       currentExecutablePath: process.argv[1]
 *     }),
 *     NodeFileSystem.layer
 *   )
 * )
 * ```
 */
export const checkGlobalVsLocal = (
  options: GlobalLocalCheckOptions,
): Effect.Effect<void, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const {
      packageName,
      currentExecutablePath,
      allowGlobalFlag = '--allow-global',
    } = options

    // Check if running from global install
    // Common global installation patterns:
    // - pnpm: /Users/.../Library/pnpm/packagename
    // - npm: /usr/local/lib/node_modules/packagename
    // - yarn: /Users/.../config/yarn/global/node_modules/packagename
    const isGlobalInstall = currentExecutablePath.includes('pnpm/global')
      || currentExecutablePath.includes('.npm/global')
      || currentExecutablePath.includes('yarn/global')
      || currentExecutablePath.includes(`/Library/pnpm/${packageName}`)
      || currentExecutablePath.includes('/usr/local/lib/node_modules/')
      || currentExecutablePath.includes('/usr/lib/node_modules/')
      || !currentExecutablePath.includes(`node_modules/${packageName}`)

    if (!isGlobalInstall) {
      // Running from local install, all good
      return
    }

    // Check for bypass flag
    if (process.argv.includes(allowGlobalFlag)) {
      return
    }

    // Check if package exists in any ancestor package.json
    const projectDir = yield* findPackageInAncestors(packageName)

    if (projectDir) {
      return yield* Effect.fail(createGlobalLocalConflictError(packageName, projectDir, options.errorMessageTemplate))
    }
  })

/**
 * Legacy Promise-based wrapper for backward compatibility.
 * @deprecated Use the Effect-based version with appropriate Effect runtime
 */
export async function checkGlobalVsLocalAsync(options: GlobalLocalCheckOptions): Promise<void> {
  const { NodeFileSystem } = await import('@effect/platform-node')
  return Effect.runPromise(
    Effect.provide(
      checkGlobalVsLocal(options),
      NodeFileSystem.layer,
    ),
  )
}
