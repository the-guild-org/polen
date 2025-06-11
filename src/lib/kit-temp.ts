//
//
//
//
//
// Holding Module for Missing @wollybeard/kit Functionality
//
// ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//
// Code here is meant to be migrated eventually to @wollybeard/kit.
//
//
//

import { Fs, Path, Undefined } from '@wollybeard/kit'
import type { ResolveHookContext } from 'node:module'

export const arrayEquals = (a: any[], b: any[]) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export const ensureOptionalAbsoluteWithCwd = (pathExp: string | undefined): string => {
  if (Undefined.is(pathExp)) return process.cwd()
  return Path.ensureAbsolute(pathExp, process.cwd())
}

export const ensureOptionalAbsolute = (pathExp: string | undefined, basePathExp: string): string => {
  assertPathAbsolute(basePathExp)
  if (Undefined.is(pathExp)) return basePathExp
  return Path.ensureAbsolute(pathExp, basePathExp)
}

export const assertPathAbsolute = (pathExpression: string): void => {
  if (Path.isAbsolute(pathExpression)) return
  throw new Error(`Path must be absolute: ${pathExpression}`)
}

export const assertOptionalPathAbsolute = (pathExpression: string | undefined, message?: string): void => {
  if (Undefined.is(pathExpression)) return
  if (Path.isAbsolute(pathExpression)) return
  const message_ = message ?? `Path must be absolute: ${pathExpression}`
  throw new Error(message_)
}

export const pickFirstPathExisting = async (paths: string[]): Promise<string | undefined> => {
  const checks = await Promise.all(paths.map(path => Fs.exists(path).then(exists => exists ? path : undefined)))
  return checks.find(maybePath => maybePath !== undefined)
}

export const isSpecifierFromPackage = (specifier: string, packageName: string): boolean => {
  return specifier === packageName || specifier.startsWith(packageName + `/`)
}

export interface ImportEvent {
  specifier: string
  context: ResolveHookContext
}

export const ObjPick = <T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> => {
  return keys.reduce((acc, key) => {
    if (key in obj) {
      acc[key] = obj[key]
    }
    return acc
  }, {} as Pick<T, K>)
}
