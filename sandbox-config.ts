import { S } from '#dep/effect'
import { ExamplesConfig } from './src/api/examples/config.js'

const decodeExamplesConfig = S.decodeSync(ExamplesConfig)

console.log('Testing ExamplesConfig decoding with boolean shorthand:')
console.log('='.repeat(60))

// Test with true
const resultTrue = decodeExamplesConfig(true)
console.log('Input: true')
console.log('Result:', resultTrue)
console.log('Has display property:', 'display' in resultTrue)
console.log('Display value:', resultTrue.display)
console.log('-'.repeat(40))

// Test with false
const resultFalse = decodeExamplesConfig(false)
console.log('Input: false')
console.log('Result:', resultFalse)
console.log('Has display property:', 'display' in resultFalse)
console.log('-'.repeat(40))

// Test with object having undefined display
const resultObj = decodeExamplesConfig({ display: undefined })
console.log('Input: { display: undefined }')
console.log('Result:', resultObj)
console.log('Has display property:', 'display' in resultObj)
console.log('Display value:', resultObj.display)
