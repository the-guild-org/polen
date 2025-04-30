import {test} from 'playwright/test'

test('debug', async () => {
  console.log((await import(`zx`)).$)
  console.log((await import(`zx/core`)).$)
})
