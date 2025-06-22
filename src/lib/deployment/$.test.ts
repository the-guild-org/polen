import { Fs } from '@wollybeard/kit'
import { beforeEach, describe, expect, test } from 'vitest'
import { Deployment } from './$.ts'

describe('metadata', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = await Fs.makeTemporaryDirectory()
  })

  test('writes and reads deployment metadata', async () => {
    const metadata: Deployment.DeploymentMetadata = {
      timestamp: '2024-01-01T00:00:00.000Z',
      pullRequest: {
        number: 123,
        branch: 'feat/awesome',
        commit: 'abc123',
        title: 'Add awesome feature',
        author: 'octocat',
      },
      deployment: {
        url: 'https://example.github.io/repo/pr-123/',
        environment: 'pr-123',
      },
    }

    await Deployment.metadata.write(metadata, testDir)

    const result = await Deployment.metadata.read(testDir)
    expect(result).toEqual(metadata)
  })

  test('creates .deployment.json file', async () => {
    const metadata: Deployment.DeploymentMetadata = {
      timestamp: new Date().toISOString(),
      pullRequest: {
        number: 456,
        branch: 'main',
        commit: 'def456',
      },
      deployment: {
        url: 'https://example.com',
        environment: 'pr-456',
      },
    }

    await Deployment.metadata.write(metadata, testDir)

    const fileExists = await Fs.exists(`${testDir}/.deployment.json`)
    expect(fileExists).toBe(true)
  })
})
