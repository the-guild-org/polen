// Test that our helpers module compiles correctly
import { createSingleRevisionCatalog, mapToInputSourceError, normalizePathToAbs } from './src/api/schema/input-source/helpers.js'
import { FsLoc } from '@wollybeard/kit'
import { buildSchema } from 'graphql'

// Test normalizePathToAbs
const projectRoot = FsLoc.AbsDir.decodeSync('/project/')
const defaultFile = FsLoc.RelFile.decodeSync('schema.graphql')
const defaultDir = FsLoc.RelDir.decodeSync('schema/')

// Test with string
const path1 = normalizePathToAbs.file('./test.graphql', projectRoot, defaultFile)
const path2 = normalizePathToAbs.dir('./test/', projectRoot, defaultDir)

// Test with FsLoc types
const path3 = normalizePathToAbs.file(FsLoc.AbsFile.decodeSync('/abs/file.graphql'), projectRoot, defaultFile)
const path4 = normalizePathToAbs.dir(FsLoc.RelDir.decodeSync('rel/'), projectRoot, defaultDir)

// Test with undefined
const path5 = normalizePathToAbs.file(undefined, projectRoot, defaultFile)
const path6 = normalizePathToAbs.dir(undefined, projectRoot, defaultDir)

// Test mapToInputSourceError
const errorMapper = mapToInputSourceError('test-source')
const mappedError = errorMapper(new Error('test error'))

// Test createSingleRevisionCatalog
const schema = buildSchema(`type Query { hello: String }`)
const catalogEffect = createSingleRevisionCatalog(schema, 'test-source')

console.log('✓ All helper functions type-check correctly!')