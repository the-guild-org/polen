import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import type { WorkflowStepArgs } from '../../workflow-steps/types.ts'

interface BuildDemosForTagOptions {
  tag: string
  examples: string[]
  $: WorkflowStepArgs['$']
  core: WorkflowStepArgs['core']
}

export async function buildDemosForTag({ tag, examples, $ }: BuildDemosForTagOptions): Promise<void> {
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
    await $`pnpm --dir examples/${example} build --base /polen/${tag}/${example}/`
  }
}

interface DeployDemosOptions {
  tag: string
  examples: string[]
  targetDir: string
}

export async function deployDemos({ tag, examples, targetDir }: DeployDemosOptions): Promise<void> {
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

interface UpdateBasePathsOptions {
  directory: string
  fromPath: string
  toPath: string
  $: WorkflowStepArgs['$']
}

export async function updateBasePaths({ directory, fromPath, toPath, $ }: UpdateBasePathsOptions): Promise<void> {
  console.log(`Updating base paths from ${fromPath} to ${toPath}`)

  // Use perl for reliable path replacement
  const escapedFromPath = fromPath.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  await $`find ${directory} -type f \\( -name '*.html' -o -name '*.ts' -o -name '*.css' -o -name '*.json' \\) -exec perl -i -pe "s|${escapedFromPath}|${toPath}|g" {} +`
}

interface UpdateDistTagContentOptions {
  ghPagesDir: string
  distTag: string
  semverTag: string
  $: WorkflowStepArgs['$']
}

export async function updateDistTagContent({
  ghPagesDir,
  distTag,
  semverTag,
  $,
}: UpdateDistTagContentOptions): Promise<void> {
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
    $,
  })

  console.log(
    `✅ Successfully updated ${distTag} with content from ${semverTag}`,
  )
}
