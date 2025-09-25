import { S } from '#dep/effect'
import { FsLoc } from '@wollybeard/kit'

// Test FsLoc.Extension methods
console.log('FsLoc.Extension methods:')
console.log(Object.keys(FsLoc.Extension).sort().join(', '))
console.log()

// Test files to understand Extension behavior
const testFiles = [
  'get-user.graphql',
  'get-user.1.graphql',
  'get-user.default.graphql',
]

console.log('Testing FsLoc.Extension behavior:')
console.log('='.repeat(60))

for (const filePath of testFiles) {
  const file = S.decodeSync(FsLoc.RelFile.String)(filePath)
  const fullName = FsLoc.name(file)

  // Check if Extension has methods to extract/remove extension
  console.log(`File: "${filePath}"`)
  console.log(`  FsLoc.name():     "${fullName}"`)

  // Try to get extension if possible
  try {
    const ext = FsLoc.Extension.decode(fullName)
    console.log(`  Extension.decode: "${ext}"`)
  } catch (e) {
    console.log(`  Extension.decode: Error - ${e.message}`)
  }

  console.log('-'.repeat(40))
}
