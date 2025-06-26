import { filePathToRouteLogical } from '#lib/file-router/scan'
import { Path } from '@wollybeard/kit'

// Test parsing of numbered directory
const testPath1 = Path.parse(`a/10_b/index.md`)
const logical1 = filePathToRouteLogical(testPath1)
console.log(`Path 1:`, testPath1)
console.log(`Logical 1:`, logical1)

// Test parsing of numbered file
const testPath2 = Path.parse(`a/10_b/g.md`)
const logical2 = filePathToRouteLogical(testPath2)
console.log(`\nPath 2:`, testPath2)
console.log(`Logical 2:`, logical2)

// Test directory structure
const testPath3 = Path.parse(`a/30_d/index.md`)
const logical3 = filePathToRouteLogical(testPath3)
console.log(`\nPath 3:`, testPath3)
console.log(`Logical 3:`, logical3)
