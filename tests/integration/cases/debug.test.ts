import { expect, test } from 'playwright/test'
import { $ } from 'zx'

console.log(await import(`zx`))
console.log((await import(`zx`)).$)

test(`is there`, () => {
  expect($).toBeDefined()
})
