import { fileURLToPath } from 'url'

console.log(import.meta.url)
console.log(fileURLToPath(import.meta.url))
console.log(fileURLToPath(`file:///a/b/c`))
