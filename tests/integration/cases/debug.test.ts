import { expect, test } from 'playwright/test'
import { $ } from 'zx'

console.log(await import(`zx`))
console.log((await import(`zx`)).$)

console.log(await import(`zx/core`))
console.log((await import(`zx/core`)).$)


test(`is there`, () => {
  expect($).toBeDefined()
})
