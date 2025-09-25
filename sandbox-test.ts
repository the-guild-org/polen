import { FsLoc } from '@wollybeard/kit'
import { HashMap } from 'effect'
import { Version, VersionCoverage } from 'graphql-kit'
import * as scanner from './src/api/examples/scanner.js'

const v1 = Version.decodeSync('1')
const v2 = Version.decodeSync('2')
const v3 = Version.decodeSync('3')
const schemaVersions = [v1, v2, v3]

const grouped = new Map([['example', {
  unversioned: FsLoc.fromString('example.graphql'),
  versioned: new Map([[v1, FsLoc.fromString('example.1.graphql')]]),
}]])

const resolved = scanner.resolveDefaultFiles(grouped, schemaVersions)
const example = resolved.get('example')!

console.log('Unversioned:', example.unversioned)
console.log('Version documents size:', HashMap.size(example.versionDocuments))

const entries = [...HashMap.entries(example.versionDocuments)]
console.log('\nAll entries:')
entries.forEach(([coverage, file]) => {
  console.log(`  Coverage: ${JSON.stringify(coverage)}`)
  console.log(`  File: ${FsLoc.encodeSync(file)}`)
  console.log('---')
})

const defaultEntry = entries.find(([_, value]) => FsLoc.encodeSync(value) === 'example.graphql')
console.log('\nFound default entry:', !!defaultEntry)
