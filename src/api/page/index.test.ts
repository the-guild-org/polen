import { describe, expect } from 'vitest'
import { unit } from '../../../tests/unit/helpers/test.js'
import { Page } from './index.js'

unit(`empty if no applicable files`, async ({ project }) => {
  await project.fileStorage.set({ 'foo.txt': `bar` })
  const pageBranches = await Page.readAll({ dir: project.dir })
  expect(pageBranches).toEqual([])
})

unit(`file in root directory`, async ({ project }) => {
  await project.fileStorage.set({ 'pages/foo.md': `foo` })
  const pageBranches = await Page.readAll({ dir: project.dir })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

unit(`file in nested directory`, async ({ project }) => {
  await project.fileStorage.set({ 'pages/foo/bar.md': `foo` })
  const pageBranches = await Page.readAll({ dir: project.dir })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

unit(`multiple files`, async ({ project }) => {
  await project.fileStorage.set({ 'pages/foo.md': `foo`, 'pages/bar.md': `bar` })
  const pageBranches = await Page.readAll({ dir: project.dir })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

unit(`index file`, async ({ project }) => {
  await project.fileStorage.set({ 'pages/index.md': `foo` })
  const pageBranches = await Page.readAll({ dir: project.dir })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

unit(`index file nested`, async ({ project }) => {
  await project.fileStorage.set({ 'pages/about/index.md': `foo` })
  const pageBranches = await Page.readAll({ dir: project.dir })
  expect(stabilzeFilePath(pageBranches)).toMatchSnapshot()
})

describe(`linter`, () => {
  unit(`conflicting index and exact are fixed by linter`, async ({ project, project2 }) => {
    await project.fileStorage.set({
      'pages/about/index.md': `about-index`,
      'pages/about.md': `about-exact`,
    })
    const pageBranches = await Page.readAll({ dir: project.dir })
    const lintResult = Page.lint(pageBranches)
    const lintResultStable = stabilzeFilePath(lintResult)
    expect(lintResultStable.warnings).toMatchSnapshot()

    // Demonstrate that result is as-if the about.md was removed.
    await project2.fileStorage.set({ 'pages/about/index.md': `about-index` })
    const pageBranches2 = await Page.readAll({ dir: project2.dir })
    const lintResult2 = Page.lint(pageBranches2)
    const lintResultStable2 = stabilzeFilePath(lintResult2)
    expect(lintResultStable.fixed).toEqual(lintResultStable2.fixed)
  })
})

// Helpers

const stabilzeFilePath = <value extends object>(value: value): value => {
  const string = JSON.stringify(value, null, 2)
  const stringStable = string.replaceAll(/"\/.+(pages\/.+)"/g, `"<VARIABLE>/$1"`)
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
