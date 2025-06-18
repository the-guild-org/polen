import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchModule } from './search-module.ts'

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}))

describe('discoverStep', () => {
  const mockExistsSync = existsSync as ReturnType<typeof vi.fn>
  const baseDir = '/test/project'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('finds workflow-specific step first', () => {
    const workflowPath = join(baseDir, '.github/steps', 'preview', 'pr-comment.ts')
    const generalPath = join(baseDir, '.github/steps', 'pr-comment.ts')

    mockExistsSync.mockImplementation((path) => path === workflowPath)

    const result = searchModule({
      stepName: 'pr-comment',
      workflowName: 'preview',
      baseDir,
    })

    expect(result).toEqual({
      found: true,
      path: workflowPath,
      searchedPaths: [workflowPath],
    })

    // Should not check general path if workflow-specific found
    expect(mockExistsSync).toHaveBeenCalledTimes(1)
  })

  it('falls back to general step if workflow-specific not found', () => {
    const workflowPath = join(baseDir, '.github/steps', 'preview', 'pr-comment.ts')
    const generalPath = join(baseDir, '.github/steps', 'pr-comment.ts')

    mockExistsSync.mockImplementation((path) => path === generalPath)

    const result = searchModule({
      stepName: 'pr-comment',
      workflowName: 'preview',
      baseDir,
    })

    expect(result).toEqual({
      found: true,
      path: generalPath,
      searchedPaths: [workflowPath, generalPath],
    })

    expect(mockExistsSync).toHaveBeenCalledWith(workflowPath)
    expect(mockExistsSync).toHaveBeenCalledWith(generalPath)
  })

  it('searches only general path when no workflow name', () => {
    const generalPath = join(baseDir, '.github/steps', 'build-demos.ts')

    mockExistsSync.mockImplementation((path) => path === generalPath)

    const result = searchModule({
      stepName: 'build-demos',
      baseDir,
    })

    expect(result).toEqual({
      found: true,
      path: generalPath,
      searchedPaths: [generalPath],
    })
  })

  it('returns not found when step does not exist', () => {
    mockExistsSync.mockReturnValue(false)

    const result = searchModule({
      stepName: 'non-existent',
      workflowName: 'preview',
      baseDir,
    })

    expect(result).toEqual({
      found: false,
      searchedPaths: [
        join(baseDir, '.github/steps', 'preview', 'non-existent.ts'),
        join(baseDir, '.github/steps', 'non-existent.ts'),
      ],
    })
  })

  it('uses process.cwd() as default base directory', () => {
    const cwd = process.cwd()
    const generalPath = join(cwd, '.github/steps', 'test.ts')

    mockExistsSync.mockImplementation((path) => path === generalPath)

    const result = searchModule({
      stepName: 'test',
    })

    expect(result.path).toBe(generalPath)
  })
})
