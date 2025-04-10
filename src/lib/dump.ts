import { inspect } from 'node:util'

export const dump = (value: any) => {
  console.log(inspect(value, { depth: 20, colors: true }))
}
