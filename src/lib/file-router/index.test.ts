import { Fn } from '@wollybeard/kit'
import { Effect } from 'effect'
import { describe, expect } from 'vitest'
import { test } from '../../../tests/unit/helpers/test-with-fixtures.js'
import { FileRouter } from './$.js'

/* Note

todo: better assertion library
Cannot match patterns on properties:
absolute: { dir: expect.stringMatching(/^pages\/$/) },

*/

const $ = Fn.$identityPartial<FileRouter.ScanResult> // subset data factory
const scan = (path: string) => Effect.runPromise(FileRouter.scan({ dir: path + '/pages' }))

describe('.scan', () => {
  describe('literal', () => {
    test('at root', async ({ project }) => {
      await project.layout.set({ 'pages/a.md': '' })
      const routes = await scan(project.dir)
      expect(routes).toMatchObject($({
        routes: [{
          logical: { path: ['a'] },
          file: { path: { relative: { dir: '', base: 'a.md' } } },
        }],
      }))
    })
    test('nested', async ({ project }) => {
      await project.layout.set({ 'pages/a/b.md': '' })
      const routes = await scan(project.dir)
      expect(routes).toMatchObject($({
        routes: [{
          logical: { path: ['a', 'b'] },
          file: { path: { relative: { dir: 'a', base: 'b.md' } } },
        }],
      }))
    })
  })
  describe('index', () => {
    test('at root', async ({ project }) => {
      await project.layout.set({ 'pages/index.md': '' })
      const routes = await scan(project.dir)
      expect(routes).toMatchObject($({
        routes: [{
          logical: { path: [] },
          file: { path: { relative: { dir: '', base: 'index.md' } } },
        }],
      }))
    })
    test('nested', async ({ project }) => {
      await project.layout.set({ 'pages/a/index.md': '' })
      const routes = await scan(project.dir)
      expect(routes).toMatchObject($({
        routes: [{
          logical: { path: ['a'] },
          file: { path: { relative: { dir: 'a', base: 'index.md' } } },
        }],
      }))
    })
  })
  describe('diagnostic literal+index conflict', () => {
    test('catches literal+index file route conflict', async ({ project }) => {
      await project.layout.set({ 'pages/a.md': '', 'pages/a/index.md': '' })
      const routes = await scan(project.dir)
      expect(routes).toMatchObject($({
        diagnostics: [{}],
        routes: [{
          logical: { path: ['a'] },
          file: { path: { relative: { dir: '', base: 'a.md' } } },
        }],
      }))
    })
  })
})
