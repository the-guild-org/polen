import { S } from '#dep/effect'
import { FsLoc } from '@wollybeard/kit'

// Test FsLoc.name behavior with various file paths
const testFiles = [
  'get-user.graphql',
  'get-user.1.graphql',
  'get-user.default.graphql',
  'example.txt',
  'nested/path/file.extension',
  'multiple.dots.in.name.txt',
]

console.log('Testing FsLoc.name behavior:\n')
console.log('='.repeat(60))

for (const filePath of testFiles) {
  const file = S.decodeSync(FsLoc.RelFile.String)(filePath)
  const name = FsLoc.name(file)

  console.log(`Input:  "${filePath}"`)
  console.log(`Output: "${name}"`)
  console.log('-'.repeat(40))
}

// Also test what we might expect
console.log('\nWhat we probably want for parsing versions:')
console.log('='.repeat(60))

for (const filePath of testFiles) {
  const file = S.decodeSync(FsLoc.RelFile.String)(filePath)
  const fullName = FsLoc.name(file)

  // Manual extraction of base name without extension
  const lastDotIndex = fullName.lastIndexOf('.')
  const nameWithoutExt = lastDotIndex > 0 ? fullName.substring(0, lastDotIndex) : fullName
  const extension = lastDotIndex > 0 ? fullName.substring(lastDotIndex + 1) : ''

  console.log(`File: "${filePath}"`)
  console.log(`  FsLoc.name():     "${fullName}"`)
  console.log(`  Without ext:      "${nameWithoutExt}"`)
  console.log(`  Extension:        "${extension}"`)
  console.log('-'.repeat(40))
}
