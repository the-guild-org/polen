import { Manifest } from '@wollybeard/kit'

/**
 * Check if a project has a package installed by examining its package.json
 */
export async function checkIsProjectHasPackageInstalled(
  projectRoot: string,
  packageName: string,
): Promise<boolean> {
  const packageJson = await Manifest.resource.read(projectRoot)

  if (!packageJson) {
    return false
  }

  // Check if React is in dependencies or devDependencies
  return !!(packageJson.dependencies?.[packageName] ??
    packageJson.devDependencies?.[packageName])
}
