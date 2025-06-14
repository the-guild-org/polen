// @ts-check
import { promises as fs } from 'node:fs'
import * as path from 'node:path'

/**
 * Build demos for a specific tag
 *
 * @param {Object} options
 * @param {string} options.tag - The version tag to build
 * @param {string[]} options.examples - List of examples to build
 * @param {import('../lib/async-function').AsyncFunctionArguments['exec']} options.exec
 * @param {import('../lib/async-function').AsyncFunctionArguments['core']} options.core
 */
export async function buildDemosForTag({ tag, examples, exec, core }) {
  console.log(`Building demos for ${tag}...`)

  for (const example of examples) {
    // Skip if example doesn't exist in this version
    try {
      await fs.access(`examples/${example}`)
    } catch {
      console.log(`Skipping ${example} - not found in this version`)
      continue
    }

    console.log(`Building ${example} for release ${tag}`)
    await exec.exec('pnpm', [
      '--dir',
      `examples/${example}`,
      'build',
      '--base',
      `/polen/${tag}/${example}/`,
    ])
  }
}

/**
 * Deploy built demos to a directory
 *
 * @param {Object} options
 * @param {string} options.tag - The version tag
 * @param {string[]} options.examples - List of examples
 * @param {string} options.targetDir - Target directory for deployment
 */
export async function deployDemos({ tag, examples, targetDir }) {
  for (const example of examples) {
    const buildDir = `examples/${example}/build`
    try {
      await fs.access(buildDir)
      const destDir = path.join(targetDir, tag, example)
      await fs.mkdir(path.dirname(destDir), { recursive: true })
      await fs.cp(buildDir, destDir, { recursive: true })
    } catch (e) {
      console.log(`Skipping ${example} - no build directory found`)
    }
  }
}

/**
 * Update base paths in deployed content
 *
 * @param {Object} options
 * @param {string} options.directory - Directory containing the content
 * @param {string} options.fromPath - Original base path
 * @param {string} options.toPath - New base path
 * @param {import('../lib/async-function').AsyncFunctionArguments['exec']} options.exec
 */
export async function updateBasePaths({ directory, fromPath, toPath, exec }) {
  console.log(`Updating base paths from ${fromPath} to ${toPath}`)

  // Use perl for reliable path replacement
  await exec.exec('find', [
    directory,
    '-type',
    'f',
    '(',
    '-name',
    '*.html',
    '-o',
    '-name',
    '*.js',
    '-o',
    '-name',
    '*.css',
    '-o',
    '-name',
    '*.json',
    ')',
    '-exec',
    'perl',
    '-i',
    '-pe',
    `s|${fromPath.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')}|${toPath}|g`,
    '{}',
    '+',
  ])
}

/**
 * Create dist-tag content by copying from semver directory
 *
 * @param {Object} options
 * @param {string} options.ghPagesDir - Path to gh-pages directory
 * @param {string} options.distTag - Dist tag name (latest/next)
 * @param {string} options.semverTag - Semver version it points to
 * @param {import('../lib/async-function').AsyncFunctionArguments['exec']} options.exec
 */
export async function updateDistTagContent({
  ghPagesDir,
  distTag,
  semverTag,
  exec,
}) {
  const distTagPath = path.join(ghPagesDir, distTag)
  const semverPath = path.join(ghPagesDir, semverTag)

  // Check if semver deployment exists
  try {
    await fs.access(semverPath)
  } catch {
    throw new Error(`Deployment for ${semverTag} not found in gh-pages`)
  }

  // Remove old dist-tag directory if it exists
  try {
    await fs.rm(distTagPath, { recursive: true })
    console.log(`Removed old ${distTag} directory`)
  } catch {
    // Directory doesn't exist, that's fine
  }

  // Copy the semver deployment to the dist-tag name
  console.log(`Copying ${semverTag} to ${distTag}`)
  await fs.cp(semverPath, distTagPath, { recursive: true })

  // Update paths
  await updateBasePaths({
    directory: distTagPath,
    fromPath: `/polen/${semverTag}/`,
    toPath: `/polen/${distTag}/`,
    exec,
  })

  console.log(
    `✅ Successfully updated ${distTag} with content from ${semverTag}`,
  )
}
