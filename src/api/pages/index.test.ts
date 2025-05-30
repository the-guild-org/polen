import { describe, expect } from 'vitest'
import { test } from '../../../tests/unit/helpers/test.js'
import { Pages } from './index.js'

test('empty if no applicable files', async ({ project }) => {
  await project.layout.set({ 'foo.txt': 'bar' })
  const pageBranches = await Pages.scan({ dir: project.dir + '/pages' })
  expect(pageBranches).toEqual([])
})

test('file in root directory', async ({ project }) => {
  await project.layout.set({ 'pages/foo.md': 'foo' })
  const pageBranches = await Pages.scan({ dir: project.dir + '/pages' })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

test('file in nested directory', async ({ project }) => {
  await project.layout.set({ 'pages/foo/bar.md': 'foo' })
  const pageBranches = await Pages.scan({ dir: project.dir + '/pages' })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

test('multiple files', async ({ project }) => {
  await project.layout.set({ 'pages/foo.md': 'foo', 'pages/bar.md': 'bar' })
  const pageBranches = await Pages.scan({ dir: project.dir + '/pages' })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

test('index file', async ({ project }) => {
  await project.layout.set({ 'pages/index.md': 'foo' })
  const pageBranches = await Pages.scan({ dir: project.dir + '/pages' })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

test('index file nested', async ({ project }) => {
  await project.layout.set({ 'pages/about/index.md': 'foo' })
  const pageBranches = await Pages.scan({ dir: project.dir + '/pages' })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

describe('linter', () => {
  test('conflicting index and exact are fixed by linter', async ({ project }) => {
    await project.layout.set({
      'pages/about/index.md': 'about-index',
      'pages/about.md': 'about-exact',
    })
    const result = await Pages.scan({ dir: project.dir + '/pages' })
    expect(result.diagnostics).toMatchSnapshot()
  })
})

// Helpers

const stabilzeFilePath = <value extends object>(value: value): value => {
  const string = JSON.stringify(value, null, 2)
  const stringStable = string.replaceAll(/"\/.+(pages\/.+)"/g, '"<VARIABLE>/$1"')
  return JSON.parse(stringStable)
}

// const stabilzeFilePath3 = (pageBranch: Page.PageBranch[]): Page.PageBranch[] => {
//   pageBranch.forEach(pageBranch => {
//     if (pageBranch.type === `PageBranchContent`) {
//       pageBranch.file.path = pageBranch.file.path.replace(/\/.+(pages\/.+)/, `<VARIABLE>/$1`)
//     }
//     stabilzeFilePath(pageBranch.branches)
//   })

//   return pageBranch
// }
