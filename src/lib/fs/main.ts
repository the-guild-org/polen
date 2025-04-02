import { mkdir, rm } from 'node:fs/promises'

export { mkdir, readFile, rename, rm, unlink } from 'node:fs/promises'

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
