import { mkdir, readFile, rm } from 'node:fs/promises'

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
  rm,
  unlink,
  watch,
  writeFile,
} from 'node:fs/promises'

export const emptyDirIfExists = async (dirPath: string): Promise<void> => {
  await rmDirIfExists(dirPath)
  await mkdir(dirPath)
}

export const rmDirIfExists = async (dirPath: string): Promise<void> => {
  try {
    await rm(dirPath, { recursive: true })
  } catch (error_) {
    const error = error_ as NodeJS.ErrnoException
    if (error.code !== `ENOENT`) {
      throw error
    }
  }
}

export const readFileIfExists = async (filePath: string): Promise<string | null> => {
  try {
    return await readFile(filePath, `utf-8`)
  } catch (error_) {
    const error = error_ as NodeJS.ErrnoException
    if (error.code !== `ENOENT`) {
      throw error
    }
    return null
  }
}
