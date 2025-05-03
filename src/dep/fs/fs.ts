import * as JSONC from 'jsonc-parser'
import FS from 'node:fs/promises'
import * as Path from 'node:path'
import type { JsonObject, JsonValue, PackageJson } from 'type-fest'

export {
  access,
  appendFile,
  chmod,
  chown,
  copyFile,
  cp,
  glob,
  lchown,
  link,
  lstat,
  mkdir,
  mkdtemp,
  open,
  opendir,
  readFile,
  readlink,
  realpath,
  rename,
  unlink,
  watch,
  writeFile,
} from 'node:fs/promises'

export const emptyDirIfExists = async (dirPath: string): Promise<void> => {
  await rmDirIfExists(dirPath)
  await FS.mkdir(dirPath)
}

export const rmDirIfExists = async (dirPath: string): Promise<void> => {
  try {
    await rm(dirPath)
  } catch (error_) {
    const error = error_ as NodeJS.ErrnoException
    if (error.code !== `ENOENT`) {
      throw error
    }
  }
}

export const write = async (
  { path, content }: { path: string, content: string | JsonValue },
): Promise<void> => {
  await FS.mkdir(Path.dirname(path), { recursive: true })

  if (typeof content === `string`) {
    await FS.writeFile(path, content)
    return
  }

  await writeJson(path, content)
}

export const read = async (path: string): Promise<File | null> => {
  try {
    const content = await FS.readFile(path, { encoding: `utf-8` })
    return {
      path,
      content,
    }
  } catch (error) {
    if (error instanceof Error && `code` in error && error.code === `ENOENT`) {
      return null
    }
    throw error
  }
}

export const readJson = async <data extends JsonValue>(path: string): Promise<data | undefined> => {
  const jsonFile = await read(path)
  if (jsonFile === null) return undefined
  const json = JSONC.parse(jsonFile.content) as data
  return json
}

export const readPackageJson = async (path: string): Promise<PackageJson> => {
  const packageJsonFile = await read(path)
  if (packageJsonFile === null) throw new Error(`Package.json not found at ${path}`)
  const json = JSON.parse(packageJsonFile.content) as PackageJson
  return json
}

export const writeJson = async (filePath: string, data: JsonValue): Promise<void> => {
  await write({ path: filePath, content: JSON.stringify(data, null, 2) })
}

// eslint-disable-next-line
export const updateJson = async <data extends JsonObject>(
  filePath: string,
  updater: (data: data) => void | Promise<void>,
) => {
  const fileJson = await readJson<data>(filePath)
  if (!fileJson) throw new Error(`File not found at ${filePath}`)

  await updater(fileJson)
  // Delete first to force VSCode to see the change without needing a restart.
  await FS.unlink(filePath)
  await writeJson(filePath, fileJson)
}

export const rm = async (path: string | string[]): Promise<void> => {
  const path_ = Array.isArray(path) ? path : [path]
  await Promise.all(path_.map(p => FS.rm(p, { recursive: true, force: true })))
}

export interface File<$Content = string> {
  path: string
  content: $Content
}
