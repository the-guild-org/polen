import { TinyGlobby } from '#dep/tiny-globby/index'
import { Fs, Path } from '@wollybeard/kit'
import { Err } from '@wollybeard/kit'
import { buildManifest, type PolenBuildManifest } from './manifest.ts'

export type RebasePlan = RebaseOverwritePlan | RebaseCopyPlan

export interface RebaseOverwritePlan {
  changeMode: `mutate`
  newBasePath: string
  sourcePath: string
}

export interface RebaseCopyPlan {
  changeMode: `copy`
  newBasePath: string
  sourcePath: string
  targetPath: string
}

export const rebase = async (plan: RebasePlan): Promise<void> => {
  // 1. Validate source is a Polen build
  const manifestResult = await buildManifest.read(plan.sourcePath)
  if (Err.is(manifestResult)) {
    throw new Error(`Polen build manifest not found at: ${Path.join(plan.sourcePath, `.polen`, `build.json`)}`)
  }
  const manifest = manifestResult

  // 2. Validate newBasePath is valid URL path
  if (!isValidUrlPath(plan.newBasePath)) {
    throw new Error(`Invalid base path: ${plan.newBasePath}`)
  }

  // 3. Handle copy vs mutate
  let workingPath: string
  if (plan.changeMode === `copy`) {
    if (await Fs.exists(plan.targetPath)) {
      const isEmpty = await Fs.isEmptyDir(plan.targetPath)
      if (!isEmpty) {
        throw new Error(`Target path already exists and is not empty: ${plan.targetPath}`)
      }
    }
    await Fs.copyDir({ from: plan.sourcePath, to: plan.targetPath })
    workingPath = plan.targetPath
  } else {
    workingPath = plan.sourcePath
  }

  // 4. Update HTML files with new base path
  await updateHtmlFiles(workingPath, manifest.basePath, plan.newBasePath)

  // 5. Update manifest
  await updateManifest(workingPath, { basePath: plan.newBasePath })
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Local Helpers
//
//

// TODO: this is very generic, factor out to kit-temp
const isValidUrlPath = (path: string): boolean => {
  // URL path should start with / and not contain invalid characters
  if (!path.startsWith(`/`)) return false
  if (!path.endsWith(`/`)) return false

  // Basic validation - no spaces, proper URL characters
  const urlPathRegex = /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*\/$/
  return urlPathRegex.test(path)
}

const updateHtmlFiles = async (buildPath: string, oldBasePath: string, newBasePath: string): Promise<void> => {
  // Find all HTML files recursively
  const htmlFiles = await findHtmlFiles(buildPath)

  for (const htmlFile of htmlFiles) {
    await updateHtmlFile(htmlFile, oldBasePath, newBasePath)
  }
}

const findHtmlFiles = async (dir: string): Promise<string[]> => {
  return await TinyGlobby.glob(`**/*.html`, {
    absolute: true,
    cwd: dir,
    onlyFiles: true,
  })
}

const updateHtmlFile = async (filePath: string, oldBasePath: string, newBasePath: string): Promise<void> => {
  const content = await Fs.read(filePath)

  if (content === null) {
    throw new Error(`Could not read HTML file: ${filePath}`)
  }

  // Simple regex-based approach to update base tag
  // Look for existing base tag first
  const baseTagRegex = /<base\s+href\s*=\s*["']([^"']*)["'][^>]*>/i

  let updatedContent: string

  if (baseTagRegex.test(content)) {
    // Update existing base tag
    updatedContent = content.replace(baseTagRegex, `<base href="${newBasePath}">`)
  } else {
    // Insert new base tag in head
    const headRegex = /<head[^>]*>/i
    const headMatch = headRegex.exec(content)

    if (headMatch) {
      const insertPosition = headMatch.index + headMatch[0].length
      updatedContent = content.slice(0, insertPosition)
        + `\n  <base href="${newBasePath}">`
        + content.slice(insertPosition)
    } else {
      throw new Error(`Could not find <head> tag in HTML file: ${filePath}`)
    }
  }

  await Fs.write({ path: filePath, content: updatedContent })
}

const updateManifest = async (buildPath: string, updates: Partial<PolenBuildManifest>): Promise<void> => {
  const manifestPath = Path.join(buildPath, `.polen`, `build.json`)
  const manifestResult = await buildManifest.read(buildPath)
  if (Err.is(manifestResult)) {
    throw new Error(`Polen build manifest not found at: ${manifestPath}`)
  }
  const currentManifest = manifestResult

  const updatedManifest = { ...currentManifest, ...updates }

  await Fs.write({
    path: manifestPath,
    content: JSON.stringify(updatedManifest, null, 2),
  })
}
