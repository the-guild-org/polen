import { S } from '#lib/kit-temp/effect'
import { NodeFileSystem } from '@effect/platform-node'
import { Effect } from 'effect'
import * as NodeFs from 'node:fs/promises'
import * as Path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import * as Resource from './resource.js'

describe('Resource', () => {
  let testDir: string

  beforeEach(async () => {
    // Create a temporary directory for tests
    testDir = Path.join(process.cwd(), 'tmp', `resource-test-${Date.now()}`)
    await NodeFs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory
    if (testDir) {
      await NodeFs.rm(testDir, { recursive: true, force: true })
    }
  })

  // Test schema
  const TestSchema = S.Struct({
    version: S.String,
    count: S.Number,
    items: S.Array(S.String),
    metadata: S.optional(
      S.Struct({
        description: S.String,
        tags: S.Array(S.String),
      }),
    ),
  })

  type TestData = S.Schema.Type<typeof TestSchema>

  const testResource = Resource.create({
    name: 'test-resource',
    path: 'data.json',
    schema: TestSchema,
  })

  describe('read', () => {
    test('successfully reads and decodes valid data', async () => {
      const data: TestData = {
        version: '1.0.0',
        count: 3,
        items: ['a', 'b', 'c'],
      }

      // Write test file
      await NodeFs.writeFile(
        Path.join(testDir, 'data.json'),
        JSON.stringify(data, null, 2),
      )

      const result = await Effect.runPromise(
        testResource.read(testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )
      expect(result).toEqual(data)
    })

    test('successfully reads data with optional fields', async () => {
      const data: TestData = {
        version: '2.0.0',
        count: 5,
        items: ['x', 'y'],
        metadata: {
          description: 'Test data',
          tags: ['test', 'sample'],
        },
      }

      await NodeFs.writeFile(
        Path.join(testDir, 'data.json'),
        JSON.stringify(data, null, 2),
      )

      const result = await Effect.runPromise(
        testResource.read(testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )
      expect(result).toEqual(data)
    })

    test('returns FileNotFound error when file does not exist', async () => {
      await expect(Effect.runPromise(
        testResource.read(testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )).rejects.toThrow('test-resource')
    })

    test('returns ParseError for invalid JSON', async () => {
      await NodeFs.writeFile(
        Path.join(testDir, 'data.json'),
        'not valid json',
      )

      await expect(Effect.runPromise(
        testResource.read(testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )).rejects.toThrow('Invalid JSON')
    })

    test('returns ParseError for data that does not match schema', async () => {
      const invalidData = {
        version: '1.0.0',
        count: 'not a number', // Invalid type
        items: ['a', 'b'],
      }

      await NodeFs.writeFile(
        Path.join(testDir, 'data.json'),
        JSON.stringify(invalidData, null, 2),
      )

      await expect(Effect.runPromise(
        testResource.read(testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )).rejects.toThrow('Invalid data')
    })

    test('handles nested directory paths', async () => {
      const nestedDir = Path.join(testDir, 'nested', 'deep')
      await NodeFs.mkdir(nestedDir, { recursive: true })

      const data: TestData = {
        version: '1.0.0',
        count: 1,
        items: ['nested'],
      }

      await NodeFs.writeFile(
        Path.join(nestedDir, 'data.json'),
        JSON.stringify(data, null, 2),
      )

      const result = await Effect.runPromise(
        testResource.read(nestedDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )
      expect(result).toEqual(data)
    })
  })

  describe('write', () => {
    test('successfully writes and encodes data', async () => {
      const data: TestData = {
        version: '1.0.0',
        count: 3,
        items: ['a', 'b', 'c'],
      }

      await Effect.runPromise(
        testResource.write(data, testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )

      // Verify file was written
      const content = await NodeFs.readFile(
        Path.join(testDir, 'data.json'),
        'utf-8',
      )
      const parsed = JSON.parse(content)
      expect(parsed).toEqual(data)
    })

    test('creates directory if it does not exist', async () => {
      const nonExistentDir = Path.join(testDir, 'new', 'nested', 'dir')
      const data: TestData = {
        version: '1.0.0',
        count: 1,
        items: ['test'],
      }

      await Effect.runPromise(
        testResource.write(data, nonExistentDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )

      // Verify file was written
      const content = await NodeFs.readFile(
        Path.join(nonExistentDir, 'data.json'),
        'utf-8',
      )
      const parsed = JSON.parse(content)
      expect(parsed).toEqual(data)
    })

    test('overwrites existing file', async () => {
      // Write initial data
      await NodeFs.writeFile(
        Path.join(testDir, 'data.json'),
        JSON.stringify({ old: 'data' }),
      )

      const newData: TestData = {
        version: '2.0.0',
        count: 5,
        items: ['new', 'data'],
      }

      await Effect.runPromise(
        testResource.write(newData, testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )

      // Verify new data was written
      const content = await NodeFs.readFile(
        Path.join(testDir, 'data.json'),
        'utf-8',
      )
      const parsed = JSON.parse(content)
      expect(parsed).toEqual(newData)
    })

    test('formats JSON with proper indentation', async () => {
      const data: TestData = {
        version: '1.0.0',
        count: 1,
        items: ['test'],
        metadata: {
          description: 'Test',
          tags: ['a', 'b'],
        },
      }

      await Effect.runPromise(
        testResource.write(data, testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )

      const content = await NodeFs.readFile(
        Path.join(testDir, 'data.json'),
        'utf-8',
      )

      // Check for proper formatting
      expect(content).toContain('  ') // Has indentation
      expect(content.split('\n').length).toBeGreaterThan(1) // Multiple lines
    })
  })

  describe('error guards', () => {
    test('isFileNotFound correctly identifies FileNotFound errors', () => {
      const error = new Resource.FileNotFound({
        path: '/test/path',
        message: 'Not found',
      })
      expect(Resource.isFileNotFound(error)).toBe(true)
      expect(Resource.isReadError(error)).toBe(false)
    })

    test('isReadError correctly identifies ReadError errors', () => {
      const error = new Resource.ReadError({
        path: '/test/path',
        message: 'Read failed',
      })
      expect(Resource.isReadError(error)).toBe(true)
      expect(Resource.isFileNotFound(error)).toBe(false)
    })

    test('isWriteError correctly identifies WriteError errors', () => {
      const error = new Resource.WriteError({
        path: '/test/path',
        message: 'Write failed',
      })
      expect(Resource.isWriteError(error)).toBe(true)
      expect(Resource.isParseError(error)).toBe(false)
    })

    test('isParseError correctly identifies ParseError errors', () => {
      const error = new Resource.ParseError({
        path: '/test/path',
        message: 'Parse failed',
      })
      expect(Resource.isParseError(error)).toBe(true)
      expect(Resource.isEncodeError(error)).toBe(false)
    })

    test('isEncodeError correctly identifies EncodeError errors', () => {
      const error = new Resource.EncodeError({
        message: 'Encode failed',
      })
      expect(Resource.isEncodeError(error)).toBe(true)
      expect(Resource.isReadError(error)).toBe(false)
    })
  })

  describe('complex schemas', () => {
    test('works with transformation schemas', async () => {
      const DateSchema = S.transform(
        S.String,
        S.DateFromSelf,
        {
          decode: (str) => new Date(str),
          encode: (date) => date.toISOString(),
        },
      )

      const resourceWithDates = Resource.create({
        name: 'date-resource',
        path: 'dates.json',
        schema: S.Struct({
          created: DateSchema,
          updated: DateSchema,
        }),
      })

      const data = {
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-15'),
      }

      // Write
      await Effect.runPromise(
        resourceWithDates.write(data, testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )

      // Read back
      const readResult = await Effect.runPromise(
        resourceWithDates.read(testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )
      expect(readResult.created).toEqual(data.created)
      expect(readResult.updated).toEqual(data.updated)

      // Verify the stored format is ISO strings
      const content = await NodeFs.readFile(
        Path.join(testDir, 'dates.json'),
        'utf-8',
      )
      const parsed = JSON.parse(content)
      expect(typeof parsed.created).toBe('string')
      expect(typeof parsed.updated).toBe('string')
    })

    test('works with union schemas', async () => {
      const EventSchema = S.Union(
        S.Struct({
          type: S.Literal('click'),
          x: S.Number,
          y: S.Number,
        }),
        S.Struct({
          type: S.Literal('keypress'),
          key: S.String,
        }),
      )

      const eventResource = Resource.create({
        name: 'event-resource',
        path: 'events.json',
        schema: S.Array(EventSchema),
      })

      const events = [
        { type: 'click' as const, x: 100, y: 200 },
        { type: 'keypress' as const, key: 'Enter' },
      ]

      await Effect.runPromise(
        eventResource.write(events, testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )

      const readResult = await Effect.runPromise(
        eventResource.read(testDir).pipe(Effect.provide(NodeFileSystem.layer)),
      )
      expect(readResult).toEqual(events)
    })
  })
})
